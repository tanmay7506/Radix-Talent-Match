import re
from typing import Any, Literal

from pydantic import BaseModel, Field, ConfigDict, model_validator
from functions.skill_categories import TALENT_CATEGORY_ALIASES, TALENT_CATEGORIES


SkillCategory = Literal[*TALENT_CATEGORIES, "OTHER"]


def normalize_category(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower().replace("&", " and ")
    normalized = re.sub(r"[-_/]+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9 ]", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if normalized.upper() in (*TALENT_CATEGORIES, "OTHER"):
        return normalized.upper()
    return TALENT_CATEGORY_ALIASES.get(normalized)


class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skill_name: str = Field(min_length=1)
    category_code: SkillCategory | None = None
    evidence: str = ""
    confidence: Literal["high", "medium", "low"] = "medium"
    level: int | None = Field(default=None, ge=1, le=10)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data

        data = data.copy()

        # Read Role 3's skill name
        normalized_keys = {
            str(key).strip().lower().replace("-", "_").replace(" ", "_"): value
            for key, value in data.items()
        }
        for field, aliases in {
            "skill_name": ("skill_name", "skill", "name"),
            "level": ("skill_level", "level", "proficiency_level"),
            "evidence": ("evidence", "proof", "description"),
            "confidence": ("confidence", "certainty"),
            "category_code": (
                "skill_code",
                "category_code",
                "category",
                "skill_category",
            ),
        }.items():
            if field not in data:
                data[field] = next(
                    (normalized_keys[a] for a in aliases if a in normalized_keys), None
                )

        # Map Role 3's skill level to Role 4's level
        if "level" not in data:
            data["level"] = data.get("skill_level")

        # Support Role 3's evidence list
        if "evidence" not in data:
            data["evidence"] = data.get("proof", "")

        if isinstance(data.get("evidence"), list):
            if not all(isinstance(item, str) for item in data["evidence"]):
                raise ValueError("Evidence must contain only text.")
            data["evidence"] = "\n".join(data["evidence"])

        # Normalize confidence: High -> high
        confidence = data.get("confidence", "medium")
        if isinstance(confidence, str):
            data["confidence"] = confidence.strip().lower()

        # Prefer Role 3's skill_code over inferred category names
        category = (
            data.get("skill_code")
            or data.get("category_code")
            or data.get("category")
            or data.get("skill_name")
        )

        if isinstance(category, str):
            data["category_code"] = normalize_category(category)
            if data["category_code"] is None:
                data["category_code"] = normalize_category(data.get("skill_name"))

        return data


class CandidateProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    email: str
    # Accept the existing string or the updated education object.
    education: str | dict[str, Any] = ""
    skills: list[Skill]
    hackathons: list = Field(default_factory=list)
    internships: list = Field(default_factory=list)
    certifications: list = Field(default_factory=list)
    preferred_roles: list[str] = Field(default_factory=list)
    cv_file: str = ""

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if not isinstance(data, dict):
            return data
        data = data.copy()
        keys = {
            str(k).strip().lower().replace("-", "_").replace(" ", "_"): v
            for k, v in data.items()
        }
        for field, aliases in {
            "name": ("name", "candidate_name"),
            "email": ("email", "email_address"),
            "education": ("education", "qualification"),
            "skills": ("skills", "skillset", "skill_set"),
            "certifications": ("certifications", "certificates"),
            "preferred_roles": ("preferred_roles", "preferred_role", "roles"),
            "cv_file": ("cv_file", "resume_file", "resume"),
        }.items():
            if field not in data:
                value = next((keys[a] for a in aliases if a in keys), None)
                if value is not None:
                    data[field] = value
        for wrapper in ("profile", "candidate_profile", "candidate"):
            nested = keys.get(wrapper)
            if isinstance(nested, dict):
                return nested
        return data


class SkillsetGap(BaseModel):
    category_code: SkillCategory
    category_name: str
    required_level: int = Field(ge=1, le=10)
    candidate_level: int | None = Field(default=None, ge=1, le=10)

    # Numerical shortfall; null when candidate level is unknown.
    gap: int | None = Field(default=None, ge=0)

    # null means the candidate level is unknown.
    meets_requirement: bool | None = None

    evidence: list[str] = Field(default_factory=list)
    confidence: Literal["high", "medium", "low"] | None = None


class TalentCheckResponse(BaseModel):
    company: str
    role: str | None = None

    # null when no categories have known levels.
    readiness_score: float | None = Field(default=None, ge=0, le=100)

    assessed_categories: int = Field(ge=0, le=12)
    total_categories: int = Field(default=12, ge=1, le=12)
    coverage_percentage: float = Field(ge=0, le=100)

    skills_meeting_requirement: int = Field(ge=0, le=12)
    skills_below_requirement: int = Field(ge=0, le=12)
    skills_not_assessed: int = Field(ge=0, le=12)

    # Keep the existing field name so current API consumers
    # have less to change.
    skillset_gap: list[SkillsetGap]


class TalentCheckRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    company: str | None = Field(default=None, min_length=1)
    company_id: int | None = None
    profile: CandidateProfile

    @model_validator(mode="before")
    @classmethod
    def extract_profile(cls, data):
        if not isinstance(data, dict) or "profile" in data:
            return data
        request_fields = {"company", "company_id", "role"}
        return {
            "company": data.get("company"),
            "company_id": data.get("company_id"),
            "profile": {
                key: value for key, value in data.items() if key not in request_fields
            },
        }
