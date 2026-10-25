
from app.schemas import Skill, SkillsetGap, TalentCheckResponse


def test_skill_validation():
    skill = Skill(
        skill_name="Java",
        category_code="OOD",
        evidence="Built a Java project",
        confidence="high",
        level=6,
    )

    assert skill.level == 6


def test_skill_level_is_optional():
    skill = Skill(
        skill_name="Java",
        category_code="OOD",
        evidence="Built a Java project",
        confidence="high",
    )

    assert skill.level is None



def test_skillset_gap():
    result = SkillsetGap(
        category_code="OOD",
        category_name="Object-Oriented Design",
        required_level=8,
        candidate_level=6,
        gap=2,
        meets_requirement=False,
        evidence=["Built a Java project"],
        confidence="high",
    )

    assert result.category_code == "OOD"
    assert result.gap == 2
    assert result.meets_requirement is False


def test_response_score():
    result = TalentCheckResponse(
        company="Example Company",
        skillset_gap=[
            {
                "category_code": "OOD",
                "category_name": "Object-Oriented Design",
                "required_level": 8,
                "candidate_level": 6,
                "gap": 2,
                "meets_requirement": False,
                "evidence": ["Built a Java project"],
                "confidence": "high",
            }
        ],
        readiness_score=75.0,
        assessed_categories=1,
        total_categories=12,
        coverage_percentage=8.33,
        skills_meeting_requirement=0,
        skills_below_requirement=1,
        skills_not_assessed=11,
    )

    assert result.company == "Example Company"
    assert result.readiness_score == 75.0
    assert result.assessed_categories == 1
    assert len(result.skillset_gap) == 1
