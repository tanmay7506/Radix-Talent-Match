import os
import unittest

# Importing the router constructs the configured LLM client. These unit tests
# never invoke it, so a placeholder keeps the matching tests independent of a
# developer's local secret configuration.
os.environ.setdefault("GOOGLE_API_KEY", "test-key-not-used")
os.environ.setdefault("OPENROUTER_API_KEY", "test-key-not-used")

from functions.skills_matching.schemas import (
    CandidateEvidence,
    JobSkills,
    MatchedSkill,
    SkillMatchingRequest,
    SkillMatchingResponse,
)
from functions.talent_check.schemas import CandidateProfile
from functions.talent_check.scoring import run_talent_check
from routers.skills_matching import (
    candidate_evidence,
    flatten_job_skills,
    reconcile_skill_match,
)


def model_result(*matches):
    return SkillMatchingResponse(
        jd_source_file="test JD",
        match_score=99,
        matched_skills=list(matches),
        missing_skills=[],
        skill_gaps=[],
        recommendations=[],
        match_confidence="high",
        ambiguity_alerts=[],
    )


def match(name, evidence, level=5, category_code="OTH"):
    return MatchedSkill(
        skill_name=name,
        category_code=category_code,
        match_type="exact",
        candidate_evidence=evidence,
        candidate_confidence="high",
        candidate_skill_level=level,
        match_confidence="high",
    )


class SkillMatchingContractTests(unittest.TestCase):
    def test_manual_frontend_profile_is_accepted_by_matching_contract(self):
        request = SkillMatchingRequest.model_validate({
            "candidate_profile": {
                "name": "Test Candidate",
                "email": "test@example.com",
                "education": {},
                "skills": [{
                    "skill_name": "Python", "skill_code": "OTH", "skill_level": 5,
                    "confidence": "Medium", "evidence": [],
                }],
            },
            "jd_skills": {"technologies": ["Python"]},
        })
        self.assertEqual(request.candidate_profile.skills[0].skill_name, "Python")
        self.assertEqual(request.candidate_profile.cv_file, "")

    def test_aliases_and_duplicate_jd_entries_become_one_canonical_requirement(self):
        requirements = flatten_job_skills(
            JobSkills(radix_categories={"Coding": ["JavaScript", "js"]}, technologies=["React", "react.js"])
        )
        self.assertEqual([item.canonical_id for item in requirements], ["COD"])

    def test_direct_evidence_is_matched_and_score_is_deterministic(self):
        requirements = flatten_job_skills(JobSkills(technologies=["Python", "SQL"]))
        evidence = [CandidateEvidence(text="Built a Python API", category="Coding", level=6, confidence="High")]
        result = reconcile_skill_match(requirements, evidence, model_result(match("Coding", "Built a Python API", 6, "COD")))
        self.assertEqual(result.match_score, 50)
        self.assertEqual([item.skill_name for item in result.matched_skills], ["Coding"])
        self.assertEqual([item.skill_name for item in result.unassessed_skills], ["SQL"])
        self.assertEqual(result.missing_skills, [])
        self.assertEqual(len(result.canonical_skills), 12)

    def test_no_evidence_is_not_a_confirmed_gap(self):
        requirements = flatten_job_skills(JobSkills(technologies=["Python"]))
        result = reconcile_skill_match(requirements, [], model_result())
        self.assertEqual(len(result.unassessed_skills), 1)
        self.assertEqual(result.missing_skills, [])
        self.assertEqual(result.skill_gaps, [])

    def test_unsupported_jd_terms_do_not_create_assessment_rows(self):
        requirements = flatten_job_skills(
            JobSkills(radix_categories={"Backend Development": ["REST APIs"]})
        )
        self.assertEqual(requirements, [])
        result = reconcile_skill_match(requirements, [], model_result())
        self.assertEqual(result.unassessed_skills, [])
        self.assertEqual(result.unmapped_requirements, [])
        self.assertEqual(len(result.canonical_skills), 12)
        self.assertTrue(all(item.status == "not_applicable" for item in result.canonical_skills))

    def test_uploaded_jd_style_categories_do_not_become_false_gaps(self):
        """Regression for the real Oracle fixture's non-canonical JD labels."""
        requirements = flatten_job_skills(JobSkills(
            radix_categories={
                "Programming": ["Object-oriented programming", "Code debugging"],
                "DataStructures": ["Arrays", "Algorithmic problem-solving"],
                "Databases": ["SQL", "Query writing"],
            },
            technologies=["SQL", "FLEXCUBE"],
        ))
        evidence = [CandidateEvidence(
            text="Wrote a technical blog series on object-oriented design patterns",
            category="Object-Oriented Programming and Design",
            level=5,
            confidence="High",
        )]
        result = reconcile_skill_match(
            requirements,
            evidence,
            model_result(match("Object-Oriented Design", evidence[0].text, 5, "OOD")),
        )
        self.assertEqual([item.canonical_id for item in requirements], ["COD", "DSA", "OOD", "SQL"])
        self.assertEqual(len(result.matched_skills), 1)
        self.assertEqual(len(result.unassessed_skills), 3)
        self.assertEqual(result.unmapped_requirements, [])
        self.assertEqual(result.missing_skills, [])

    def test_profile_prompt_category_names_map_to_canonical_requirements(self):
        """Profile extraction prompt uses long skill labels; JD extractor may mirror them.

        Both profile_extraction_prompt (resume parser) and the JD extractor LLM can
        return strings like 'AI Native Engineering', 'DevOps and Cloud', 'Cloud Computing',
        'System Design and Architecture', 'SQL and Design', 'Communication Skills', etc.
        These must all resolve to the correct TALENT_CATEGORIES code so that requirements
        are not silently dropped and candidates are not over-penalised.
        """
        # JD uses the same long labels that the profile extraction prompt defines.
        requirements = flatten_job_skills(JobSkills(
            radix_categories={
                "AI Native Engineering": ["TensorFlow", "LLM integration"],
                "Cloud Computing": ["AWS EC2", "Azure DevOps"],
                "System Design and Architecture": ["Microservices", "REST APIs"],
                "SQL and Design": ["PostgreSQL", "Schema design"],
                "Communication Skills": ["Technical writing", "Stakeholder updates"],
                "Aptitude and Problem Solving": ["Logical reasoning"],
                "Object-Oriented Programming and Design": ["SOLID principles"],
                "DevOps and Cloud": ["Docker", "CI/CD pipelines"],
            },
        ))
        canonical_ids = [r.canonical_id for r in requirements]
        # 'AI Native Engineering' and 'DevOps and Cloud' both map to CLOUD or AI,
        # so duplicates are collapsed — verify each result is in TALENT_CATEGORIES.
        from functions.skill_categories import TALENT_CATEGORIES
        for cid in canonical_ids:
            self.assertIn(cid, TALENT_CATEGORIES, f"{cid!r} is not a canonical RADIX code")
        # No duplicates.
        self.assertEqual(len(canonical_ids), len(set(canonical_ids)))
        # All expected categories are present.
        for expected in ("AI", "CLOUD", "SYSD", "SQL", "COMM", "APTI", "OOD"):
            self.assertIn(expected, canonical_ids, f"Expected {expected!r} to be in requirements")

    def test_cloud_computing_display_name_maps_to_cloud(self):
        """'Cloud Computing' is the TALENT_CATEGORY_NAMES display name for CLOUD.

        If it is used as a JD category key it must resolve to CLOUD, not OTH.
        """
        requirements = flatten_job_skills(JobSkills(
            radix_categories={"Cloud Computing": ["AWS", "GCP", "Azure"]},
        ))
        self.assertEqual(len(requirements), 1)
        self.assertEqual(requirements[0].canonical_id, "CLOUD")

    def test_unrecognized_model_skill_cannot_leak_into_results(self):
        requirements = flatten_job_skills(JobSkills(technologies=["Python"]))
        evidence = [CandidateEvidence(text="Built a Python API", category="Coding", level=6, confidence="High")]
        result = reconcile_skill_match(requirements, evidence, model_result(match("Kubernetes", "Built a Python API")))
        self.assertEqual(result.matched_skills, [])
        self.assertEqual(len(result.unassessed_skills), 1)

    def test_model_evidence_must_be_verbatim_profile_evidence(self):
        requirements = flatten_job_skills(JobSkills(technologies=["Python"]))
        evidence = [CandidateEvidence(text="Built a Python API", category="Coding", level=6, confidence="High")]
        result = reconcile_skill_match(requirements, evidence, model_result(match("Coding", "Invented evidence", category_code="COD")))
        self.assertEqual(result.matched_skills, [])
        self.assertEqual(len(result.unassessed_skills), 1)

    def test_jd_with_fewer_categories_is_not_padded_to_twelve(self):
        requirements = flatten_job_skills(JobSkills(radix_categories={"Coding": ["Python"]}))
        self.assertEqual(len(requirements), 1)

    def test_jd_with_more_phrases_uses_unique_canonical_requirements(self):
        requirements = flatten_job_skills(JobSkills(technologies=["AWS", "amazon web services", "Docker"]))
        self.assertEqual([item.canonical_id for item in requirements], ["CLOUD"])

    def test_every_result_has_one_of_the_twelve_canonical_ids(self):
        requirements = flatten_job_skills(JobSkills(
            radix_categories={"Coding": ["Python", "Java"], "Databases": ["SQL"]},
            technologies=["AWS", "amazon web services", "Kubernetes"],
        ))
        evidence = [CandidateEvidence(text="Built a Python API", category="Coding", level=6, confidence="High")]
        result = reconcile_skill_match(
            requirements,
            evidence,
            model_result(match("Coding", evidence[0].text, 6, "COD")),
        )
        valid_ids = {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"}
        self.assertEqual(len(result.canonical_skills), 12)
        self.assertEqual({item.category_code for item in result.canonical_skills}, valid_ids)
        self.assertEqual(len(result.matched_skills) + len(result.unassessed_skills), len(requirements))

    def test_candidate_profile_with_missing_level_remains_unknown_in_talent_check(self):
        profile = CandidateProfile(name="A", email="a@example.com", skills=[{"skill_name": "Python", "category": "Coding"}])
        requirements = {code: 5 for code in ("COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS")}
        result = run_talent_check(profile, "Demo", requirements)
        coding = next(item for item in result.skillset_gap if item.category_code == "COD")
        self.assertIsNone(coding.candidate_level)
        self.assertIsNone(coding.meets_requirement)

    def test_higher_candidate_level_meets_talent_requirement(self):
        profile = CandidateProfile(name="A", email="a@example.com", skills=[{"skill_name": "Python", "category": "Coding", "level": 8}])
        requirements = {code: 5 for code in ("COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS")}
        result = run_talent_check(profile, "Demo", requirements)
        coding = next(item for item in result.skillset_gap if item.category_code == "COD")
        self.assertTrue(coding.meets_requirement)

    def test_duplicate_assessment_records_keep_highest_level_once(self):
        profile = CandidateProfile(name="A", email="a@example.com", skills=[
            {"skill_name": "Python", "category": "Coding", "level": 4},
            {"skill_name": "Java", "category": "Coding", "level": 7},
        ])
        requirements = {code: 5 for code in ("COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS")}
        result = run_talent_check(profile, "Demo", requirements)
        coding = next(item for item in result.skillset_gap if item.category_code == "COD")
        self.assertEqual(coding.candidate_level, 7)

    def test_manual_skill_with_default_oth_code_infers_canonical_category_in_talent_check(self):
        """When skills are extracted or entered with default skill_code 'OTH',

        the talent check must fall back to normalizing skill_name so candidate evidence
        and levels for Python, AWS, PostgreSQL, etc. are properly mapped to canonical
        categories instead of being dropped as 'OTHER'.
        """
        profile = CandidateProfile(name="A", email="a@example.com", skills=[
            {"skill_name": "Python", "skill_code": "OTH", "level": 6, "evidence": "Built API in Python"},
            {"skill_name": "AWS", "skill_code": "OTH", "level": 7, "evidence": "Deployed on AWS"},
        ])
        requirements = {code: 5 for code in ("COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS")}
        result = run_talent_check(profile, "Demo", requirements)
        coding = next(item for item in result.skillset_gap if item.category_code == "COD")
        cloud = next(item for item in result.skillset_gap if item.category_code == "CLOUD")
        self.assertEqual(coding.candidate_level, 6)
        self.assertTrue(coding.meets_requirement)
        self.assertEqual(cloud.candidate_level, 7)
        self.assertTrue(cloud.meets_requirement)

    def test_roadmap_graph_focuses_strictly_on_confirmed_gaps(self):
        """Roadmap must only address confirmed gaps and necessary prerequisites,

        not generic full-stack technologies like AWS/Docker if not in gaps.
        """
        from functions.talent_check.llm_analysis import _build_jd_roadmap_graph
        improvements = [
            {
                "category": "SQL",
                "category_code": "SQL",
                "current_level": 2,
                "required_level": 6,
                "gap": 4,
                "company": "TestCorp",
                "role": "Backend Engineer",
            }
        ]
        rows = [
            {"category": "Cloud Computing", "candidate_level": None},
        ]
        jd_context = {
            "jd_title": "Backend Engineer",
            "jd_skills": {
                "radix_categories": {"Databases": ["PostgreSQL", "Query Optimization"]},
                "technologies": ["PostgreSQL"],
            },
        }
        graph = _build_jd_roadmap_graph(improvements, rows, jd_context)
        self.assertTrue(graph["has_gaps"])
        self.assertEqual(graph["total_gaps"], 1)

        # Check all nodes in the graph
        all_nodes = [node for stage in graph["stages"] for track in stage["tracks"] for node in track["nodes"]]
        categories = {node.get("category_code") for node in all_nodes}

        # Must include SQL and its prerequisite, but NEVER CLOUD, AI, OS, etc.
        self.assertIn("SQL", categories)
        self.assertNotIn("CLOUD", categories)
        self.assertNotIn("AI", categories)
        self.assertNotIn("OS", categories)

        # Unassessed skills are listed separately, NOT in confirmed gap stages
        self.assertEqual(len(graph["unassessed_skills"]), 1)
        self.assertEqual(graph["unassessed_skills"][0]["category"], "Cloud Computing")

    def test_roadmap_graph_completion_state_when_no_gaps(self):
        """When a candidate meets all requirements, roadmap shows role verified completion."""
        from functions.talent_check.llm_analysis import _build_jd_roadmap_graph
        graph = _build_jd_roadmap_graph([], [], {"jd_title": "Software Engineer"})
        self.assertFalse(graph["has_gaps"])
        self.assertEqual(graph["total_gaps"], 0)
        self.assertEqual(graph["stages"][0]["id"], "stage-verified")

    def test_roadmap_graph_prerequisites_only_for_low_proficiency(self):
        """Prerequisites are only added for confirmed gaps where candidate proficiency <= 3."""
        from functions.talent_check.llm_analysis import _build_jd_roadmap_graph
        improvements = [
            # Candidate has level 5 (needs 8) -> moderate/high gap, but already has basics
            {
                "category": "DSA",
                "category_code": "DSA",
                "current_level": 5,
                "required_level": 8,
                "gap": 3,
                "company": "TechCorp",
                "role": "Systems Engineer",
            },
            # Candidate has level 2 (needs 6) -> low level -> needs prerequisite
            {
                "category": "SQL",
                "category_code": "SQL",
                "current_level": 2,
                "required_level": 6,
                "gap": 4,
                "company": "TechCorp",
                "role": "Systems Engineer",
            },
        ]
        jd_context = {
            "jd_title": "Systems Engineer",
            "jd_skills": {
                "technologies": ["PostgreSQL", "Trees and Graphs"],
            },
        }
        graph = _build_jd_roadmap_graph(improvements, [], jd_context)
        self.assertEqual(graph["total_gaps"], 2)

        # Collect all nodes
        all_nodes = [node for stage in graph["stages"] for track in stage["tracks"] for node in track["nodes"]]
        prereq_nodes = [node for node in all_nodes if node.get("node_type") == "prerequisite"]

        # Only SQL should have a prerequisite because SQL current_level is 2 (<=3)
        # DSA current_level is 5 (>3) so it should NOT have a prerequisite
        sql_prereqs = [node for node in prereq_nodes if node.get("category_code") == "SQL"]
        dsa_prereqs = [node for node in prereq_nodes if node.get("category_code") == "DSA"]

        self.assertTrue(len(sql_prereqs) >= 1)
        self.assertEqual(len(dsa_prereqs), 0)

        # Checkpoint nodes must exist in tracks
        checkpoints = [node for node in all_nodes if node.get("node_type") == "checkpoint"]
        self.assertTrue(len(checkpoints) >= 2)


if __name__ == "__main__":
    unittest.main()
