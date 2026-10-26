from typing import Any, Literal

from pydantic import BaseModel, Field, ConfigDict, model_validator


SkillCategory = Literal[
    "COD",
    "DSA",
    "OOD",
    "APTI",
    "COMM",
    "AI",
    "CLOUD",
    "SQL",
    "SWE",
    "SYSD",
    "NETW",
    "OS",
    "OTHER",
]


# Maps the skill/category names used by Role 3 to RADIX codes.
CATEGORY_ALIASES = {
    "coding": "COD",
    "programming": "COD",
    "data structures & algorithms": "DSA",
    "data structures and algorithms": "DSA",
    "dsa": "DSA",
    "object-oriented design": "OOD",
    "object oriented design": "OOD",
    "aptitude": "APTI",
    "communication": "COMM",
    "artificial intelligence": "AI",
    "cloud": "CLOUD",
    "sql": "SQL",
    "software engineering": "SWE",
    "system design": "SYSD",
    "networking": "NETW",
    "operating systems": "OS",
    "outside these category": "OTHER",
    "other": "OTHER",
    "net": "NETW",
    "sys": "SYSD",
    "com": "COMM",
    "db": "SQL",
    "database": "SQL",
    "databases": "SQL",
    "devops": "SWE",
    "test": "SWE",
    "testing": "SWE",
    "sec": "OTHER",
    "security": "OTHER",
    "apt": "APTI",
    "cld": "CLOUD",
}


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
        if "skill_name" not in data:
            data["skill_name"] = (
                data.get("name") or data.get("skill") or data.get("category")
            )

        # Map Role 3's skill level to Role 4's level
        if "level" not in data:
            data["level"] = data.get("skill_level")

        # Support Role 3's evidence list
        if "evidence" not in data:
            data["evidence"] = data.get("proof", "")

        if isinstance(data.get("evidence"), list):
            data["evidence"] = "\n".join(str(item) for item in data["evidence"])

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
            normalized = category.strip().lower()
            data["category_code"] = CATEGORY_ALIASES.get(
                normalized,
                category.strip().upper()
                if category.strip().upper()
                in {
                    "COD",
                    "DSA",
                    "OOD",
                    "APTI",
                    "COMM",
                    "AI",
                    "CLOUD",
                    "SQL",
                    "SWE",
                    "SYSD",
                    "NETW",
                    "OS",
                    "OTHER",
                }
                else None,
            )

        return data


class CandidateProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    email: str
    # Accept the existing string or the updated education object.
    education: str | dict[str, Any] = ""
    skills: list[Skill] = Field(default_factory=list)
    hackathons: list = Field(default_factory=list)
    internships: list = Field(default_factory=list)
    certifications: list = Field(default_factory=list)
    preferred_roles: list[str] = Field(default_factory=list)
    cv_file: str = ""


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

    company: str = Field(min_length=1)
    profile: CandidateProfile
