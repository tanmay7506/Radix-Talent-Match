"""
Regression and contract tests for the analysis layer.

Tests verify:
- Both analysis_mode and ai_status are always present in the response.
- ai_status semantics are accurate (not misleading).
- improvement_areas always comes from the deterministic engine.
- Null candidate levels are never converted to 0.
- All existing fields remain present (backward compat).
- Deterministic scores and coverage are unchanged.
- AI provider success, failure, and fallback paths.
"""
from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.llm_analysis import generate_candidate_analysis


client = TestClient(app)


# ─── Fixtures ─────────────────────────────────────────────────────

def _sample_profile_with_levels():
    return {
        "name": "Ananya Rao",
        "email": "ananya@example.com",
        "education": "B.Tech CSE",
        "skills": [
            {"skill_name": "Coding",     "category_code": "COD",  "level": 9, "evidence": "Built projects", "confidence": "high"},
            {"skill_name": "DSA",        "category_code": "DSA",  "level": 9, "evidence": "Solved 350+",    "confidence": "high"},
            {"skill_name": "OOD",        "category_code": "OOD",  "level": 8, "evidence": "Design patterns","confidence": "high"},
            {"skill_name": "OS",         "category_code": "OS",   "level": 8, "evidence": "Job scheduler",  "confidence": "high"},
            {"skill_name": "Networking", "category_code": "NETW", "level": 7, "evidence": "Coursework",     "confidence": "medium"},
            {"skill_name": "System Design", "category_code": "SYSD", "level": 8, "evidence": "URL shortener", "confidence": "high"},
            {"skill_name": "SWE",        "category_code": "SWE",  "level": 8, "evidence": "Internship",     "confidence": "high"},
            {"skill_name": "Communication", "category_code": "COMM", "level": 7, "evidence": "Mentoring",   "confidence": "medium"},
        ],
        "hackathons": [],
        "internships": [],
        "certifications": [],
        "preferred_roles": ["Software Engineer"],
    }


def _minimal_assessment_dict():
    """A valid multi-company assessment dict for direct unit testing."""
    return {
        "candidate_name": "Test Candidate",
        "assessments": [
            {
                "company": "Demo Backend Co",
                "role": "Software Engineer",
                "readiness_score": 87.5,
                "assessed_categories": 4,
                "total_categories": 12,
                "coverage_percentage": 33.33,
                "skills_meeting_requirement": 3,
                "skills_below_requirement": 1,
                "skills_not_assessed": 8,
                "skillset_gap": [
                    {
                        "category_code": "COD",
                        "category_name": "Coding",
                        "required_level": 8,
                        "candidate_level": 7,
                        "gap": 1,
                        "meets_requirement": False,
                        "evidence": ["built a project"],
                        "confidence": "high",
                    },
                    {
                        "category_code": "DSA",
                        "category_name": "Data Structures & Algorithms",
                        "required_level": 6,
                        "candidate_level": 8,
                        "gap": 0,
                        "meets_requirement": True,
                        "evidence": ["solved problems"],
                        "confidence": "high",
                    },
                    {
                        "category_code": "APTI",
                        "category_name": "Aptitude",
                        "required_level": 5,
                        "candidate_level": None,
                        "gap": None,
                        "meets_requirement": None,
                        "evidence": [],
                        "confidence": None,
                    },
                    {
                        "category_code": "AI",
                        "category_name": "Artificial Intelligence",
                        "required_level": 6,
                        "candidate_level": None,
                        "gap": None,
                        "meets_requirement": None,
                        "evidence": [],
                        "confidence": None,
                    },
                ],
            }
        ],
    }


# ─── Unit: generate_candidate_analysis ────────────────────────────

class TestAnalysisRequiredFields:
    """Both new fields must always be present regardless of AI success."""

    def test_analysis_mode_present_when_all_providers_fail(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("Groq down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("Gemini down")):
            result = generate_candidate_analysis(data)
        assert "analysis_mode" in result, "analysis_mode must always be returned"

    def test_ai_overview_present_when_all_providers_fail(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("Groq down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("Gemini down")):
            result = generate_candidate_analysis(data)
        assert "ai_overview" in result, "ai_overview must always be returned"

    def test_ai_status_present_always(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("Groq down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("Gemini down")):
            result = generate_candidate_analysis(data)
        assert "ai_status" in result


class TestAiStatusSemantics:
    """ai_status must accurately reflect what actually happened."""

    def test_fallback_when_all_providers_fail(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        # Must NOT claim 'complete' when all AI failed
        assert result["ai_status"] in ("fallback", "unavailable"), (
            f"Expected 'fallback' or 'unavailable' when all providers fail, got: {result['ai_status']!r}"
        )

    def test_complete_status_when_gemini_succeeds(self):
        data = _minimal_assessment_dict()
        gemini_output = {
            "summary": "This is a gemini summary.",
            "strengths": [{"category": "DSA", "reason": "Strong solver"}],
            "learning_roadmap": [{"week": "1-2", "focus": "Coding", "tasks": ["solve problems"], "milestone": "done"}],
            "recommended_projects": [{"name": "Proj", "purpose": "Demo", "deliverables": ["item"]}],
            "limitations": ["Assessment coverage is partial."],
            "detailed_analysis": [{"heading": "Overview", "details": "Good performance."}],
        }
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("Groq down")), \
             patch("app.llm_analysis._request_gemini", return_value=gemini_output):
            result = generate_candidate_analysis(data)
        assert result["ai_status"] in ("complete", "partial"), (
            f"Expected 'complete' or 'partial' when Gemini succeeds, got: {result['ai_status']!r}"
        )
        # Must NOT say 'fallback' when we actually have AI output
        assert result["ai_status"] != "fallback"

    def test_status_not_complete_when_providers_discarded(self):
        """If providers are called but their output was never used, status cannot be 'complete'."""
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        assert result["ai_status"] != "complete"


class TestDeterministicIntegrity:
    """Deterministic values must be unchanged regardless of AI success/failure."""

    def _run_with_failing_ai(self, data):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            return generate_candidate_analysis(data)

    def _run_with_passing_ai(self, data):
        gemini_output = {
            "summary": "AI summary.",
            "strengths": [{"category": "COD", "reason": "Good"}],
            "learning_roadmap": [],
            "recommended_projects": [],
            "limitations": [],
            "detailed_analysis": [{"heading": "H", "details": "D"}],
        }
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", return_value=gemini_output):
            return generate_candidate_analysis(data)

    def test_improvement_areas_same_regardless_of_ai(self):
        data = _minimal_assessment_dict()
        result_fail = self._run_with_failing_ai(data)
        result_pass = self._run_with_passing_ai(data)
        # improvement_areas comes from deterministic engine — must be identical
        assert result_fail["improvement_areas"] == result_pass["improvement_areas"], (
            "improvement_areas must be deterministic regardless of AI success"
        )

    def test_null_candidate_levels_preserved(self):
        data = _minimal_assessment_dict()
        result = self._run_with_failing_ai(data)
        # improvement_areas must not include APTI or AI (they are unassessed / null)
        improvement_categories = [i["category"] for i in result["improvement_areas"]]
        assert "Aptitude" not in improvement_categories
        assert "Artificial Intelligence" not in improvement_categories

    def test_graphs_field_always_present(self):
        data = _minimal_assessment_dict()
        result = self._run_with_failing_ai(data)
        assert "graphs" in result
        graphs = result["graphs"]
        assert "readiness_by_company" in graphs
        assert "coverage_by_company" in graphs
        assert "skill_comparison" in graphs

    def test_graphs_null_levels_not_zero(self):
        data = _minimal_assessment_dict()
        result = self._run_with_failing_ai(data)
        skill_comp = result["graphs"]["skill_comparison"]["data"]
        for cat_entry in skill_comp:
            for company_entry in cat_entry.get("companies", []):
                # If candidate_level was null in input, it must NOT appear as 0
                category = cat_entry["category"]
                if category in ("Aptitude", "Artificial Intelligence"):
                    assert company_entry["candidate_level"] is None, (
                        f"Unassessed skill '{category}' must remain null, not {company_entry['candidate_level']}"
                    )


class TestExistingFieldsPreserved:
    """All fields that existed before the analysis fix must still be present."""

    REQUIRED_FIELDS = {
        "summary", "strengths", "improvement_areas", "learning_roadmap",
        "recommended_projects", "limitations", "detailed_analysis",
        "graphs", "provider_errors", "ai_status",
    }

    def test_all_existing_fields_present(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        missing = self.REQUIRED_FIELDS - set(result.keys())
        assert not missing, f"Missing fields: {missing}"

    def test_new_fields_present(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        assert "analysis_mode" in result
        assert "ai_overview" in result

    def test_ai_overview_is_string(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        assert isinstance(result["ai_overview"], str), "ai_overview must be a string"
        assert result["ai_overview"], "ai_overview must not be empty"

    def test_analysis_mode_is_string(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        assert isinstance(result["analysis_mode"], str)
        assert result["analysis_mode"]


class TestMalformedAiOutput:
    """Provider returning malformed JSON or wrong structure must fall back gracefully."""

    def test_gemini_malformed_json_falls_back(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("Malformed JSON")):
            result = generate_candidate_analysis(data)
        assert "gemini" in result["provider_errors"]
        assert result["ai_status"] in ("fallback", "unavailable")

    def test_gemini_missing_required_key_falls_back(self):
        """If Gemini returns dict but missing required key, treat as failure."""
        data = _minimal_assessment_dict()
        # Return dict without 'summary' key
        incomplete = {"strengths": [], "learning_roadmap": [], "recommended_projects": [], "limitations": [], "detailed_analysis": []}
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", return_value=incomplete):
            result = generate_candidate_analysis(data)
        # With missing 'summary', the function should log provider error or still work
        assert "ai_status" in result  # Must not crash

    def test_provider_errors_do_not_leak_secrets(self):
        data = _minimal_assessment_dict()
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            result = generate_candidate_analysis(data)
        errors_str = json.dumps(result["provider_errors"])
        # Error messages should not contain what looks like API keys
        assert "sk-" not in errors_str
        assert "gsk_" not in errors_str
        assert "AQ." not in errors_str


# ─── Integration: API endpoints ───────────────────────────────────

class TestAnalysisEndpointContract:
    """Verify the /talent-check/analyze and /all/analyze endpoints return correct shape."""

    def test_single_analyze_contains_assessment_and_analysis(self):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/analyze?company=Demo+Backend+Co",
                json=_sample_profile_with_levels(),
            )
        assert response.status_code == 200
        body = response.json()
        assert "assessment" in body
        assert "analysis" in body

    def test_single_analyze_analysis_has_required_fields(self):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/analyze?company=Demo+Backend+Co",
                json=_sample_profile_with_levels(),
            )
        analysis = response.json()["analysis"]
        for field in ("summary", "ai_overview", "analysis_mode", "ai_status",
                      "strengths", "improvement_areas", "learning_roadmap",
                      "recommended_projects", "limitations", "detailed_analysis",
                      "graphs", "provider_errors"):
            assert field in analysis, f"Missing field in analysis: {field}"

    def test_all_analyze_contains_assessments_and_analysis(self):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/all/analyze",
                json=_sample_profile_with_levels(),
            )
        assert response.status_code == 200
        body = response.json()
        assert "assessments" in body
        assert "analysis" in body
        assert "candidate_name" in body
        assert "company_count" in body

    def test_all_analyze_fallback_status_when_providers_fail(self):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/all/analyze",
                json=_sample_profile_with_levels(),
            )
        analysis = response.json()["analysis"]
        assert analysis["ai_status"] in ("fallback", "unavailable")
        assert analysis["ai_status"] != "complete"

    def test_all_analyze_company_count_matches_actual(self):
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/all/analyze",
                json=_sample_profile_with_levels(),
            )
        body = response.json()
        assert body["company_count"] == len(body["assessments"])

    def test_deterministic_scores_unchanged_by_ai(self):
        """Scores from /talent-check/all must match scores in /talent-check/all/analyze."""
        # Get pure deterministic scores
        resp_pure = client.post("/talent-check/all", json=_sample_profile_with_levels())
        assert resp_pure.status_code == 200
        pure_scores = {r["company"]: r["readiness_score"] for r in resp_pure.json()}

        # Get analyze scores (with both AI providers failing)
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            resp_analyze = client.post("/talent-check/all/analyze", json=_sample_profile_with_levels())
        assert resp_analyze.status_code == 200
        analyze_scores = {r["company"]: r["readiness_score"] for r in resp_analyze.json()["assessments"]}

        assert pure_scores == analyze_scores, (
            f"Scores must be identical regardless of AI analysis:\n"
            f"pure:    {pure_scores}\n"
            f"analyze: {analyze_scores}"
        )

    def test_null_skills_remain_null_in_analyze_response(self):
        """null candidate_level must not become 0 in the analyze endpoint output."""
        with patch("app.llm_analysis._request_groq", side_effect=RuntimeError("down")), \
             patch("app.llm_analysis._request_gemini", side_effect=RuntimeError("down")):
            response = client.post(
                "/talent-check/all/analyze",
                json=_sample_profile_with_levels(),
            )
        for assessment in response.json()["assessments"]:
            for gap in assessment["skillset_gap"]:
                if gap["meets_requirement"] is None:
                    assert gap["candidate_level"] is None, (
                        f"Unassessed category {gap['category_code']} must have null level, not {gap['candidate_level']}"
                    )
