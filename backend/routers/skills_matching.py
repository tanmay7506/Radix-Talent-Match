import asyncio
import json
import re

from fastapi import APIRouter, HTTPException
from functions.models import model_genai
from functions.skill_categories import PROFILE_CATEGORY_ALIASES
from functions.skills_matching.schemas import (
    CandidateEvidence,
    JobSkills,
    SkillMatchingRequest,
    SkillMatchingResponse,
    SkillRequirement,
)
from langchain_core.prompts import ChatPromptTemplate
from utils.extract_data import ProfileResponseModel
from utils.response_cache import get_cached, set_cached


skill_matching_router = APIRouter(
    prefix="/skill-matching",
    tags=["skill-matching"],
)

# Add aliases here as you encounter more variations in real JDs and resumes.
SYNONYM_GROUPS = [
    {"js", "javascript"},
    {"ts", "typescript"},
    {"py", "python"},
    {"postgres", "postgresql", "postgres sql"},
    {"node", "node.js", "nodejs"},
    {"react.js", "reactjs", "react"},
    {"ml", "machine learning"},
    {"ai", "artificial intelligence"},
    {"nlp", "natural language processing"},
    {"cv", "computer vision"},
    {"aws", "amazon web services"},
    {"gcp", "google cloud platform"},
    {"azure", "microsoft azure"},
    {"k8s", "kubernetes"},
    {"ci/cd", "continuous integration", "continuous delivery"},
    {"oop", "object oriented programming"},
    {"dsa", "data structures and algorithms"},
    {"rest api", "restful api", "rest apis"},
    {"pytorch", "torch"},
    {"scikit-learn", "sklearn"},
]


def normalize(value: str) -> str:
    """Normalize a skill phrase for comparisons."""
    value = value.lower().strip()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9+#./ ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def canonicalize(value: str) -> str:
    """Convert known aliases into a shared comparison term."""
    normalized = normalize(value)

    for group in SYNONYM_GROUPS:
        normalized_group = {normalize(alias) for alias in group}
        if normalized in normalized_group:
            return sorted(normalized_group)[0]

    return normalized


def category_code(category: str) -> str:
    return PROFILE_CATEGORY_ALIASES.get(normalize(category), "OTH")


def flatten_job_skills(job: JobSkills) -> list[SkillRequirement]:
    """Convert category lists and technologies into individual requirements."""
    requirements: list[SkillRequirement] = []
    seen: dict[str, int] = {}

    for category, skills in job.radix_categories.items():
        code = category_code(category)

        for skill in skills:
            if not skill or not skill.strip():
                continue

            key = canonicalize(skill)
            if key in seen:
                continue

            seen[key] = len(requirements)
            requirements.append(
                SkillRequirement(
                    skill_name=skill.strip(), category_code=code, source="category"
                )
            )

    for technology in job.technologies:
        if not technology or not technology.strip():
            continue

        key = canonicalize(technology)
        if key in seen:
            requirements[seen[key]].source = "technology"
            continue

        seen[key] = len(requirements)
        requirements.append(
            SkillRequirement(
                skill_name=technology.strip(),
                category_code="OTH",
                source="technology",
            )
        )

    return requirements


def candidate_evidence(profile: ProfileResponseModel) -> list[CandidateEvidence]:
    """
    Search evidence attached to candidate skills.

    A category label alone is not treated as proof of an individual
    technical skill. Evidence must mention the skill or a close equivalent.
    """
    evidence_items: list[CandidateEvidence] = []

    for skill in profile.skills:
        for evidence in skill.evidence:
            if evidence and evidence.strip():
                evidence_items.append(
                    CandidateEvidence(
                        text=evidence.strip(),
                        category=skill.skill_name,
                        level=skill.skill_level,
                        confidence=skill.confidence,
                    )
                )

    # Include other profile sections as supporting text, but keep their
    # source explicit so that they are not confused with verified skills.
    for section_name, entries in [
        ("hackathon", profile.hackathons),
        ("internship", profile.internships),
        ("certification", profile.certifications),
    ]:
        for entry in entries:
            if entry and entry.strip():
                evidence_items.append(
                    CandidateEvidence(
                        text=entry.strip(),
                        category=section_name,
                        level=1,
                        confidence="Low",
                    )
                )

    return evidence_items


@skill_matching_router.post(
    "/analyze",
    response_model=SkillMatchingResponse,
)
async def analyze_skill_match(
    request: SkillMatchingRequest,
) -> SkillMatchingResponse:
    cache_inputs = request.model_dump(mode="json")
    cached = await asyncio.to_thread(get_cached, "skill-matching-analyze", cache_inputs)
    if cached is not None:
        return SkillMatchingResponse.model_validate(cached)

    requirements = flatten_job_skills(request.jd_skills)
    evidence_items = candidate_evidence(request.candidate_profile)

    if not requirements:
        result = SkillMatchingResponse(
            jd_source_file=request.jd_source_file,
            match_score=0.0,
            matched_skills=[],
            missing_skills=[],
            skill_gaps=[],
            recommendations=[],
            match_confidence="low",
            ambiguity_alerts=[
                "The JD extraction returned no skills. Check the extracted JD data."
            ],
        )
        await asyncio.to_thread(
            set_cached, "skill-matching-analyze", cache_inputs, result
        )
        return result

    structured_model = model_genai.with_structured_output(SkillMatchingResponse)
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You assess candidate evidence against job skill requirements. "
                "Use only the supplied requirements and candidate evidence. "
                "A skill is matched only when the evidence directly supports it; "
                "do not infer skills from category labels or unrelated experience. "
                "For matched_skills, copy candidate_evidence verbatim from one "
                "provided evidence item and use its confidence and level. "
                "Include every requirement exactly once, either matched or missing. "
                "Use exact for direct wording, synonym for a clear equivalent, "
                "and fuzzy only for a close but uncertain wording match. "
                "Set match_score from 0 to 100 based on the supported requirements. "
                "Return concise, actionable recommendations and note uncertainty "
                "in ambiguity_alerts.",
            ),
            (
                "human",
                "JD source: {jd_source_file}\n"
                "Requirements (JSON): {requirements}\n"
                "Candidate evidence (JSON): {evidence}\n\n"
                "Return the complete skill matching assessment.",
            ),
        ]
    )
    chain = prompt | structured_model

    try:
        result = await asyncio.to_thread(
            chain.invoke,
            {
                "jd_source_file": request.jd_source_file,
                "requirements": json.dumps(
                    [item.model_dump() for item in requirements], ensure_ascii=False
                ),
                "evidence": json.dumps(
                    [item.model_dump() for item in evidence_items], ensure_ascii=False
                ),
            },
        )
        result = SkillMatchingResponse.model_validate(result)
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Skill matching model failed: {error}",
        ) from error

    result.jd_source_file = request.jd_source_file
    await asyncio.to_thread(set_cached, "skill-matching-analyze", cache_inputs, result)
    return result
