"""Rank companies against the candidate's explicitly assessed RADIX skills."""

import logging
import re
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from functions.skill_categories import TALENT_CATEGORY_ALIASES
from functions.talent_check.supabase_client import fetch_company_matching_data

router = APIRouter(prefix="/company-matches", tags=["company-matches"])
logger = logging.getLogger(__name__)


class CandidateSkill(BaseModel):
    skill_code: str = Field(min_length=1, max_length=16)
    skill_level: int = Field(ge=0, le=10)


class CompanyMatchRequest(BaseModel):
    skills: list[CandidateSkill] = Field(default_factory=list)


class SkillMatchDetail(BaseModel):
    skill_set_id: int
    skill_name: str
    candidate_level: float | None
    required_level: float
    status: str


class CompanyMatch(BaseModel):
    company_id: int | str
    company_name: str
    match_score: float
    matched_skills: list[SkillMatchDetail]
    missing_skills: list[str]
    incomplete_requirements: bool = False
    category: str | None = None
    logo_url: str | None = None


class CompanyMatchResponse(BaseModel):
    score_semantics: str
    matches: list[CompanyMatch]


def _skill_code(row: dict[str, Any]) -> str:
    for key in ("skill_code", "short_name", "code"):
        value = row.get(key)
        if isinstance(value, str) and value.strip():
            code = _canonical_code(value)
            if code in {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"}:
                return code
    name = row.get("skill_set_name") or row.get("name")
    if isinstance(name, str):
        normalized_name = " ".join(name.lower().replace("&", "and").split())
        aliased = TALENT_CATEGORY_ALIASES.get(normalized_name)
        if aliased:
            return _canonical_code(aliased)
    return ""


def _canonical_code(value: str) -> str:
    code = re.sub(r"[^A-Z0-9]", "", value.upper())
    aliases = {"APT": "APTI", "COM": "COMM", "CLD": "CLOUD", "SYS": "SYSD", "NET": "NETW", "OTH": "OTHER"}
    if code in aliases:
        return aliases[code]
    normalized_name = " ".join(value.lower().replace("&", "and").split())
    normalized_name = {"cloud computing": "cloud", "operating system": "operating systems", "system design": "system design"}.get(normalized_name, normalized_name)
    return TALENT_CATEGORY_ALIASES.get(normalized_name, code)


def _company_id(company: dict[str, Any]) -> int | str | None:
    value = company.get("company_id", company.get("id"))
    return value if isinstance(value, (int, str)) else None


def _company_name(company: dict[str, Any]) -> str:
    for key in ("company_name", "name", "short_name"):
        value = company.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return "Company"


@router.post("", response_model=CompanyMatchResponse)
def rank_companies(payload: CompanyMatchRequest) -> CompanyMatchResponse:
    # Reject duplicate categories: silently choosing one would make the score ambiguous.
    codes = [skill.skill_code.upper() for skill in payload.skills]
    if len(set(codes)) != len(codes):
        raise HTTPException(status_code=422, detail="Candidate skills must not repeat a skill code.")

    try:
        skill_sets, companies = fetch_company_matching_data()
    except Exception as error:
        logger.exception("Could not load company matching data from Supabase")
        raise HTTPException(status_code=503, detail="Company matching data is currently unavailable.") from error

    if len(skill_sets) != 12:
        raise HTTPException(status_code=503, detail="Canonical skill set must contain exactly 12 entries.")
    skill_by_code: dict[str, tuple[int, str]] = {}
    for index, row in enumerate(skill_sets):
        code = _skill_code(row)
        if code:
            skill_by_code[code] = (index, str(row.get("skill_set_name") or row.get("name") or code))

    candidate_by_index: dict[int, float] = {}
    for skill in payload.skills:
        code = _canonical_code(skill.skill_code)
        # The existing profile's OTH entry is outside the canonical 12-vector.
        if code == "OTHER":
            continue
        canonical = skill_by_code.get(code)
        if canonical is None:
            raise HTTPException(status_code=422, detail=f"Unknown skill code: {skill.skill_code}")
        # The existing relational company requirements and candidate profile
        # both use the established 1–10 proficiency scale.
        candidate_by_index[canonical[0]] = float(skill.skill_level)

    matches: list[CompanyMatch] = []
    for company in companies:
        company_id = _company_id(company)
        requirements = company.get("skill_requirements")
        if company_id is None or not isinstance(requirements, dict) or not requirements:
            continue
        details: list[SkillMatchDetail] = []
        missing: list[str] = []
        contributions: list[float] = []
        incomplete = len(requirements) != 12
        for index, skill_set in enumerate(skill_sets):
            skill_id = int(skill_set["skill_set_id"])
            skill_name = str(skill_set.get("skill_set_name") or skill_set.get("name") or f"Skill {skill_id}")
            candidate_level = candidate_by_index.get(index)
            raw_required = requirements.get(skill_id, requirements.get(str(skill_id)))
            if raw_required is None:
                incomplete = True
                continue
            try:
                required = float(raw_required)
            except (TypeError, ValueError):
                incomplete = True
                continue
            if not 1 <= required <= 10:
                incomplete = True
                continue
            if candidate_level is None:
                missing.append(skill_name)
                details.append(SkillMatchDetail(skill_set_id=skill_id, skill_name=skill_name, candidate_level=None, required_level=required, status="missing"))
                continue
            ratio = min(candidate_level / required, 1.0)
            contributions.append(ratio)
            details.append(SkillMatchDetail(skill_set_id=skill_id, skill_name=skill_name, candidate_level=candidate_level, required_level=required, status="meets" if ratio >= 1 else "below_requirement"))

        # Score is requirement coverage across explicitly represented skills.
        # Missing candidate dimensions are excluded and separately reported.
        score = round((sum(contributions) / len(contributions) * 100) if contributions else 0.0, 1)
        matches.append(CompanyMatch(
            company_id=company_id,
            company_name=_company_name(company),
            match_score=score,
            matched_skills=details,
            missing_skills=missing,
            incomplete_requirements=incomplete,
            category=company.get("category"),
            logo_url=company.get("logo_url"),
        ))

    matches.sort(key=lambda item: (-item.match_score, len(item.missing_skills), item.company_name.lower()))
    return CompanyMatchResponse(
        score_semantics="Mean of min(candidate_level / required_level, 1) across company requirements for skills explicitly present in the profile, shown as a percentage. Candidate and required proficiency levels use the existing 1–10 scale. Missing candidate skills are excluded from the score and listed separately; absent or invalid company requirements are skipped and flagged.",
        matches=matches,
    )
