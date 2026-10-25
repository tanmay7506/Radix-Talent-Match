
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def sample_profile():
    return {
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "education": "B.Tech CSE",
        "skills": [
            {
                "skill_name": "Coding",
                "evidence": "Solved Java programming problems",
                "confidence": "High",
            },
            {
                "skill_name": "SQL",
                "evidence": "Practiced SQL joins",
                "confidence": "Medium",
            },
        ],
        "hackathons": [],
        "internships": [],
        "certifications": [],
        "preferred_roles": ["Backend Developer"],
        "cv_file": "resume.pdf",
    }


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_single_company_talent_check():
    response = client.post(
        "/talent-check",
        json={
            "company": "Demo Backend Co",
            "profile": sample_profile(),
        },
    )

    assert response.status_code == 200

    result = response.json()
    assert result["company"] == "Demo Backend Co"
    assert len(result["skillset_gap"]) == 12
    assert 0 <= result["readiness_score"] <= 100


def test_all_companies_talent_check():
    response = client.post(
        "/talent-check/all",
        json={"profile": sample_profile()},
    )

    assert response.status_code == 200

    results = response.json()

    assert len(results) == 3
    assert {
        result["company"] for result in results
    } == {
        "Demo Backend Co",
        "Demo AI Co",
        "Demo Fullstack Co",
    }

    for result in results:
        assert len(result["skillset_gap"]) == 12
        assert 0 <= result["readiness_score"] <= 100


def test_unknown_company_returns_404():
    response = client.post(
        "/talent-check",
        json={
            "company": "Unknown Company",
            "profile": sample_profile(),
        },
    )

    assert response.status_code == 404


def test_missing_profile_returns_422():
    response = client.post(
        "/talent-check",
        json={"company": "Demo Backend Co"},
    )

    assert response.status_code == 422

def test_invalid_candidate_confidence_returns_422():
    profile = sample_profile()
    profile["skills"][0]["confidence"] = "Very High"

    response = client.post(
        "/talent-check",
        json={
            "company": "Demo Backend Co",
            "profile": profile,
        },
    )

    assert response.status_code == 422


def test_invalid_candidate_level_returns_422():
    profile = sample_profile()
    profile["skills"][0]["level"] = 11

    response = client.post(
        "/talent-check",
        json={
            "company": "Demo Backend Co",
            "profile": profile,
        },
    )

    assert response.status_code == 422


def test_unknown_skill_category_returns_422():
    profile = sample_profile()
    profile["skills"][0]["category_code"] = "UNKNOWN"

    response = client.post(
        "/talent-check",
        json={
            "company": "Demo Backend Co",
            "profile": profile,
        },
    )

    assert response.status_code == 422
    