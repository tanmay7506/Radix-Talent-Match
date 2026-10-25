
from app.schemas import CandidateProfile, SkillsetGap, TalentCheckResponse


CATEGORIES = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
]

CATEGORY_NAMES = {
    "COD": "Coding",
    "DSA": "Data Structures & Algorithms",
    "OOD": "Object-Oriented Design",
    "APTI": "Aptitude",
    "COMM": "Communication",
    "AI": "Artificial Intelligence",
    "CLOUD": "Cloud Computing",
    "SQL": "SQL",
    "SWE": "Software Engineering",
    "SYSD": "System Design",
    "NETW": "Networking",
    "OS": "Operating Systems",
}


def estimate_candidate_level(skill) -> int | None:
    """
    Temporary fallback until the AI proficiency assessor is implemented.

    An explicitly supplied level is used directly.
    Evidence without a level gets a provisional level of 3.
    Missing evidence remains unknown.
    """
    if skill.level is not None:
        return skill.level

    if skill.evidence.strip():
        return 3

    return None


def calculate_readiness(
    skillset_gap: list[SkillsetGap],
) -> float | None:
    """
    Calculate readiness using only categories with known candidate levels.

    Returns None if no categories have been assessed.
    """
    assessed = [
        item
        for item in skillset_gap
        if item.candidate_level is not None
    ]

    if not assessed:
        return None

    attainment_scores = [
        min(item.candidate_level / item.required_level, 1.0)
        for item in assessed
    ]

    return round(sum(attainment_scores) / len(attainment_scores) * 100, 2)


def run_talent_check(
    profile: CandidateProfile,
    company: str,
    company_requirements: dict[str, int],
) -> TalentCheckResponse:
    """
    Compare a candidate profile against a company's required skill levels.
    Required and candidate levels use a scale of 1 to 10.
    """
    if not company.strip():
        raise ValueError("Company name cannot be empty.")

    missing_categories = set(CATEGORIES) - set(company_requirements)

    if missing_categories:
        raise ValueError(
            "Company requirements are missing categories: "
            + ", ".join(sorted(missing_categories))
        )

    for category, level in company_requirements.items():
        if category not in CATEGORIES:
            raise ValueError(
                f"Unsupported company requirement category: {category}"
            )

        if (
            not isinstance(level, int)
            or isinstance(level, bool)
            or not 1 <= level <= 10
        ):
            raise ValueError(
                f"Required level for {category} must be an integer from 1 to 10."
            )

    # Start as unknown, rather than incorrectly assigning level 1.
    candidate_levels: dict[str, int | None] = {
        category: None for category in CATEGORIES
    }

    category_evidence: dict[str, list[str]] = {
        category: [] for category in CATEGORIES
    }

    category_confidence: dict[str, str | None] = {
        category: None for category in CATEGORIES
    }

    confidence_rank = {"low": 1, "medium": 2, "high": 3}

    for skill in profile.skills:
        category = skill.category_code

        if category not in CATEGORIES:
            continue

        level = estimate_candidate_level(skill)

        # Keep the highest available level for each category.
        if level is not None:
            current = candidate_levels[category]
            if current is None or level > current:
                candidate_levels[category] = level

        if skill.evidence.strip():
            category_evidence[category].append(skill.evidence.strip())

        current_confidence = category_confidence[category]

        if (
            current_confidence is None
            or confidence_rank[skill.confidence]
            > confidence_rank[current_confidence]
        ):
            category_confidence[category] = skill.confidence

    gaps = []

    for category in CATEGORIES:
        required = company_requirements[category]
        candidate = candidate_levels[category]

        if candidate is None:
            numerical_gap = None
            meets_requirement = None
        else:
            numerical_gap = max(0, required - candidate)
            meets_requirement = candidate >= required

        gaps.append(
            SkillsetGap(
                category_code=category,
                category_name=CATEGORY_NAMES[category],
                required_level=required,
                candidate_level=candidate,
                gap=numerical_gap,
                meets_requirement=meets_requirement,
                evidence=category_evidence[category],
                confidence=category_confidence[category],
            )
        )

    assessed_categories = sum(
        1 for item in gaps if item.candidate_level is not None
    )

    meeting_count = sum(
        1 for item in gaps if item.meets_requirement is True
    )

    below_count = sum(
        1 for item in gaps if item.meets_requirement is False
    )

    not_assessed_count = len(CATEGORIES) - assessed_categories

    readiness_score = calculate_readiness(gaps)

    coverage_percentage = round(
        assessed_categories / len(CATEGORIES) * 100, 2
    )

    return TalentCheckResponse(
        company=company,
        role=profile.preferred_roles[0] if profile.preferred_roles else None,
        skillset_gap=gaps,
        readiness_score=readiness_score,
        assessed_categories=assessed_categories,
        total_categories=len(CATEGORIES),
        coverage_percentage=coverage_percentage,
        skills_meeting_requirement=meeting_count,
        skills_below_requirement=below_count,
        skills_not_assessed=not_assessed_count,
    )
