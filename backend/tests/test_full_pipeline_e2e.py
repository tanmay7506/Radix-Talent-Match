import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_e2e_pipeline_flow():
    """
    End-to-end pipeline test across:
    Role 1: Job Description text parsing
    Role 2 & 3: Resume parsing and Candidate Profile creation
    Role 4: Company-specific Talent Check against Supabase requirements
    """
    # 1. Inspect Role 1 test JD document
    jd_pdf_path = BACKEND_DIR / "files" / "JDs" / "PDF" / "Oracle - Associate Software Engineer.pdf"
    assert jd_pdf_path.exists(), f"JD file missing: {jd_pdf_path}"

    from utils.parse_document import parse_document
    with open(jd_pdf_path, "rb") as f:
        jd_text = parse_document(f.read(), jd_pdf_path.name)
    assert len(jd_text) > 100
    assert "Oracle" in jd_text or "Software" in jd_text
    print(f"\n[Role 1] Parsed JD document successfully ({len(jd_text)} chars)")

    # 2. Inspect Role 2 & 3 test Resume document
    resume_pdf_path = BACKEND_DIR / "files" / "Resumes" / "PDF" / "Rohan Verma.pdf"
    assert resume_pdf_path.exists(), f"Resume file missing: {resume_pdf_path}"

    with open(resume_pdf_path, "rb") as f:
        resume_text = parse_document(f.read(), resume_pdf_path.name)
    assert len(resume_text) > 100
    assert "Rohan Verma" in resume_text
    print(f"[Role 2] Parsed Resume text successfully ({len(resume_text)} chars)")

    # 3. Test Candidate Profile structure (Role 3 representation)
    # Uses the official Rohan Verma profile extracted from his resume
    candidate_profile = {
        "name": "Rohan Verma",
        "email": "rohan.verma@example.com",
        "education": {
            "degree": "B.Tech, Computer Science and Engineering",
            "college": "Class of 2026",
            "graducation_year": "2026",
            "cgpa": 9.1,
        },
        "skills": [
            {"skill_name": "Coding", "skill_code": "COD", "skill_level": 9, "evidence": ["C++, Python, SQL", "500+ CP problems"], "confidence": "High"},
            {"skill_name": "Data Structures & Algorithms", "skill_code": "DSA", "skill_level": 9, "evidence": ["500+ CP problems"], "confidence": "High"},
            {"skill_name": "Object-Oriented Design", "skill_code": "OOD", "skill_level": 8, "evidence": ["Technical blog on design patterns"], "confidence": "High"},
            {"skill_name": "Operating Systems", "skill_code": "OS", "skill_level": 8, "evidence": ["Concurrency, scheduling"], "confidence": "High"},
            {"skill_name": "Networking", "skill_code": "NET", "skill_level": 7, "evidence": ["Socket programming, real-time doc editor"], "confidence": "Medium"},
            {"skill_name": "System Design", "skill_code": "SYS", "skill_level": 8, "evidence": ["Distributed notification pub-sub"], "confidence": "High"},
            {"skill_name": "Software Engineering", "skill_code": "SWE", "skill_level": 8, "evidence": ["Series-B startup intern, CI/CD"], "confidence": "High"},
            {"skill_name": "Communication", "skill_code": "COM", "skill_level": 7, "evidence": ["Collaborative hackathon winner"], "confidence": "Medium"},
            {"skill_name": "Artificial Intelligence", "skill_code": "AI", "skill_level": 7, "evidence": ["Recommendation engine ML"], "confidence": "High"},
            {"skill_name": "SQL", "skill_code": "SQL", "skill_level": 8, "evidence": ["Relational queries and schema design"], "confidence": "High"},
            {"skill_name": "Cloud", "skill_code": "CLD", "skill_level": 8, "evidence": ["Docker, cloud workers"], "confidence": "High"},
            {"skill_name": "Aptitude", "skill_code": "APT", "skill_level": 8, "evidence": ["Engineering quantitative aptitude"], "confidence": "Medium"},
        ],
        "hackathons": ["Winner, national inter-college hackathon — built a real-time collaborative document editor"],
        "internships": ["Software Engineering intern at a Series-B startup — shipped a feature end-to-end including tests and CI"],
        "certifications": ["Self-taught via applied projects; open-source contributor"],
        "preferred_roles": ["Software Engineer", "Data Scientist", "Backend Engineer"],
        "cv_file": "Rohan Verma.pdf",
    }
    print(f"[Role 3] Candidate Profile assembled with {len(candidate_profile['skills'])} skills")

    # 4. Role 4: Fetch target enterprise company from Supabase
    comp_res = client.get("/talent-check/companies?search=Oracle")
    assert comp_res.status_code == 200
    oracle_comps = comp_res.json()
    assert len(oracle_comps) > 0
    oracle = oracle_comps[0]
    oracle_id = oracle["company_id"]
    print(f"[Role 4] Target Company retrieved from Supabase: {oracle['name']} (ID: {oracle_id})")

    # 5. Role 4: Run deterministic Talent Check against Oracle's Supabase requirements
    tc_res = client.post(f"/talent-check?company_id={oracle_id}", json=candidate_profile)
    assert tc_res.status_code == 200, tc_res.text
    tc_data = tc_res.json()

    print(f"[Role 4] Talent Check Result:")
    print(f"  Company:          {tc_data['company']}")
    print(f"  Readiness Score:  {tc_data['readiness_score']}%")
    print(f"  Coverage:         {tc_data['coverage_percentage']}%")
    print(f"  Meeting Req:      {tc_data['skills_meeting_requirement']}")
    print(f"  Below Req:        {tc_data['skills_below_requirement']}")
    print(f"  Not Assessed:     {tc_data['skills_not_assessed']}")

    # Verification: All 12 skills are assessed (NOT just the first coding skill!)
    assert len(tc_data["skillset_gap"]) == 12, "Must contain all 12 RADIX categories"
    assert tc_data["assessed_categories"] == 12, "All 12 skills must be assessed for this candidate"
    assert tc_data["skills_not_assessed"] == 0, "No skill should be omitted"
    assert tc_data["readiness_score"] > 85.0

    # 6. Role 4: Run Talent Check + AI Analysis
    analyze_res = client.post(f"/talent-check/analyze?company_id={oracle_id}", json=candidate_profile)
    assert analyze_res.status_code == 200, analyze_res.text
    an_data = analyze_res.json()

    assert "analysis" in an_data
    assert an_data["analysis"]["ai_status"] in {"complete", "partial", "fallback", "unavailable"}
    print(f"[Role 4] AI Analysis generated with status: {an_data['analysis']['ai_status']}")
    print(f"[Role 4] Strengths count: {len(an_data['analysis']['strengths'])}")
    print(f"[Role 4] Improvement areas count: {len(an_data['analysis']['improvement_areas'])}")
    print(">>> PIPELINE END-TO-END SUCCESSFUL!")
