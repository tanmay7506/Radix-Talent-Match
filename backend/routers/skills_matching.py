import asyncio
import json
import re

from fastapi import APIRouter, HTTPException
from functions.models import model_genai
from functions.skill_categories import (
    PROFILE_CATEGORY_ALIASES,
    TALENT_CATEGORIES,
    TALENT_CATEGORY_ALIASES,
    TALENT_CATEGORY_NAMES,
)
from functions.skills_matching.schemas import (
    CandidateEvidence,
    CanonicalSkillClassification,
    JobSkills,
    MatchedSkill,
    SkillMatchingRequest,
    SkillMatchingResponse,
    SkillRequirement,
    UnassessedSkill,
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

# The JD extractor uses these compact labels in the supplied document
# fixtures. They describe existing RADIX categories, but do not use the
# profile builder's display names, so map them explicitly before treating a
# category as unsupported.
JD_CATEGORY_CODES = {
    "programming": "COD",
    "datastructures": "DSA",
    "data structures": "DSA",
    "databases": "SQL",
    "systemsarchitecture": "SYSD",
    "systems architecture": "SYSD",
    "testing": "SWE",
    "developmentlifecycle": "SWE",
    "development lifecycle": "SWE",
    "quantitativeaptitude": "APTI",
    "quantitative aptitude": "APTI",
}

# Specific terms repeatedly produced by the existing JD extractor. They are
# aliases for the official RADIX categories, not additional assessment rows.
JD_TERM_CATEGORY_CODES = {
    "object oriented programming": "OOD",
    "object oriented design": "OOD",
    "algorithmic problem solving": "DSA",
    "arrays": "DSA",
    "linked lists": "DSA",
    "stacks": "DSA",
    "queues": "DSA",
    "code debugging": "COD",
    "string manipulation": "COD",
    "array manipulation": "COD",
    "relational databases": "SQL",
    "query writing": "SQL",
    "data schema interaction": "SQL",
    "schema design": "SQL",
    "normalization": "SQL",
    "denormalization": "SQL",
    "index aware query optimization": "SQL",
    "operating systems basics": "OS",
    "processes": "OS",
    "multithreading": "OS",
    "memory management": "OS",
    "agile methodology": "SWE",
    "waterfall methodology": "SWE",
    "software documentation": "SWE",
    "collaboration": "SWE",
    "unit testing": "SWE",
    "logical reasoning": "APTI",
    "quantitative problem solving": "APTI",
}

PROFILE_CODE_TO_TALENT_CODE = {
    "COD": "COD", "DSA": "DSA", "OOD": "OOD", "APT": "APTI",
    "COM": "COMM", "AI": "AI", "CLD": "CLOUD", "SQL": "SQL",
    "SWE": "SWE", "SYS": "SYSD", "NET": "NETW", "OS": "OS",
}


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
    normalized = normalize(category)
    profile_code = PROFILE_CATEGORY_ALIASES.get(normalized)
    if profile_code:
        return PROFILE_CODE_TO_TALENT_CODE.get(profile_code, "OTH")
    return TALENT_CATEGORY_ALIASES.get(
        normalized, JD_CATEGORY_CODES.get(normalized, "OTH")
    )


def requirement_category_code(skill: str, category: str) -> str:
    """Map a JD phrase to one official RADIX category, when supported."""
    term = normalize(skill)
    return JD_TERM_CATEGORY_CODES.get(
        term, TALENT_CATEGORY_ALIASES.get(term, category_code(category))
    )


def flatten_job_skills(job: JobSkills) -> list[SkillRequirement]:
    """Aggregate extracted JD terms into the fixed official RADIX skill set."""
    grouped: dict[str, list[str]] = {}
    sources: dict[str, str] = {}

    for category, skills in job.radix_categories.items():
        for skill in skills:
            if not skill or not skill.strip():
                continue
            code = requirement_category_code(skill, category)
            if code not in TALENT_CATEGORIES:
                continue
            grouped.setdefault(code, []).append(skill.strip())
            sources.setdefault(code, "category")

    for technology in job.technologies:
        if not technology or not technology.strip():
            continue

        code = requirement_category_code(technology, "")
        if code not in TALENT_CATEGORIES:
            continue
        grouped.setdefault(code, []).append(technology.strip())
        sources[code] = "technology"

    return [
        SkillRequirement(
            skill_name=TALENT_CATEGORY_NAMES[code],
            category_code=code,
            source=sources[code],
            canonical_id=code,
            supporting_terms=list(dict.fromkeys(grouped[code])),
        )
        for code in TALENT_CATEGORIES
        if code in grouped
    ]


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


def reconcile_skill_match(
    requirements: list[SkillRequirement],
    evidence_items: list[CandidateEvidence],
    model_result: SkillMatchingResponse,
) -> SkillMatchingResponse:
    """Classify the fixed 12 RADIX categories, never raw JD phrases."""
    by_canonical = {requirement.canonical_id: requirement for requirement in requirements}
    evidence_texts = {item.text for item in evidence_items}
    matched: list[MatchedSkill] = []
    matched_ids: set[str] = set()
    alerts = list(model_result.ambiguity_alerts)

    for item in model_result.matched_skills:
        # The model receives canonical requirements, but this fallback also
        # accepts a canonical category name should a provider return it.
        canonical_id = item.category_code if item.category_code in TALENT_CATEGORIES else category_code(item.skill_name)
        requirement = by_canonical.get(canonical_id)
        if (
            requirement is None
            or canonical_id in matched_ids
            or item.candidate_evidence not in evidence_texts
        ):
            continue

        matched_ids.add(canonical_id)
        matched.append(
            item.model_copy(
                update={
                    "skill_name": requirement.skill_name,
                    "category_code": requirement.category_code,
                    "source": requirement.source,
                    "canonical_id": canonical_id,
                }
            )
        )

    unmatched_requirements = [item for item in requirements if item.canonical_id not in matched_ids]
    unassessed = [
        UnassessedSkill(
            skill_name=requirement.skill_name,
            category_code=requirement.category_code,
            source=requirement.source,
            canonical_id=requirement.canonical_id,
            reason=(
                "No direct supporting evidence for this JD requirement was supplied "
                "in the candidate profile. This is unknown, not a confirmed gap."
            ),
        )
        for requirement in unmatched_requirements
    ]

    if unassessed:
        alerts.append(
            "Requirements without direct evidence are shown as Not assessed; "
            "the JD does not provide proficiency thresholds to classify them as gaps."
        )

    canonical_skills = []
    for code in TALENT_CATEGORIES:
        requirement = by_canonical.get(code)
        matched_item = next((item for item in matched if item.category_code == code), None)
        if matched_item:
            canonical_skills.append(CanonicalSkillClassification(
                category_code=code, category_name=TALENT_CATEGORY_NAMES[code],
                status="matched", required_by_jd=True,
                candidate_level=matched_item.candidate_skill_level,
                candidate_evidence=matched_item.candidate_evidence,
                reason="Direct candidate evidence supports the JD requirement.",
            ))
        elif requirement:
            canonical_skills.append(CanonicalSkillClassification(
                category_code=code, category_name=TALENT_CATEGORY_NAMES[code],
                status="not_assessed", required_by_jd=True,
                reason="The JD requires this category, but the profile has no direct supporting evidence.",
            ))
        else:
            canonical_skills.append(CanonicalSkillClassification(
                category_code=code, category_name=TALENT_CATEGORY_NAMES[code],
                status="not_applicable", required_by_jd=False,
                reason="This RADIX category was not required by the uploaded JD.",
            ))

    total = len(requirements)
    match_score = round(len(matched) / total * 100, 2) if total else 0.0
    return SkillMatchingResponse(
        jd_source_file=model_result.jd_source_file,
        match_score=match_score,
        matched_skills=matched,
        missing_skills=[],
        unassessed_skills=unassessed,
        unmapped_requirements=[],
        canonical_skills=canonical_skills,
        skill_gaps=[],
        recommendations=[],
        match_confidence="medium" if matched else "low",
        ambiguity_alerts=list(dict.fromkeys(alerts)),
    )


def not_applicable_classifications() -> list[CanonicalSkillClassification]:
    """Return the complete RADIX scope when no JD category is identifiable."""
    return [
        CanonicalSkillClassification(
            category_code=code,
            category_name=TALENT_CATEGORY_NAMES[code],
            status="not_applicable",
            required_by_jd=False,
            reason="This RADIX category was not required by the uploaded JD.",
        )
        for code in TALENT_CATEGORIES
    ]


@skill_matching_router.post(
    "/analyze",
    response_model=SkillMatchingResponse,
)
async def analyze_skill_match(
    request: SkillMatchingRequest,
) -> SkillMatchingResponse:
    cache_inputs = request.model_dump(mode="json")
    # Versioned key prevents stale pre-classification responses from being
    # shown as confirmed gaps after the contract changed.
    cached = await asyncio.to_thread(get_cached, "skill-matching-analyze-v4", cache_inputs)
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
            unassessed_skills=[],
            unmapped_requirements=[],
            canonical_skills=not_applicable_classifications(),
            skill_gaps=[],
            recommendations=[],
            match_confidence="low",
            ambiguity_alerts=[
                "The JD extraction returned no skills. Check the extracted JD data."
            ],
        )
        await asyncio.to_thread(
            set_cached, "skill-matching-analyze-v4", cache_inputs, result
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
                "Each supplied requirement is one official RADIX category. "
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
    result = reconcile_skill_match(requirements, evidence_items, result)
    await asyncio.to_thread(set_cached, "skill-matching-analyze-v4", cache_inputs, result)
    return result
