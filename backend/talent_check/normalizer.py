
from typing import Any
import re

from talent_check.schemas import CATEGORY_ALIASES


VALID_CATEGORIES = {
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"
}


FIELD_ALIASES = {
    "skill_name": ("skill_name", "skill", "name"),
    "evidence": ("evidence", "proof", "description"),
    "confidence": ("confidence", "certainty"),
    "category_code": (
        "skill_code",
        "category_code",
        "category",
        "skill_category",
    ),
    "level": ("skill_level", "level", "proficiency_level"),
}


# Map individual technical skills to RADIX categories.
SKILL_CATEGORY_ALIASES = {
    # Programming languages
    "java": "COD",
    "python": "COD",
    "c": "COD",
    "c++": "COD",
    "c#": "COD",
    "javascript": "COD",
    "typescript": "COD",
    "go": "COD",
    "golang": "COD",
    "rust": "COD",
    "kotlin": "COD",
    "swift": "COD",

    # Databases
    "postgresql": "SQL",
    "mysql": "SQL",
    "sqlite": "SQL",
    "sql queries": "SQL",

    # Cloud platforms
    "aws": "CLOUD",
    "amazon web services": "CLOUD",
    "azure": "CLOUD",
    "google cloud": "CLOUD",
    "gcp": "CLOUD",

    # Other common skills
    "operating system": "OS",
    "operating systems": "OS",
    "computer networks": "NETW",
    "computer networking": "NETW",
    "networking": "NETW",
    "system design": "SYSD",
    "software development": "SWE",
    "machine learning": "AI",
}


def find_value(data: dict, aliases: tuple[str, ...]) -> Any:
    """Find a field while ignoring capitalization and separators."""
    normalized = {
        str(key).strip().lower().replace("-", "_").replace(" ", "_"): value
        for key, value in data.items()
    }

    for alias in aliases:
        key = alias.strip().lower().replace("-", "_").replace(" ", "_")
        if key in normalized:
            return normalized[key]

    return None


def normalize_category(value: Any) -> str | None:
    """Convert a recognized category name or code to a RADIX category."""
    if not isinstance(value, str):
        return None

    normalized = value.strip().lower()
    normalized = normalized.replace("&", " and ")
    normalized = re.sub(r"[-_/]+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9 ]", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    # Normalize code aliases supplied by Role 3.
    code_aliases = {
        "net": "NETW",
        "sys": "SYSD",
        "com": "COMM",
        "apt": "APTI",
        "cld": "CLOUD",
        "oth": "OTHER",
    }

    if normalized in code_aliases:
        return code_aliases[normalized]

    if normalized.upper() in VALID_CATEGORIES:
        return normalized.upper()

    aliases = {}

    for alias, code in CATEGORY_ALIASES.items():
        key = alias.strip().lower().replace("&", " and ")
        key = re.sub(r"[-_/]+", " ", key)
        key = re.sub(r"[^a-z0-9 ]", "", key)
        key = re.sub(r"\s+", " ", key).strip()
        aliases[key] = code

    return aliases.get(normalized)


def normalize_skill(raw: dict) -> dict:
    """Convert a Role 3 skill object into Role 4's internal format."""
    if not isinstance(raw, dict):
        raise ValueError("Each skill must be a JSON object.")

    skill_name = find_value(raw, FIELD_ALIASES["skill_name"])
    evidence = find_value(raw, FIELD_ALIASES["evidence"])
    confidence = find_value(raw, FIELD_ALIASES["confidence"])
    category = find_value(raw, FIELD_ALIASES["category_code"])
    level = find_value(raw, FIELD_ALIASES["level"])

    if not isinstance(skill_name, str) or not skill_name.strip():
        raise ValueError("A skill is missing its skill name.")

    # Role 3 may send evidence as a list or as a single string.
    if evidence is None:
        evidence = ""

    if isinstance(evidence, list):
        if not all(isinstance(item, str) for item in evidence):
            raise ValueError(
                f"Evidence for '{skill_name}' must contain only text."
            )
        evidence = "\n".join(evidence)

    if not isinstance(evidence, str):
        raise ValueError(
            f"Evidence for '{skill_name}' must be text or a list of text."
        )

    # Normalize confidence values such as High -> high.
    if confidence is None or confidence == "":
        confidence = "medium"

    if not isinstance(confidence, str):
        raise ValueError(f"Confidence for '{skill_name}' must be text.")

    confidence = confidence.strip().lower()

    if confidence not in {"high", "medium", "low"}:
        raise ValueError(
            f"Unsupported confidence value for '{skill_name}'."
        )

    # Prefer the explicit category code supplied by Role 3.
    if category is not None and str(category).strip():
        category_code = normalize_category(category)

        if category_code is None:
            raise ValueError(
                f"Unsupported category '{category}' for skill '{skill_name}'."
            )
    else:
        # Fall back to recognized category names or specific skill mappings.
        category_code = normalize_category(skill_name)

        if category_code is None:
            normalized_skill = skill_name.strip().lower()
            category_code = SKILL_CATEGORY_ALIASES.get(normalized_skill)

    if category_code is None:
        raise ValueError(
            f"Cannot determine the RADIX category for '{skill_name}'. "
            "Provide a recognized category or skill mapping."
        )

    # Only use levels explicitly supplied by Role 3.
    # Missing levels remain unknown; do not invent a score.
    if level is not None:
        if isinstance(level, bool) or not isinstance(level, int):
            raise ValueError(
                f"Level for '{skill_name}' must be an integer from 1 to 10."
            )

        if not 1 <= level <= 10:
            raise ValueError(
                f"Level for '{skill_name}' must be from 1 to 10."
            )

    return {
        "skill_name": skill_name.strip(),
        "category_code": category_code,
        "evidence": evidence.strip(),
        "confidence": confidence,
        "level": level,
    }


def normalize_profile(raw: dict) -> dict:
    """Normalize a candidate profile without modifying the original JSON."""
    if not isinstance(raw, dict):
        raise ValueError("Candidate profile must be a JSON object.")

    profile = raw

    # Support profiles wrapped in common container keys.
    for wrapper in ("profile", "candidate_profile", "candidate"):
        nested = find_value(profile, (wrapper,))

        if isinstance(nested, dict):
            profile = nested
            break

    skills = find_value(profile, ("skills", "skillset", "skill_set"))

    if not isinstance(skills, list):
        raise ValueError("Profile must contain a skills list.")

    normalized_skills = [normalize_skill(skill) for skill in skills]

    def get_text(*names: str, default: str = "") -> str:
        value = find_value(profile, names)

        if value is None:
            return default

        if not isinstance(value, str):
            raise ValueError(f"Profile field '{names[0]}' must be text.")

        return value

    def get_list(*names: str) -> list:
        value = find_value(profile, names)

        if value is None:
            return []

        if not isinstance(value, list):
            raise ValueError(f"Profile field '{names[0]}' must be a list.")

        return value

    # Role 3 may provide education as a string or an object.
    education = find_value(profile, ("education", "qualification"))

    if education is None:
        education = ""

    if not isinstance(education, (str, dict)):
        raise ValueError(
            "Profile field 'education' must be text or an object."
        )

    preferred_roles = get_list(
        "preferred_roles", "preferred_role", "roles"
    )

    if not all(isinstance(role, str) for role in preferred_roles):
        raise ValueError("Every preferred role must be text.")

    return {
        "name": get_text("name", "candidate_name"),
        "email": get_text("email", "email_address"),
        "education": education,
        "skills": normalized_skills,
        "hackathons": get_list("hackathons"),
        "internships": get_list("internships"),
        "certifications": get_list("certifications", "certificates"),
        "preferred_roles": preferred_roles,
        "cv_file": get_text("cv_file", "resume_file", "resume"),
    }
