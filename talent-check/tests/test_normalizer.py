
import pytest

from app.normalizer import normalize_skill, normalize_profile


def test_accepts_friends_original_skill_format():
    result = normalize_skill({
        "skill_name": "Coding",
        "evidence": "Solved programming problems",
        "confidence": "High",
    })

    assert result["category_code"] == "COD"
    assert result["confidence"] == "high"
    assert result["evidence"] == "Solved programming problems"


def test_accepts_category_code_and_different_capitalization():
    result = normalize_skill({
        "SKILL_NAME": "Programming",
        "CATEGORY_CODE": "cod",
        "Evidence": "Built a project",
        "CONFIDENCE": "HIGH",
    })

    assert result["category_code"] == "COD"
    assert result["confidence"] == "high"


def test_accepts_alternate_field_names():
    result = normalize_skill({
        "name": "Coding",
        "proof": "Built a program",
        "certainty": "Medium",
        "category": "Coding",
    })

    assert result["skill_name"] == "Coding"
    assert result["evidence"] == "Built a program"
    assert result["confidence"] == "medium"
    assert result["category_code"] == "COD"


def test_maps_java_to_coding_category():
    result = normalize_skill({
        "skill_name": "Java",
        "evidence": "Built a Java project",
        "confidence": "High",
    })

    assert result["category_code"] == "COD"


def test_normalizes_wrapped_profile():
    result = normalize_profile({
        "candidate_profile": {
            "candidate_name": "Rahul",
            "email_address": "rahul@example.com",
            "qualification": "B.Tech CSE",
            "skillset": [{
                "skill_name": "SQL",
                "category_code": "SQL",
                "evidence": "Practiced joins",
                "confidence": "Medium",
            }],
        }
    })

    assert result["name"] == "Rahul"
    assert result["skills"][0]["category_code"] == "SQL"
    assert result["skills"][0]["confidence"] == "medium"


def test_rejects_unknown_category_instead_of_guessing():
    with pytest.raises(ValueError, match="Cannot determine"):
        normalize_skill({
            "skill_name": "Quantum Widget Engineering",
            "evidence": "Worked on a project",
            "confidence": "High",
        })

@pytest.mark.parametrize(
    ("skill_name", "expected_category"),
    [
        ("Java", "COD"),
        ("Python", "COD"),
        ("C++", "COD"),
        ("AWS", "CLOUD"),
        ("Azure", "CLOUD"),
        ("PostgreSQL", "SQL"),
        ("Machine Learning", "AI"),
        ("Data Structures & Algorithms", "DSA"),
        ("Object-Oriented Design", "OOD"),
        ("Operating Systems", "OS"),
        ("Computer Networks", "NETW"),
        ("System Design", "SYSD"),
        ("Software Engineering", "SWE"),
    ],
)
def test_maps_common_skill_names_to_categories(
    skill_name, expected_category
):
    result = normalize_skill({
        "skill_name": skill_name,
        "evidence": f"Worked with {skill_name}",
        "confidence": "High",
    })

    assert result["category_code"] == expected_category


@pytest.mark.parametrize(
    "category",
    [
        "DSA",
        "dsa",
        "Data Structures & Algorithms",
        "data-structures-and-algorithms",
        "Data_Structures_And_Algorithms",
    ],
)
def test_accepts_category_format_variations(category):
    result = normalize_skill({
        "skill_name": "My DSA Skill",
        "category_code": category,
        "evidence": "Solved algorithm problems",
        "confidence": "High",
    })

    assert result["category_code"] == "DSA"

def test_accepts_profile_with_missing_optional_lists():
    result = normalize_profile({
        "name": "Aman",
        "email": "aman@example.com",
        "education": "B.Tech",
        "skills": [{
            "skill_name": "Java",
            "evidence": "Built a Java project",
            "confidence": "High",
        }],
    })

    assert result["name"] == "Aman"
    assert result["skills"][0]["category_code"] == "COD"
    assert result["hackathons"] == []
    assert result["internships"] == []
    assert result["certifications"] == []
    assert result["preferred_roles"] == []


def test_accepts_alternate_skill_list_key():
    result = normalize_profile({
        "name": "Riya",
        "skillset": [{
            "name": "AWS",
            "proof": "Deployed an application",
            "certainty": "Medium",
        }],
    })

    assert result["skills"][0]["category_code"] == "CLOUD"
    assert result["skills"][0]["confidence"] == "medium"


@pytest.mark.parametrize(
    "invalid_profile",
    [
        None,
        [],
        "not a profile",
        {"name": "Aman", "skills": "Java"},
        {"name": "Aman", "skills": [None]},
    ],
)
def test_rejects_invalid_profile_structures(invalid_profile):
    with pytest.raises((ValueError, TypeError)):
        normalize_profile(invalid_profile)

