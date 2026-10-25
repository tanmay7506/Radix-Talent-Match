"""
Phase 3 Mathematical Verification Tests for RADIX Talent Check Scoring.

Verifies the 10 required audit scenarios against the mathematical formula:
  readiness_score = round( (1 / |Assessed|) * sum( min(candidate_level / required_level, 1.0) ) * 100, 2 )
  coverage_percentage = round( (|Assessed| / |Total Categories|) * 100, 2 )
"""

import pytest
from pydantic import ValidationError
from app.schemas import CandidateProfile, SkillsetGap
from app.scoring import (
    CATEGORIES,
    calculate_readiness,
    run_talent_check,
)


def make_requirements(base_level: int = 5, overrides: dict[str, int] | None = None) -> dict[str, int]:
    reqs = {cat: base_level for cat in CATEGORIES}
    if overrides:
        reqs.update(overrides)
    return reqs


def make_profile(skills_data: list[dict]) -> CandidateProfile:
    return CandidateProfile(
        name="Audit Candidate",
        email="audit@example.com",
        skills=skills_data,
        preferred_roles=["Software Engineer"],
    )


# ---------------------------------------------------------------------------
# Case 1: A candidate meets every assessed requirement (levels == required)
# ---------------------------------------------------------------------------
def test_case_1_meets_every_assessed_requirement():
    """
    Every assessed category has candidate_level == required_level.
    Attainment for each = min(required / required, 1.0) = 1.0.
    Score MUST be 100.0%.
    """
    reqs = make_requirements(5)
    # Provide 3 assessed skills at exact required level
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 5},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 5},
        {"skill_name": "Design", "category_code": "OOD", "level": 5},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.assessed_categories == 3
    assert result.total_categories == 12
    assert result.skills_meeting_requirement == 3
    assert result.skills_below_requirement == 0
    assert result.skills_not_assessed == 9
    assert result.readiness_score == 100.0
    assert result.coverage_percentage == 25.0


# ---------------------------------------------------------------------------
# Case 2: A candidate exceeds every required skill level (levels > required)
# ---------------------------------------------------------------------------
def test_case_2_exceeds_every_required_skill_level():
    """
    Candidate level > required level.
    Attainment score caps at 1.0 (100%), not artificially inflated above 100.
    """
    reqs = make_requirements(5)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 9},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 8},
        {"skill_name": "Design", "category_code": "OOD", "level": 10},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.readiness_score == 100.0
    # Verify individual gaps are 0
    for g in result.skillset_gap:
        if g.candidate_level is not None:
            assert g.candidate_level > g.required_level
            assert g.gap == 0
            assert g.meets_requirement is True


# ---------------------------------------------------------------------------
# Case 3: A candidate falls below one required skill level
# ---------------------------------------------------------------------------
def test_case_3_falls_below_one_required_skill_level():
    """
    2 skills meet requirement (5/5 = 1.0, 5/5 = 1.0),
    1 skill falls below (3/5 = 0.6).
    Expected score = round((1.0 + 1.0 + 0.6) / 3 * 100, 2) = round(2.6 / 3 * 100, 2) = 86.67%.
    """
    reqs = make_requirements(5)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 5},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 5},
        {"skill_name": "Design", "category_code": "OOD", "level": 3},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.skills_meeting_requirement == 2
    assert result.skills_below_requirement == 1
    expected_score = round(((1.0 + 1.0 + (3.0 / 5.0)) / 3.0) * 100, 2)
    assert expected_score == 86.67
    assert result.readiness_score == 86.67


# ---------------------------------------------------------------------------
# Case 4: A candidate falls below several required skill levels
# ---------------------------------------------------------------------------
def test_case_4_falls_below_several_required_skill_levels():
    """
    Required: 10 across all categories.
    Candidate: COD=8, DSA=6, OOD=4, SWE=5.
    Attainments: 8/10=0.8, 6/10=0.6, 4/10=0.4, 5/10=0.5.
    Sum = 2.3. Average = 2.3 / 4 = 0.575.
    Expected readiness = 57.5%.
    """
    reqs = make_requirements(10)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 8},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 6},
        {"skill_name": "Design", "category_code": "OOD", "level": 4},
        {"skill_name": "SWE", "category_code": "SWE", "level": 5},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.skills_meeting_requirement == 0
    assert result.skills_below_requirement == 4
    assert result.readiness_score == 57.5


# ---------------------------------------------------------------------------
# Case 5: A candidate has missing or unassessed required skills
# ---------------------------------------------------------------------------
def test_case_5_missing_or_unassessed_skills():
    """
    Candidate only has 2 of 12 skills assessed.
    Missing skills must have candidate_level=None, gap=None, meets_requirement=None.
    Missing skills must NOT be treated as level 0 or as failed.
    Coverage is 2/12 = 16.67%.
    Readiness is calculated ONLY across assessed skills.
    """
    reqs = make_requirements(6)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 6},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 3},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.assessed_categories == 2
    assert result.skills_not_assessed == 10
    assert result.coverage_percentage == round(2 / 12 * 100, 2)  # 16.67%
    # Attainments: 6/6=1.0, 3/6=0.5 -> average = 0.75 -> 75.0%
    assert result.readiness_score == 75.0

    unassessed = [g for g in result.skillset_gap if g.candidate_level is None]
    assert len(unassessed) == 10
    for u in unassessed:
        assert u.gap is None
        assert u.meets_requirement is None


# ---------------------------------------------------------------------------
# Case 6: A candidate has no assessable skills
# ---------------------------------------------------------------------------
def test_case_6_no_assessable_skills():
    """
    Candidate has empty skills list.
    Readiness score MUST be None (not 0.0, not 100.0).
    Coverage MUST be 0.0%.
    """
    reqs = make_requirements(5)
    profile = make_profile([])
    result = run_talent_check(profile, "Test Co", reqs)

    assert result.assessed_categories == 0
    assert result.skills_not_assessed == 12
    assert result.coverage_percentage == 0.0
    assert result.readiness_score is None


# ---------------------------------------------------------------------------
# Case 7: A company has no valid requirements
# ---------------------------------------------------------------------------
def test_case_7_company_missing_requirements_raises():
    """
    Incomplete company requirements (missing categories or invalid levels)
    must fail validation immediately with ValueError.
    """
    profile = make_profile([{"skill_name": "Coding", "category_code": "COD", "level": 5}])

    # Empty requirements
    with pytest.raises(ValueError, match="missing categories"):
        run_talent_check(profile, "Test Co", {})

    # Incomplete requirements
    with pytest.raises(ValueError, match="missing categories"):
        run_talent_check(profile, "Test Co", {"COD": 5, "DSA": 5})

    # Out-of-bounds level
    invalid_reqs = make_requirements(5, {"COD": 15})
    with pytest.raises(ValueError, match="must be an integer from 1 to 10"):
        run_talent_check(profile, "Test Co", invalid_reqs)


# ---------------------------------------------------------------------------
# Case 8: Two companies have different skill requirements
# ---------------------------------------------------------------------------
def test_case_8_two_companies_different_requirements():
    """
    The same candidate profile assessed against two companies with different
    skill thresholds must yield distinct, mathematically correct readiness scores.
    """
    company_a_reqs = make_requirements(overrides={"COD": 6, "DSA": 6, "OOD": 6})
    company_b_reqs = make_requirements(overrides={"COD": 10, "DSA": 10, "OOD": 10})

    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 6},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 6},
        {"skill_name": "Design", "category_code": "OOD", "level": 6},
    ])

    result_a = run_talent_check(profile, "Company A", company_a_reqs)
    result_b = run_talent_check(profile, "Company B", company_b_reqs)

    # Against Company A: 6/6, 6/6, 6/6 -> 100.0%
    assert result_a.readiness_score == 100.0

    # Against Company B: 6/10, 6/10, 6/10 -> 60.0%
    assert result_b.readiness_score == 60.0
    assert result_a.readiness_score != result_b.readiness_score


# ---------------------------------------------------------------------------
# Case 9: Candidate skill levels contain boundary values and invalid inputs
# ---------------------------------------------------------------------------
def test_case_9_boundary_values_and_validation():
    """
    Boundary values: level 1 (minimum) and level 10 (maximum).
    Invalid levels: < 1 or > 10 caught by Pydantic validation.
    """
    reqs = make_requirements(10)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 1},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 10},
    ])
    result = run_talent_check(profile, "Test Co", reqs)

    # Attainment: 1/10=0.1, 10/10=1.0 -> average = 0.55 -> 55.0%
    assert result.readiness_score == 55.0

    # Level 0 or 11 must raise ValidationError
    with pytest.raises(ValidationError):
        CandidateProfile(
            name="Invalid Cand",
            email="inv@example.com",
            skills=[{"skill_name": "Coding", "category_code": "COD", "level": 0}],
        )

    with pytest.raises(ValidationError):
        CandidateProfile(
            name="Invalid Cand",
            email="inv@example.com",
            skills=[{"skill_name": "Coding", "category_code": "COD", "level": 11}],
        )


# ---------------------------------------------------------------------------
# Case 10: The same candidate is assessed repeatedly against the same company
# ---------------------------------------------------------------------------
def test_case_10_idempotency_and_repeatability():
    """
    Repeated assessment of the same candidate against the same company must produce
    identical results without side effects or state drift.
    """
    reqs = make_requirements(7)
    profile = make_profile([
        {"skill_name": "Coding", "category_code": "COD", "level": 8},
        {"skill_name": "Algorithms", "category_code": "DSA", "level": 6},
    ])

    results = [run_talent_check(profile, "Test Co", reqs) for _ in range(5)]

    first = results[0].model_dump()
    for r in results[1:]:
        assert r.model_dump() == first
