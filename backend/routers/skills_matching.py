
from difflib import SequenceMatcher
import asyncio
import json
import re
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from functions.models import model_genai
from langchain_core.prompts import ChatPromptTemplate
from utils.extract_data import ProfileResponseModel


skill_matching_router = APIRouter(
    prefix="/skill-matching",
    tags=["skill-matching"],
)

# Map normalized category labels to the codes used by the profile schema.
CATEGORY_CODES = {
    "coding": "COD",
    "data structures and algorithms": "DSA",
    "object oriented design": "OOD",
    "aptitude": "APT",
    "communication": "COM",
    "artificial intelligence": "AI",
    "cloud": "CLD",
    "sql": "SQL",
    "software engineering": "SWE",
    "system design": "SYS",
    "networking": "NET",
    "operating systems": "OS",
    "outside these category": "OTH",
}

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

MatchType = Literal["exact", "synonym", "fuzzy"]


class JobSkills(BaseModel):
    radix_categories: dict[str, list[str]] = Field(default_factory=dict)
    technologies: list[str] = Field(default_factory=list)


class SkillMatchingRequest(BaseModel):
    jd_source_file: str = "Job description"
    candidate_profile: ProfileResponseModel
    jd_skills: JobSkills


class MatchedSkill(BaseModel):
    skill_name: str
    category_code: str
    match_type: MatchType
    candidate_evidence: str
    candidate_confidence: str
    candidate_skill_level: int
    match_confidence: Literal["high", "medium", "low"]


class MissingSkill(BaseModel):
    skill_name: str
    category_code: str
    priority: Literal["high", "medium"]
    reason: str


class SkillGap(BaseModel):
    skill_name: str
    priority: Literal["high", "medium"]
    suggested_action: str


class Recommendation(BaseModel):
    skill_name: str
    action: str


class SkillMatchingResponse(BaseModel):
    jd_source_file: str
    match_score: float
    matched_skills: list[MatchedSkill]
    missing_skills: list[MissingSkill]
    skill_gaps: list[SkillGap]
    recommendations: list[Recommendation]
    match_confidence: Literal["high", "medium", "low"]
    ambiguity_alerts: list[str]


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
    return CATEGORY_CODES.get(normalize(category), "OTH")


def flatten_job_skills(job: JobSkills) -> list[dict[str, str]]:
    """Convert category lists and technologies into individual requirements."""
    requirements: list[dict[str, str]] = []
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
            requirements.append({
                "skill_name": skill.strip(),
                "category_code": code,
                "source": "category",
            })

    for technology in job.technologies:
        if not technology or not technology.strip():
            continue

        key = canonicalize(technology)
        if key in seen:
            requirements[seen[key]]["source"] = "technology"
            continue

        seen[key] = len(requirements)
        requirements.append({
            "skill_name": technology.strip(),
            "category_code": "OTH",
            "source": "technology",
        })

    return requirements


def candidate_evidence(profile: ProfileResponseModel) -> list[dict]:
    """
    Search evidence attached to candidate skills.

    A category label alone is not treated as proof of an individual
    technical skill. Evidence must mention the skill or a close equivalent.
    """
    evidence_items = []

    for skill in profile.skills:
        for evidence in skill.evidence:
            if evidence and evidence.strip():
                evidence_items.append({
                    "text": evidence.strip(),
                    "category": skill.skill_name,
                    "level": skill.skill_level,
                    "confidence": skill.confidence,
                })

    # Include other profile sections as supporting text, but keep their
    # source explicit so that they are not confused with verified skills.
    for section_name, entries in [
        ("hackathon", profile.hackathons),
        ("internship", profile.internships),
        ("certification", profile.certifications),
    ]:
        for entry in entries:
            if entry and entry.strip():
                evidence_items.append({
                    "text": entry.strip(),
                    "category": section_name,
                    "level": 1,
                    "confidence": "Low",
                })

    return evidence_items


def compare_skill(
    required_skill: str,
    evidence_text: str,
) -> tuple[float, MatchType | None]:
    """Return a similarity score and match type, if sufficiently similar."""
    required = normalize(required_skill)
    evidence = normalize(evidence_text)

    if not required or not evidence:
        return 0.0, None

    required_canonical = canonicalize(required_skill)
    evidence_canonical = canonicalize(evidence_text)

    if required == evidence:
        return 1.0, "exact"

    # Preserve exact matches when the skill appears in a longer sentence.
    if f" {required} " in f" {evidence} ":
        return 1.0, "exact"

    if required_canonical == evidence_canonical:
        return 0.95, "synonym"

    for group in SYNONYM_GROUPS:
        normalized_group = {normalize(alias) for alias in group}
        if required_canonical in normalized_group and any(
            f" {alias} " in f" {evidence} " for alias in normalized_group
        ):
            return 0.95, "synonym"

    # Check individual words and short word sequences. This helps compare
    # "REST API" with evidence such as "Built REST APIs for the project".
    words = evidence.split()
    candidates = [evidence]

    for size in range(1, min(5, len(words)) + 1):
        for start in range(len(words) - size + 1):
            candidates.append(" ".join(words[start:start + size]))

    best = max(
        SequenceMatcher(None, required, normalize(candidate)).ratio()
        for candidate in candidates
    )

    if best >= 0.86:
        return best, "fuzzy"

    return best, None


def priority_for(requirement: dict[str, str]) -> Literal["high", "medium"]:
    """
    Provisional priority rule.

    The current JD extraction schema doesn't distinguish required from
    preferred skills, so named technologies are flagged high and other
    extracted skills medium. Replace this with JD-derived priority later.
    """
    return "high" if requirement["source"] == "technology" else "medium"


def recommendation_for(skill_name: str) -> str:
    return (
        f"Review {skill_name}, complete a small practical exercise, "
        "and add a project or experience example that demonstrates it."
    )


@skill_matching_router.post(
    "/analyze",
    response_model=SkillMatchingResponse,
)
async def analyze_skill_match(
    request: SkillMatchingRequest,
) -> SkillMatchingResponse:
    requirements = flatten_job_skills(request.jd_skills)
    evidence_items = candidate_evidence(request.candidate_profile)

    if not requirements:
        return SkillMatchingResponse(
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
                "in ambiguity_alerts."
            ),
            (
                "human",
                "JD source: {jd_source_file}\n"
                "Requirements (JSON): {requirements}\n"
                "Candidate evidence (JSON): {evidence}\n\n"
                "Return the complete skill matching assessment."
            ),
        ]
    )
    chain = prompt | structured_model

    try:
        result = await asyncio.to_thread(
            chain.invoke,
            {
                "jd_source_file": request.jd_source_file,
                "requirements": json.dumps(requirements, ensure_ascii=False),
                "evidence": json.dumps(evidence_items, ensure_ascii=False),
            },
        )
        result = SkillMatchingResponse.model_validate(result)
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Skill matching model failed: {error}",
        ) from error

    result.jd_source_file = request.jd_source_file
    return result
