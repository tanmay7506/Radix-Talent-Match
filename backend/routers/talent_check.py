from typing import Any

from fastapi import APIRouter, HTTPException, Query
from openai import OpenAIError
from pydantic import ValidationError

from functions.talent_check.llm_analysis import generate_candidate_analysis
from functions.talent_check.normalizer import normalize_profile
from functions.talent_check.schemas import CandidateProfile, TalentCheckResponse
from functions.talent_check.scoring import run_talent_check
from functions.talent_check.supabase_client import (
    fetch_all_companies,
    fetch_company_requirements,
)

talent_check_router = APIRouter(
    prefix="/talent-check",
    tags=["talent-check"],
)


def extract_profile(payload: dict[str, Any]) -> dict:
    """
    Accepts:
    1. Role 3's ProfileResponseModel directly (e.g. from /profile/build/from-resume).
    2. A wrapped request containing {"profile": {...}}.
    3. A combined request containing candidate fields alongside company/role parameters.
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

    # Remove request-level fields before validating candidate
    raw_profile = {
        key: value
        for key, value in payload.items()
        if key not in {"company", "company_id", "role"}
    }

    if not raw_profile:
        raise HTTPException(
            status_code=422,
            detail="Candidate profile must be a non-empty JSON object.",
        )

    return raw_profile


def validate_candidate_profile(raw_profile: dict) -> CandidateProfile:
    """Normalize upstream Role 3 output and validate the candidate profile."""
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


@talent_check_router.get("/companies")
def get_companies(search: str | None = None):
    """
    Retrieve available companies from Supabase.
    Supports optional search filtering by company name.
    """
    try:
        all_companies = fetch_all_companies()
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch companies from Supabase: {error}",
        )

    if search and search.strip():
        term = search.strip().lower()
        filtered = [
            c
            for c in all_companies
            if term in c["name"].lower() or term in c["short_name"].lower()
        ]
        return filtered

    return all_companies


@talent_check_router.post("", response_model=TalentCheckResponse)
@talent_check_router.post("/", response_model=TalentCheckResponse)
def evaluate_talent_check(
    payload: dict[str, Any],
    company: str | None = Query(
        default=None,
        description="Company name or ID from Supabase",
    ),
    company_id: int | None = Query(
        default=None,
        description="Company ID from Supabase",
    ),
):
    """
    Evaluate candidate readiness against the selected company's requirements in Supabase.
    """
    target = (
        company_id or company or payload.get("company_id") or payload.get("company")
    )

    if not target or (isinstance(target, str) and not str(target).strip()):
        raise HTTPException(
            status_code=422,
            detail="Specify a target company via query parameter or request body.",
        )

    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)

    try:
        company_info, requirements = fetch_company_requirements(target)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    return assess_company(
        profile=profile,
        company=company_info["name"],
        requirements=requirements,
    )


@talent_check_router.post("/analyze")
def evaluate_talent_check_analyze(
    payload: dict[str, Any],
    company: str | None = Query(
        default=None,
        description="Company name or ID from Supabase",
    ),
    company_id: int | None = Query(
        default=None,
        description="Company ID from Supabase",
    ),
):
    """
    Return the deterministic assessment plus LLM explanations for the selected company.
    """
    target = (
        company_id or company or payload.get("company_id") or payload.get("company")
    )

    if not target or (isinstance(target, str) and not str(target).strip()):
        raise HTTPException(
            status_code=422,
            detail="Provide a company in the query parameter or request body.",
        )

    raw_profile = extract_profile(payload)
    profile = validate_candidate_profile(raw_profile)

    try:
        company_info, requirements = fetch_company_requirements(target)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    assessment = assess_company(
        profile=profile,
        company=company_info["name"],
        requirements=requirements,
    )

    assessment_data = assessment.model_dump(mode="json")
    assessment_data["company_id"] = company_info["company_id"]
    assessment_data["category"] = company_info.get("category")
    assessment_data["logo_url"] = company_info.get("logo_url")

    try:
        analysis = generate_candidate_analysis(assessment_data)
    except ValueError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )
    except (OpenAIError, RuntimeError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"LLM analysis failed: {error}",
        )

    return {
        "company": company_info,
        "assessment": assessment_data,
        "analysis": analysis,
    }
