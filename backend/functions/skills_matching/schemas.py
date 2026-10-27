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


class CandidateEvidence(BaseModel):
    text: str
    category: str
    level: int
    confidence: str


class MatchedSkill(BaseModel):
    skill_name: str
    category_code: str
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
    skill_gaps: list[SkillGap]
    recommendations: list[Recommendation]
    match_confidence: Confidence
    ambiguity_alerts: list[str]
