
import json
from pathlib import Path
from typing import Any
from openai import OpenAIError

from app.llm_analysis import generate_candidate_analysis

from fastapi import FastAPI, HTTPException, Query
from starlette.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.schemas import CandidateProfile, TalentCheckResponse
from app.normalizer import normalize_profile
from app.scoring import run_talent_check


app = FastAPI(
    title="RADIX Talent Check API",
    description="Evaluates candidate readiness against company skill requirements.",
    version="1.0.0",
)

import os as _os_for_cors

# ── CORS ──────────────────────────────────────────────────────────
_raw_origin = _os_for_cors.getenv('FRONTEND_ORIGIN', '').strip()
_allowed_origins = (
    [_raw_origin]
    if _raw_origin
    else ['http://localhost:5173', 'http://127.0.0.1:5173',
          'http://localhost:3000', 'http://127.0.0.1:3000',
          'null']
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'OPTIONS'],
    allow_headers=['Content-Type'],
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
if DATA_DIR.exists():
    app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "company_skillsets.json"
)


def load_company_requirements() -> dict:
    """Load company skill requirements from the JSON file."""
    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=503,
            detail="Company skill requirements file is not available.",
        )

    try:
        with DATA_FILE.open("r", encoding="utf-8-sig") as file:
            data = json.load(file)
    except (json.JSONDecodeError, OSError):
        raise HTTPException(
            status_code=500,
            detail="Company skill requirements file could not be read.",
        )

    if (
        not isinstance(data, dict)
        or not isinstance(data.get("companies"), dict)
        or not data["companies"]
    ):
        raise HTTPException(
            status_code=500,
            detail="Company skill requirements file has an invalid format.",
        )

    return data["companies"]


def extract_profile(payload: dict[str, Any]) -> dict:
    """
    Accept:
    1. Role 3's original candidate JSON.
    2. A wrapped request containing {"profile": {...}}.
    3. A request containing company and candidate fields together.
    """
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=422,
            detail="Request body must be a JSON object.",
        )

    if "profile" in payload:
        raw_profile = payload["profile"]

        if not isinstance(raw_profile, dict) or not raw_profile:
            raise HTTPException(
                status_code=422,
                detail="'profile' must be a non-empty JSON object.",
            )

        return raw_profile

    # Remove request-level fields before validating the candidate.
    raw_profile = {
        key: value
        for key, value in payload.items()
        if key not in {"company", "role"}
    }

    if not raw_profile:
        raise HTTPException(
            status_code=422,
            detail="Candidate profile must be a non-empty JSON object.",
        )

    return raw_profile


def validate_candidate_profile(
    raw_profile: dict,
) -> CandidateProfile:
    """Normalize Role 3 output and validate the candidate profile."""
    try:
        normalized_profile = normalize_profile(raw_profile)
        return CandidateProfile.model_validate(normalized_profile)
    except (ValueError, ValidationError) as error:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid candidate profile: {error}",
        )


def assess_company(
    profile: CandidateProfile,
    company: str,
    requirements: dict,
) -> TalentCheckResponse:
    """Run the talent assessment for one company."""
    try:
        return run_talent_check(
            profile=profile,
            company=company,
            company_requirements=requirements,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking {company}: {error}",
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/talent-check", response_model=TalentCheckResponse)
def talent_check(
    payload: dict[str, Any],
    company: str | None = Query(
        default=None,
        description="Company name, e.g. Company A",
    ),
):
    # Prefer the query parameter; retain backward compatibility
    # with requests that contain company in the JSON body.
    selected_company = company or payload.get("company")

    if (
        not isinstance(selected_company, str)
        or not selected_company.strip()
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Provide a company using the company query parameter "
                "or the company field in the request body."
            ),
        )

    selected_company = selected_company.strip()

    # Accept the original Role 3 JSON without modifications.
    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)

    companies = load_company_requirements()

    if selected_company not in companies:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Company '{selected_company}' was not found "
                "in the requirements data."
            ),
        )

    return assess_company(
        profile=profile,
        company=selected_company,
        requirements=companies[selected_company],
    )


@app.post(
    "/talent-check/all",
    response_model=list[TalentCheckResponse],
)
def talent_check_all(payload: dict[str, Any]):
    # Accept the original Role 3 JSON directly.
    # Also accept wrapped profiles and legacy body fields.
    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)

    companies = load_company_requirements()
    results = []

    for company, requirements in companies.items():
        results.append(
            assess_company(
                profile=profile,
                company=company,
                requirements=requirements,
            )
        )

    return results

@app.post("/talent-check/analyze")
def talent_check_analyze(
    payload: dict[str, Any],
    company: str | None = Query(
        default=None,
        description="Company name from company_skillsets.json",
    ),
):
    """Return the deterministic assessment plus LLM explanations."""

    selected_company = company or payload.get("company")

    if (
        not isinstance(selected_company, str)
        or not selected_company.strip()
    ):
        raise HTTPException(
            status_code=422,
            detail="Provide a company in the query parameter or request body.",
        )

    selected_company = selected_company.strip()

    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)

    companies = load_company_requirements()

    if selected_company not in companies:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{selected_company}' was not found.",
        )

    # Python remains responsible for the actual assessment.
    assessment = assess_company(
        profile=profile,
        company=selected_company,
        requirements=companies[selected_company],
    )

    # Convert the Pydantic response into JSON-compatible data.
    assessment_data = assessment.model_dump(mode="json")

    try:
        analysis = generate_candidate_analysis(assessment_data)

    except ValueError as error:
        # Missing API key or model configuration.
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )

    except (OpenAIError, RuntimeError) as error:
        # Provider errors, timeouts, or invalid LLM output.
        raise HTTPException(
            status_code=502,
            detail=f"LLM analysis failed: {error}",
        )

    return {
        "assessment": assessment_data,
        "analysis": analysis,
    }

@app.post("/talent-check/all/analyze")
def talent_check_all_analyze(payload: dict[str, Any]):
    """Assess all companies and generate one comparative LLM analysis."""

    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)
    companies = load_company_requirements()

    # Python calculates the actual assessment for every company.
    assessments = []

    for company, requirements in companies.items():
        assessment = assess_company(
            profile=profile,
            company=company,
            requirements=requirements,
        )
        assessments.append(assessment.model_dump(mode="json"))

    # Ask the LLM to compare the existing results.
    try:
        analysis = generate_candidate_analysis({
            "candidate_name": profile.name,
            "assessments": assessments,
            "task": (
                "Compare all assessed companies. Explain readiness "
                "and skill gaps, identify the strongest current fit "
                "based on available evidence, and create a learning "
                "roadmap that prioritizes useful skills across companies."
            ),
        })

    except ValueError as error:
        raise HTTPException(status_code=503, detail=str(error))

    except (OpenAIError, RuntimeError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"LLM analysis failed: {error}",
        )

    return {
        "candidate_name": profile.name,
        "company_count": len(assessments),
        "assessments": assessments,
        "analysis": analysis,
    }

