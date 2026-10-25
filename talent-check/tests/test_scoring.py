
import pytest

from app.schemas import CandidateProfile
from app.scoring import CATEGORIES, run_talent_check, calculate_readiness


def sample_profile():
    return CandidateProfile(
        name="Rahul Sharma",
        email="rahul@example.com",
        education="B.Tech CSE",
        skills=[
            {
                "skill_name": "Java",
                "category_code": "OOD",
                "evidence": "Built a Java project",
                "confidence": "high",
                "level": 6,
            },
            {
                "skill_name": "SQL",
                "category_code": "SQL",
                "evidence": "Practiced joins",
                "confidence": "medium",
                "level": 4,
            },
        ],
        hackathons=[],
        internships=[],
        certifications=[],
        preferred_roles=["Software Developer"],
        cv_file="resume.pdf",
    )


def sample_requirements():
    return {category: 5 for category in CATEGORIES}


def test_returns_all_12_categories():
    result = run_talent_check(
        sample_profile(), "Example Company", sample_requirements()
    )

    assert len(result.skillset_gap) == 12



def test_detects_skill_gap():
    result = run_talent_check(
        sample_profile(), "Example Company", sample_requirements()
    )

    ood = next(
        item for item in result.skillset_gap
        if item.category_code == "OOD"
    )

    assert ood.candidate_level == 6
    assert ood.gap == 0
    assert ood.meets_requirement is True



def test_caps_attainment_at_100_percent():
    result = calculate_readiness([
        type("Gap", (), {
            "candidate_level": 10,
            "required_level": 5,
        })()
    ])

    assert result == 100.0


def test_rejects_missing_company_category():
    requirements = sample_requirements()
    requirements.pop("DSA")

    with pytest.raises(ValueError, match="missing categories"):
        run_talent_check(sample_profile(), "Example Company", requirements)


def test_accepts_friends_original_role3_format():
    # Simulate the exact skill structure produced by our friend's Role 3.
    profile = CandidateProfile.model_validate({
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "education": "B.Tech CSE",
        "skills": [
            {
                "skill_name": "Coding",
                "evidence": "Solved programming problems",
                "confidence": "High",
            }
        ],
        "hackathons": [],
        "internships": [],
        "certifications": [],
        "preferred_roles": ["Software Developer"],
        "cv_file": "resume.pdf",
    })

    # Verify the input was converted to our internal format.
    skill = profile.skills[0]
    assert skill.category_code == "COD"
    assert skill.confidence == "high"
    assert skill.evidence == "Solved programming problems"

    # Verify our existing scoring engine can use the normalized profile.
    result = run_talent_check(
        profile,
        "Example Company",
        sample_requirements(),
    )

    coding = next(
        item for item in result.skillset_gap
        if item.category_code == "COD"
    )
    assert coding.candidate_level == 3
