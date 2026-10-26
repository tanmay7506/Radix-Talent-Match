import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

SAMPLE_ROLE3_PROFILE = {
    "name": "Rohan Verma",
    "email": "rohan.verma@example.com",
    "education": {
        "degree": "B.Tech Computer Science",
        "college": "IIT Delhi",
        "graducation_year": "2026",
        "cgpa": 9.1,
    },
    "skills": [
        {"skill_name": "Coding", "skill_code": "COD", "skill_level": 9, "evidence": ["C++, Python"], "confidence": "High"},
        {"skill_name": "Data Structures & Algorithms", "skill_code": "DSA", "skill_level": 9, "evidence": ["350+ CP problems"], "confidence": "High"},
        {"skill_name": "Object-Oriented Design", "skill_code": "OOD", "skill_level": 8, "evidence": ["Design patterns in real systems"], "confidence": "High"},
        {"skill_name": "Aptitude", "skill_code": "APT", "skill_level": 8, "evidence": ["Quantitative aptitude"], "confidence": "Medium"},
        {"skill_name": "Communication", "skill_code": "COM", "skill_level": 7, "evidence": ["Presentation and hackathons"], "confidence": "Medium"},
        {"skill_name": "Artificial Intelligence", "skill_code": "AI", "skill_level": 7, "evidence": ["ML collaborative filtering"], "confidence": "High"},
        {"skill_name": "Cloud", "skill_code": "CLD", "skill_level": 8, "evidence": ["Docker, AWS"], "confidence": "High"},
        {"skill_name": "SQL", "skill_code": "SQL", "skill_level": 8, "evidence": ["Relational DB, complex queries"], "confidence": "High"},
        {"skill_name": "Software Engineering", "skill_code": "SWE", "skill_level": 8, "evidence": ["Git, CI/CD, Series-B intern"], "confidence": "High"},
        {"skill_name": "System Design", "skill_code": "SYS", "skill_level": 8, "evidence": ["Scalable notification pub-sub"], "confidence": "High"},
        {"skill_name": "Networking", "skill_code": "NET", "skill_level": 7, "evidence": ["Socket programming, TCP/IP"], "confidence": "Medium"},
        {"skill_name": "Operating Systems", "skill_code": "OS", "skill_level": 8, "evidence": ["Multithreading, concurrency"], "confidence": "High"},
    ],
    "hackathons": ["Winner, national inter-college hackathon"],
    "internships": ["Software Engineering intern at Series-B startup"],
    "certifications": [],
    "preferred_roles": ["Software Engineer", "Data Scientist"],
    "cv_file": "Rohan Verma.pdf",
}


def test_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json().get("Running") is True


def test_companies_listing():
    res = client.get("/talent-check/companies")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 100
    assert any("google" in c["name"].lower() for c in data)


def test_companies_search():
    res = client.get("/talent-check/companies?search=google")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert "Google" in data[0]["name"]


def test_role3_profile_into_talent_check():
    """Verify that Role 3's exact ProfileResponseModel format converts cleanly and assesses all 12 skills."""
    res = client.post("/talent-check?company_id=4", json=SAMPLE_ROLE3_PROFILE)
    assert res.status_code == 200, res.text
    result = res.json()

    # Verify all 12 categories are assessed with candidate levels
    assert result["assessed_categories"] == 12
    assert result["total_categories"] == 12
    assert result["skills_not_assessed"] == 0
    assert len(result["skillset_gap"]) == 12
    assert result["readiness_score"] is not None
    assert result["readiness_score"] > 80.0

    # Ensure every RADIX category has a candidate level mapped
    categories_present = {g["category_code"] for g in result["skillset_gap"]}
    expected_categories = {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"}
    assert categories_present == expected_categories


def test_company_switching_no_leakage():
    """Verify evaluating against Google then Apple produces company-specific requirements without leakage."""
    res_google = client.post("/talent-check?company_id=4", json=SAMPLE_ROLE3_PROFILE).json()
    res_apple = client.post("/talent-check?company_id=5", json=SAMPLE_ROLE3_PROFILE).json()

    assert "Google" in res_google["company"]
    assert "Apple" in res_apple["company"]
    assert res_google["company"] != res_apple["company"]
    assert len(res_google["skillset_gap"]) == 12
    assert len(res_apple["skillset_gap"]) == 12


def test_partial_skills_candidate():
    """When a candidate only has coding skills, unassessed categories are marked null, not 0."""
    partial_profile = {
        "name": "Alex OnlyCoding",
        "email": "alex@example.com",
        "skills": [
            {"skill_name": "Coding", "skill_code": "COD", "skill_level": 8, "evidence": ["Python"], "confidence": "High"},
        ],
    }
    res = client.post("/talent-check?company_id=4", json=partial_profile)
    assert res.status_code == 200
    data = res.json()
    assert data["assessed_categories"] == 1
    assert data["skills_not_assessed"] == 11

    # Check unassessed gap items
    unassessed = [g for g in data["skillset_gap"] if g["category_code"] != "COD"]
    for g in unassessed:
        assert g["candidate_level"] is None
        assert g["gap"] is None
        assert g["meets_requirement"] is None


def test_unknown_company_returns_404():
    res = client.post("/talent-check?company_id=9999999", json=SAMPLE_ROLE3_PROFILE)
    assert res.status_code == 404


def test_empty_profile_returns_422():
    res = client.post("/talent-check?company_id=4", json={})
    assert res.status_code == 422


def test_talent_check_analyze_endpoint():
    """Verify /talent-check/analyze returns structured assessment and AI analysis."""
    res = client.post("/talent-check/analyze?company_id=4", json=SAMPLE_ROLE3_PROFILE)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "company" in data
    assert "assessment" in data
    assert "analysis" in data
    assert len(data["assessment"]["skillset_gap"]) == 12
    assert data["analysis"]["ai_status"] in {"complete", "partial", "fallback", "unavailable"}
    assert "strengths" in data["analysis"]
    assert "improvement_areas" in data["analysis"]
