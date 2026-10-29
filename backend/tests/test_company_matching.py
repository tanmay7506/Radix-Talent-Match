import unittest
from fastapi.testclient import TestClient
from main import app
from routers.db.company_matching import CompanyMatchRequest, CandidateSkill, rank_companies


class CompanyMatchingTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_rank_companies_returns_clean_names_and_ranks(self):
        payload = CompanyMatchRequest(
            skills=[
                CandidateSkill(skill_code="COD", skill_level=8),
                CandidateSkill(skill_code="DSA", skill_level=7),
                CandidateSkill(skill_code="SQL", skill_level=9),
            ]
        )
        response = rank_companies(payload)
        self.assertTrue(len(response.matches) > 0)
        first = response.matches[0]
        self.assertTrue(bool(first.company_name))
        # Ensure name is not raw uppercase
        self.assertFalse(first.company_name.isupper() and len(first.company_name) > 3)

    def test_rank_companies_handles_duplicate_or_other_skills_without_error(self):
        payload = CompanyMatchRequest(
            skills=[
                CandidateSkill(skill_code="COD", skill_level=6),
                CandidateSkill(skill_code="COD", skill_level=8),
                CandidateSkill(skill_code="OTH", skill_level=5),
                CandidateSkill(skill_code="OTH", skill_level=7),
            ]
        )
        response = rank_companies(payload)
        self.assertTrue(len(response.matches) > 0)

    def test_company_matches_api_endpoint(self):
        res = self.client.post(
            "/api/company-matches",
            json={
                "skills": [
                    {"skill_code": "COD", "skill_level": 7},
                    {"skill_code": "AI", "skill_level": 6},
                ]
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("matches", data)
        self.assertTrue(len(data["matches"]) > 0)


if __name__ == "__main__":
    unittest.main()
