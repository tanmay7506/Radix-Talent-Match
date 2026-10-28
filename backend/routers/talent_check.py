from fastapi import APIRouter, HTTPException, Query
from openai import OpenAIError

from functions.talent_check.llm_analysis import generate_candidate_analysis
from functions.talent_check.schemas import TalentCheckRequest, TalentCheckResponse
from functions.talent_check.scoring import run_talent_check
from functions.talent_check.supabase_client import (
    fetch_all_companies,
    fetch_company_requirements,
)
from utils.response_cache import get_cached, set_cached

talent_check_router = APIRouter(prefix="/talent-check", tags=["talent-check"])


@talent_check_router.get("/companies")
def get_companies(search: str | None = None):
    cache_inputs = {"search": (search or "").strip().lower()}
    cached = get_cached("talent-check-companies", cache_inputs)
    if cached is not None:
        return cached

    try:
        companies = fetch_all_companies()
    except Exception as error:
        raise HTTPException(
            status_code=503, detail=f"Failed to fetch companies from Supabase: {error}"
        )

    if search and search.strip():
        term = search.strip().lower()
        companies = [
            item
            for item in companies
            if term in item["name"].lower() or term in item["short_name"].lower()
        ]
    set_cached("talent-check-companies", cache_inputs, companies)
    return companies


def _request(payload: TalentCheckRequest, company: str | None, company_id: int | None):
    target = company_id or company or payload.company_id or payload.company
    if not target or (isinstance(target, str) and not target.strip()):
        raise HTTPException(
            status_code=422,
            detail="Specify a target company via query parameter or request body.",
        )
    try:
        company_info, requirements = fetch_company_requirements(target)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    return company_info, requirements


@talent_check_router.post("", response_model=TalentCheckResponse)
@talent_check_router.post("/", response_model=TalentCheckResponse)
def evaluate_talent_check(
    payload: TalentCheckRequest,
    company: str | None = Query(
        default=None, description="Company name or ID from Supabase"
    ),
    company_id: int | None = Query(
        default=None, description="Company ID from Supabase"
    ),
):
    company_info, requirements = _request(payload, company, company_id)
    cache_inputs = {
        "profile": payload.profile.model_dump(mode="json"),
        "company": company_info,
        "requirements": requirements,
    }
    cached = get_cached("talent-check-evaluate", cache_inputs)
    if cached is not None:
        return TalentCheckResponse.model_validate(cached)

    result = run_talent_check(payload.profile, company_info["name"], requirements)
    set_cached("talent-check-evaluate", cache_inputs, result)
    return result


@talent_check_router.post("/analyze")
def evaluate_talent_check_analyze(
    payload: TalentCheckRequest,
    company: str | None = Query(
        default=None, description="Company name or ID from Supabase"
    ),
    company_id: int | None = Query(
        default=None, description="Company ID from Supabase"
    ),
):
    company_info, requirements = _request(payload, company, company_id)
    assessment = run_talent_check(payload.profile, company_info["name"], requirements)
    assessment_data = assessment.model_dump(mode="json")
    assessment_data.update(
        {
            "company_id": company_info["company_id"],
            "category": company_info.get("category"),
            "logo_url": company_info.get("logo_url"),
        }
    )
    cache_inputs = {
        "profile": payload.profile.model_dump(mode="json"),
        "company": company_info,
        "requirements": requirements,
        "assessment": assessment_data,
        "jd_skills": payload.jd_skills,
        "jd_title": payload.jd_title,
    }
    cached = get_cached("talent-check-analyze", cache_inputs)
    if cached is not None:
        return cached

    try:
        analysis = generate_candidate_analysis(
            assessment_data,
            jd_context={"jd_skills": payload.jd_skills, "jd_title": payload.jd_title},
        )
    except ValueError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except (OpenAIError, RuntimeError) as error:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {error}")

    result = {
        "company": company_info,
        "assessment": assessment_data,
        "analysis": analysis,
    }
    set_cached("talent-check-analyze", cache_inputs, result)
    return result
