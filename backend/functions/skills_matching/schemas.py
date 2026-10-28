from typing import Literal

from pydantic import BaseModel, Field

from utils.extract_data import ProfileResponseModel


MatchType = Literal["exact", "synonym", "fuzzy"]
Priority = Literal["high", "medium"]
Confidence = Literal["high", "medium", "low"]


class JobSkills(BaseModel):
    radix_categories: dict[str, list[str]] = Field(default_factory=dict)
    technologies: list[str] = Field(default_factory=list)


class SkillMatchingRequest(BaseModel):
    jd_source_file: str = "Job description"
    candidate_profile: ProfileResponseModel
    jd_skills: JobSkills


class SkillRequirement(BaseModel):
    skill_name: str
    category_code: str
    source: Literal["category", "technology"]
    # Normalized identifier used to de-duplicate aliases from one JD.
    canonical_id: str = ""
    supporting_terms: list[str] = Field(default_factory=list)


class CandidateEvidence(BaseModel):
    text: str
    category: str
    level: int
    confidence: str


class MatchedSkill(BaseModel):
    skill_name: str
    category_code: str
    source: Literal["category", "technology"] = "category"
    canonical_id: str = ""
    match_type: MatchType
    candidate_evidence: str
    candidate_confidence: str
    candidate_skill_level: int
    match_confidence: Confidence


class MissingSkill(BaseModel):
    skill_name: str
    category_code: str
    priority: Priority
    reason: str


class UnassessedSkill(BaseModel):
    """A JD requirement for which the supplied profile has no direct evidence."""

    skill_name: str
    category_code: str
    source: Literal["category", "technology"]
    canonical_id: str
    reason: str


class CanonicalSkillClassification(BaseModel):
    """One classification for one official RADIX category."""

    category_code: str
    category_name: str
    status: Literal["matched", "gap", "not_assessed", "not_applicable"]
    required_by_jd: bool
    candidate_level: int | None = None
    candidate_evidence: str = ""
    reason: str


class SkillGap(BaseModel):
    skill_name: str
    priority: Priority
    suggested_action: str


class Recommendation(BaseModel):
    skill_name: str
    action: str


class SkillMatchingResponse(BaseModel):
    jd_source_file: str
    match_score: float
    matched_skills: list[MatchedSkill]
    missing_skills: list[MissingSkill]
    # Kept separate from gaps: the JD extractor does not provide required levels,
    # so absent evidence cannot establish a below-requirement proficiency gap.
    unassessed_skills: list[UnassessedSkill] = Field(default_factory=list)
    unmapped_requirements: list[SkillRequirement] = Field(default_factory=list)
    canonical_skills: list[CanonicalSkillClassification] = Field(default_factory=list)
    skill_gaps: list[SkillGap]
    recommendations: list[Recommendation]
    match_confidence: Confidence
    ambiguity_alerts: list[str]
