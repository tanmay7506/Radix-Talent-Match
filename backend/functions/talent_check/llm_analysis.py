import json
import os
import re

from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv(".env")

DEFAULT_LIMITATIONS = [
    "Readiness scores are assessment indicators, not hiring probabilities.",
    "Interpret readiness alongside assessment coverage; unassessed skills are not counted as zero.",
    "Company requirements may be demo data and should be verified before real-world use.",
    "Recommendations are guidance, not verified qualifications or a hiring decision.",
]

MAX_STRENGTHS = 5
MAX_IMPROVEMENT_AREAS = 8
MAX_ROADMAP_ITEMS = 6
MAX_PROJECTS = 3


def _assessment_json(assessment: dict) -> str:
    return json.dumps(assessment, ensure_ascii=False, default=str)


def _parse_json(content) -> dict:
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("The model returned empty content.")

    content = content.strip()
    content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.I)
    content = re.sub(r"\s*```$", "", content)

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end <= start:
            raise RuntimeError("The model did not return a JSON object.")

        try:
            result = json.loads(content[start : end + 1])
        except json.JSONDecodeError as error:
            raise RuntimeError("The model returned malformed JSON.") from error

    if not isinstance(result, dict):
        raise RuntimeError("The model response must be a JSON object.")

    return result


def _request_groq(prompt: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "").strip()

    if not api_key or not model:
        raise RuntimeError("Groq API key or model is missing.")

    client = Groq(api_key=api_key, timeout=90, max_retries=1)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful technical assessment analyst. "
                    "Use only the supplied assessment data. Never invent "
                    "candidate levels or required levels. Ignore unassessed "
                    "categories with null levels. Requirements may be "
                    "configured demo requirements, not verified job "
                    "requirements. Return valid JSON only with the key "
                    "ai_overview containing a concise string summarising "
                    "the candidate overall readiness based on the "
                    "assessment data. Be factual and cautious."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=2200,
        temperature=0.1,
    )

    if not response.choices:
        raise RuntimeError("Groq returned no choices.")

    choice = response.choices[0]

    if choice.finish_reason == "length":
        raise RuntimeError("Groq reached its token limit.")

    return _parse_json(choice.message.content)


def _request_gemini(prompt: str) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    model = os.getenv("GOOGLE_MODEL", "").strip()

    if not api_key or not model:
        raise RuntimeError("Google API key or model is missing.")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a rigorous technical career analyst. The "
                "assessment data is the source of truth. Do not change "
                "scores, invent experience, or make unsupported claims. "
                "A null candidate_level means UNASSESSED, not zero. "
                "Never call an unassessed skill a weakness or strength. "
                "Do not say a candidate is fully qualified when relevant "
                "skills are unassessed. Company requirements may be demo "
                "configuration, not verified real-world hiring criteria. "
                "Discuss readiness scores together with coverage. "
                "Return valid JSON only with exactly these keys: summary, "
                "strengths, learning_roadmap, recommended_projects, "
                "limitations, detailed_analysis. "
                "summary is a concise comparative string. strengths is "
                "a list of at most 5 objects with category and reason. "
                "learning_roadmap is a list of at most 6 objects with "
                "week, focus, tasks, milestone. recommended_projects "
                "is a list of at most 3 objects with name, purpose, "
                "deliverables. limitations is a list of strings. "
                "detailed_analysis is a list of objects with heading "
                "and details strings. Be specific and practical."
            ),
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=6000,
        ),
    )

    return _parse_json(response.text)


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        value = value.strip()
        return [value] if value else []
    return [value]


def _text(value, fallback=""):
    if value is None:
        return fallback
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    return fallback


def _normalize_roadmap(items):
    result = []

    for item in _as_list(items):
        if not isinstance(item, dict):
            continue

        result.append(
            {
                "week": _text(item.get("week"), "To be scheduled"),
                "focus": _text(item.get("focus"), "Skill development"),
                "tasks": [
                    _text(task)
                    for task in _as_list(item.get("tasks"))
                    if task is not None
                ],
                "milestone": _text(item.get("milestone"), "Review progress"),
            }
        )

    return result[:MAX_ROADMAP_ITEMS]


def _normalize_projects(items):
    result = []

    for item in _as_list(items):
        if not isinstance(item, dict):
            continue

        result.append(
            {
                "name": _text(item.get("name"), "Practical skill project"),
                "purpose": _text(item.get("purpose")),
                "deliverables": [
                    _text(value)
                    for value in _as_list(item.get("deliverables"))
                    if value is not None
                ],
            }
        )

    return result[:MAX_PROJECTS]


def _normalize_details(items):
    result = []

    for item in _as_list(items):
        if not isinstance(item, dict):
            continue

        heading = _text(item.get("heading")).strip()
        details = _text(item.get("details")).strip()

        if heading and details:
            result.append({"heading": heading, "details": details})

    return result


def _company_assessments(assessment):
    if isinstance(assessment, list):
        return assessment

    if not isinstance(assessment, dict):
        return []

    companies = assessment.get("assessments")
    if isinstance(companies, list):
        return companies

    single = assessment.get("assessment")
    if isinstance(single, dict):
        return [single]

    if "company" in assessment and "skillset_gap" in assessment:
        return [assessment]

    return []


def _skill_rows(assessment):
    rows = []

    for company in _company_assessments(assessment):
        if not isinstance(company, dict):
            continue

        company_name = _text(company.get("company"), "Unknown company")
        role = _text(company.get("role"), "Unspecified role")

        for skill in _as_list(company.get("skillset_gap")):
            if not isinstance(skill, dict):
                continue

            rows.append(
                {
                    "company": company_name,
                    "role": role,
                    "category": _text(
                        skill.get("category_name")
                        or skill.get("category")
                        or skill.get("category_code"),
                        "Unknown category",
                    ),
                    "category_code": _text(skill.get("category_code")),
                    "candidate_level": skill.get("candidate_level"),
                    "required_level": skill.get("required_level"),
                    "gap": skill.get("gap"),
                    "meets_requirement": skill.get("meets_requirement"),
                    "evidence": _as_list(skill.get("evidence")),
                    "confidence": skill.get("confidence"),
                }
            )

    return rows


def _valid_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _deterministic_improvements(assessment):
    improvements = []

    for row in _skill_rows(assessment):
        current = row["candidate_level"]
        required = row["required_level"]

        if not _valid_number(current) or not _valid_number(required):
            continue

        if current >= required:
            continue

        gap = required - current

        improvements.append(
            {
                "category": row["category"],
                "category_code": row.get("category_code") or "",
                "current_level": current,
                "required_level": required,
                "gap": gap,
                "company": row["company"],
                "role": row["role"],
                "reason": (
                    f"{row['company']} ({row['role']}) has a configured "
                    f"requirement of {required} for {row['category']}; "
                    f"the assessed level is {current}, leaving a gap of {gap}."
                ),
            }
        )

    improvements.sort(
        key=lambda item: (
            -item["gap"],
            item["category"],
            item["company"],
        )
    )

    return improvements[:MAX_IMPROVEMENT_AREAS]


def _deterministic_strengths(assessment):
    best = {}

    for row in _skill_rows(assessment):
        current = row["candidate_level"]
        required = row["required_level"]

        if not _valid_number(current) or not _valid_number(required):
            continue

        if current < required or row["meets_requirement"] is False:
            continue

        key = row["category"]
        evidence = row["evidence"]

        if key not in best or current > best[key]["level"]:
            best[key] = {
                "category": key,
                "level": current,
                "required": required,
                "company": row["company"],
                "evidence": evidence,
            }

    result = []

    for item in sorted(
        best.values(),
        key=lambda x: (-x["level"], x["category"]),
    )[:MAX_STRENGTHS]:
        evidence_text = "; ".join(_text(value) for value in item["evidence"][:2])

        reason = (
            f"Assessed at level {item['level']} against a configured "
            f"requirement of {item['required']} for {item['company']}."
        )

        if evidence_text:
            reason += f" Supporting evidence: {evidence_text}"

        result.append(
            {
                "category": item["category"],
                "reason": reason,
            }
        )

    return result


def _deterministic_summary(assessment):
    companies = _company_assessments(assessment)
    rows = _skill_rows(assessment)

    if not companies:
        return (
            "No company assessment results were available to compare. "
            "Review the assessment input and company requirements."
        )

    ranked = []

    for company in companies:
        if not isinstance(company, dict):
            continue

        score = company.get("readiness_score")
        coverage = company.get("coverage_percentage")
        name = _text(company.get("company"), "Unknown company")

        if _valid_number(score):
            ranked.append(
                {
                    "name": name,
                    "score": score,
                    "coverage": coverage,
                }
            )

    ranked.sort(key=lambda x: -x["score"])

    pieces = []

    if ranked:
        pieces.append(
            "Highest calculated readiness score: "
            + ranked[0]["name"]
            + f" ({ranked[0]['score']:.2f}%)."
        )

        pieces.append(
            "These scores reflect the configured assessment data and "
            "are not hiring probabilities."
        )

    gaps = _deterministic_improvements(assessment)

    if gaps:
        gap_labels = []
        seen = set()

        for item in gaps:
            label = f"{item['category']} ({item['company']})"
            if label not in seen:
                gap_labels.append(label)
                seen.add(label)

        pieces.append("Confirmed assessed gaps: " + "; ".join(gap_labels) + ".")
    else:
        pieces.append(
            "No below-requirement gaps were found among the assessed "
            "categories. This does not establish full role readiness."
        )

    unassessed = sorted(
        {row["category"] for row in rows if row["candidate_level"] is None}
    )

    if unassessed:
        pieces.append(
            "Unassessed categories: "
            + ", ".join(unassessed)
            + ". These must not be interpreted as zero-level skills."
        )

    return " ".join(pieces)


def _graph_data(assessment):
    companies = []
    skill_map = {}

    for company in _company_assessments(assessment):
        if not isinstance(company, dict):
            continue

        name = _text(company.get("company"), "Unknown company")
        score = company.get("readiness_score")
        coverage = company.get("coverage_percentage")

        companies.append(
            {
                "company": name,
                "role": _text(company.get("role"), "Unspecified role"),
                "readiness_score": score,
                "coverage_percentage": coverage,
                "assessed_categories": company.get("assessed_categories", 0),
                "total_categories": company.get("total_categories", 0),
                "skills_meeting_requirement": company.get(
                    "skills_meeting_requirement", 0
                ),
                "skills_below_requirement": company.get("skills_below_requirement", 0),
                "skills_not_assessed": company.get("skills_not_assessed", 0),
            }
        )

        for skill in _as_list(company.get("skillset_gap")):
            if not isinstance(skill, dict):
                continue

            category = _text(
                skill.get("category_name")
                or skill.get("category")
                or skill.get("category_code"),
                "Unknown category",
            )

            if category not in skill_map:
                skill_map[category] = []

            skill_map[category].append(
                {
                    "company": name,
                    "candidate_level": skill.get("candidate_level"),
                    "required_level": skill.get("required_level"),
                    "gap": skill.get("gap"),
                    "meets_requirement": skill.get("meets_requirement"),
                }
            )

    return {
        "readiness_by_company": {
            "chart_type": "bar",
            "title": "Candidate readiness by company",
            "x_key": "company",
            "y_key": "readiness_score",
            "unit": "percent",
            "data": companies,
        },
        "coverage_by_company": {
            "chart_type": "bar",
            "title": "Assessment coverage by company",
            "x_key": "company",
            "y_key": "coverage_percentage",
            "unit": "percent",
            "data": companies,
        },
        "skill_comparison": {
            "chart_type": "grouped_bar",
            "title": "Assessed candidate levels versus configured requirements",
            "category_key": "category",
            "data": [
                {
                    "category": category,
                    "companies": values,
                }
                for category, values in sorted(skill_map.items())
            ],
            "note": (
                "Null candidate levels are unassessed and should be "
                "displayed as missing values, not zeros."
            ),
        },
    }


def _category_guidance(category):
    """Return practical tasks for a confirmed skill gap."""
    key = re.sub(r"[^a-z0-9]", "", _text(category).lower())

    guidance = {
        "netw": (
            "Networking",
            [
                "Review TCP/IP, DNS, HTTP/HTTPS, TLS, ports, and connection lifecycle.",
                "Trace requests with browser developer tools or a packet-analysis tool.",
                "Write a short troubleshooting note explaining one observed network failure.",
            ],
            "Explain and diagnose a network request end to end, including one failure case.",
        ),
        "networking": (
            "Networking",
            [
                "Review TCP/IP, DNS, HTTP/HTTPS, TLS, ports, and connection lifecycle.",
                "Trace requests with browser developer tools or a packet-analysis tool.",
                "Write a short troubleshooting note explaining one observed network failure.",
            ],
            "Explain and diagnose a network request end to end, including one failure case.",
        ),
        "netwoking": (
            "Networking",
            [
                "Review TCP/IP, DNS, HTTP/HTTPS, TLS, ports, and connection lifecycle.",
                "Trace requests with browser developer tools or a packet-analysis tool.",
                "Write a short troubleshooting note explaining one observed network failure.",
            ],
            "Explain and diagnose a network request end to end, including one failure case.",
        ),
        "swe": (
            "Software Engineering",
            [
                "Add unit and integration tests around important application paths.",
                "Review error handling, logging, input validation, and code structure.",
                "Set up a repeatable test command and document the development workflow.",
            ],
            "Demonstrate a tested change with clear logs and reproducible test results.",
        ),
        "softwareengineering": (
            "Software Engineering",
            [
                "Add unit and integration tests around important application paths.",
                "Review error handling, logging, input validation, and code structure.",
                "Set up a repeatable test command and document the development workflow.",
            ],
            "Demonstrate a tested change with clear logs and reproducible test results.",
        ),
        "sysd": (
            "System Design",
            [
                "Document components, APIs, data flow, and the main system bottlenecks.",
                "Compare caching, load balancing, consistency, and failure-handling trade-offs.",
                "Load-test one endpoint and explain the results and next design change.",
            ],
            "Present a system design with explicit trade-offs and measured test results.",
        ),
        "systemdesign": (
            "System Design",
            [
                "Document components, APIs, data flow, and the main system bottlenecks.",
                "Compare caching, load balancing, consistency, and failure-handling trade-offs.",
                "Load-test one endpoint and explain the results and next design change.",
            ],
            "Present a system design with explicit trade-offs and measured test results.",
        ),
        "comm": (
            "Communication",
            [
                "Prepare a concise explanation of one project’s problem, design, and outcome.",
                "Write a clear README with setup steps, architecture, and known limitations.",
                "Practise a short technical walkthrough and ask a peer for specific feedback.",
            ],
            "Deliver a clear project walkthrough and revise it using feedback.",
        ),
        "communication": (
            "Communication",
            [
                "Prepare a concise explanation of one project’s problem, design, and outcome.",
                "Write a clear README with setup steps, architecture, and known limitations.",
                "Practise a short technical walkthrough and ask a peer for specific feedback.",
            ],
            "Deliver a clear project walkthrough and revise it using feedback.",
        ),
        "sql": (
            "SQL",
            [
                "Practise SELECT, filtering, joins, grouping, subqueries, and constraints.",
                "Design a small relational schema and write queries against sample data.",
                "Check query results against expected cases and document assumptions.",
            ],
            "Complete a small database exercise with tested queries and a documented schema.",
        ),
        "cloud": (
            "Cloud",
            [
                "Review deployment basics, environment variables, networking, and logs.",
                "Deploy a small service using a cloud or equivalent deployment environment.",
                "Document health checks, configuration, and how to roll back a failed release.",
            ],
            "Deploy a service with a health check and reproducible setup instructions.",
        ),
        "ai": (
            "Artificial Intelligence",
            [
                "Choose a small, clearly scoped AI task and establish a baseline.",
                "Evaluate outputs on a small test set and record failure cases.",
                "Document limitations and avoid claiming capabilities not measured.",
            ],
            "Demonstrate an AI prototype with a test set, results, and limitations.",
        ),
        "apti": (
            "Aptitude",
            [
                "Take a timed diagnostic covering quantitative and logical reasoning.",
                "Group mistakes by topic and practise the weakest measured areas.",
                "Repeat a comparable timed test and track accuracy and time.",
            ],
            "Compare two timed practice results and explain the improvement areas.",
        ),
        "coding": (
            "Coding",
            [
                "Solve targeted problems and explain the time and space complexity.",
                "Implement edge-case tests and compare alternative approaches.",
                "Review readability and correctness before submitting the solution.",
            ],
            "Complete a small set of tested solutions with complexity explanations.",
        ),
        "cod": (
            "Coding",
            [
                "Solve targeted problems and explain the time and space complexity.",
                "Implement edge-case tests and compare alternative approaches.",
                "Review readability and correctness before submitting the solution.",
            ],
            "Complete a small set of tested solutions with complexity explanations.",
        ),
        "dsa": (
            "Data Structures and Algorithms",
            [
                "Practise problems across the relevant data structures and algorithms.",
                "Explain complexity and test empty, boundary, and large inputs.",
                "Revisit missed problems after a delay and record the key insight.",
            ],
            "Solve representative problems and explain correctness and complexity.",
        ),
        "ood": (
            "Object-Oriented Design",
            [
                "Model a small domain with classes, interfaces, and clear responsibilities.",
                "Apply composition and suitable design patterns only where they help.",
                "Add tests and explain the design trade-offs.",
            ],
            "Present a tested object-oriented design and justify its key choices.",
        ),
        "os": (
            "Operating Systems",
            [
                "Review processes, threads, synchronization, memory, and scheduling.",
                "Build or inspect a small concurrent program and test race-prone cases.",
                "Explain one observed concurrency or resource-management issue.",
            ],
            "Demonstrate an operating-systems concept with a reproducible example.",
        ),
    }

    if key in guidance:
        return guidance[key]

    display = _text(category, "Skill development")
    return (
        display,
        [
            f"Review the core concepts and practical tasks for {display}.",
            f"Complete an exercise that demonstrates {display} in practice.",
            "Document the result and request feedback against explicit criteria.",
        ],
        f"Complete a practical assessment demonstrating progress in {display}.",
    )


def _jd_terms_for_category(category_code: str, category_name: str, jd_skills: dict | None) -> list[str]:
    """Extract specific skills and technologies mentioned in the uploaded JD for this category."""
    if not jd_skills or not isinstance(jd_skills, dict):
        return []
    terms = []
    from functions.talent_check.schemas import normalize_category

    radix_categories = jd_skills.get("radix_categories") or {}
    technologies = jd_skills.get("technologies") or []

    for cat_key, items in radix_categories.items():
        if not isinstance(items, list):
            continue
        mapped_code = normalize_category(cat_key)
        if mapped_code == category_code or normalize_category(category_name) == mapped_code:
            terms.extend([str(item).strip() for item in items if str(item).strip()])

    for tech in technologies:
        if isinstance(tech, str) and tech.strip():
            if normalize_category(tech) == category_code:
                terms.append(tech.strip())

    return list(dict.fromkeys(terms))


def _category_prerequisites(category_code: str, candidate_level: int | None) -> list[dict]:
    """Identify prerequisites only when genuinely necessary for a relevant gap."""
    if candidate_level is not None and candidate_level >= 4:
        return []

    prereq_catalog = {
        "SQL": {
            "title": "Relational Data Modeling & Basic CRUD",
            "reason": "Foundational database schema concepts required before advanced query optimization.",
            "tasks": [
                "Review relational tables, primary/foreign key constraints, and normalization (1NF-3NF).",
                "Practise fundamental SELECT, INSERT, UPDATE, and DELETE operations on sample data.",
            ],
            "checkpoint": "Checkpoint — Basic Relational Schema",
        },
        "COD": {
            "title": "Syntax, Control Flow & Modular Functions",
            "reason": "Core programming mechanics required before production application development.",
            "tasks": [
                "Review variables, data types, loops, conditionals, and modular function decomposition.",
                "Implement structured error handling and clean code conventions.",
            ],
            "checkpoint": "Checkpoint — Core Program Flow & Unit Tests",
        },
        "DSA": {
            "title": "Linear Data Structures & Complexity Basics",
            "reason": "Arrays, hash maps, and complexity analysis are prerequisites for non-linear structures.",
            "tasks": [
                "Implement and manipulate arrays, strings, hash maps, and hash sets.",
                "Analyse Time and Space complexity (Big-O) for search and sort operations.",
            ],
            "checkpoint": "Checkpoint — Linear Structure Implementations",
        },
        "SYSD": {
            "title": "Client-Server Architecture & HTTP Basics",
            "reason": "Understanding network protocols and APIs is essential before distributed system design.",
            "tasks": [
                "Review client-server request-response lifecycle and HTTP status codes.",
                "Understand synchronous vs asynchronous communication patterns.",
            ],
            "checkpoint": "Checkpoint — RESTful Communication Baseline",
        },
        "SWE": {
            "title": "Git Version Control & Basic Unit Testing",
            "reason": "Clean versioning and test-driven habits are required before CI/CD pipelines.",
            "tasks": [
                "Practise Git branch workflows, pull requests, and commit standards.",
                "Write basic unit tests asserting input/output boundaries.",
            ],
            "checkpoint": "Checkpoint — Git Workflow & Test Suite",
        },
        "CLOUD": {
            "title": "CLI Navigation & Container Basics",
            "reason": "Command-line competence and containers are required before deploying cloud services.",
            "tasks": [
                "Review shell commands, environment variables, and process management.",
                "Create a simple Dockerfile and run a containerized application.",
            ],
            "checkpoint": "Checkpoint — Local Container Execution",
        },
        "OOD": {
            "title": "Classes, Objects & Encapsulation Basics",
            "reason": "Object orientation fundamentals precede design patterns and SOLID principles.",
            "tasks": [
                "Model simple real-world entities with classes, attributes, and methods.",
                "Practise encapsulation, inheritance, and interface contracts.",
            ],
            "checkpoint": "Checkpoint — Domain Model with Unit Tests",
        },
        "AI": {
            "title": "API Integration & Structured JSON Handling",
            "reason": "Working with model endpoints and validating schemas precedes complex AI architectures.",
            "tasks": [
                "Connect to an AI API endpoint and pass structured parameters.",
                "Validate model response JSON schemas with strict validation.",
            ],
            "checkpoint": "Checkpoint — Structured API Pipeline",
        },
        "OS": {
            "title": "Process, Memory & File System Fundamentals",
            "reason": "Operating system basics are required before tackling multithreading and synchronization.",
            "tasks": [
                "Review process states, memory allocation, and file descriptors.",
                "Inspect running processes and resource usage via system utilities.",
            ],
            "checkpoint": "Checkpoint — Process Inspection & Trace",
        },
        "NETW": {
            "title": "TCP/IP, DNS & Port Fundamentals",
            "reason": "Transport and naming basics are required before advanced network diagnostics.",
            "tasks": [
                "Review IP addressing, DNS resolution, and TCP handshake steps.",
                "Inspect local network ports and active socket connections.",
            ],
            "checkpoint": "Checkpoint — Socket Connection Trace",
        },
        "COMM": {
            "title": "Technical Documentation Foundations",
            "reason": "Clear written structure is essential before presenting complex system designs.",
            "tasks": [
                "Draft structured markdown documentation explaining a technical feature.",
                "Define user expectations, setup instructions, and known boundaries.",
            ],
            "checkpoint": "Checkpoint — Documentation Review",
        },
        "APTI": {
            "title": "Quantitative & Logical Diagnostic Baseline",
            "reason": "A baseline diagnostic isolates specific problem types needing focused remediation.",
            "tasks": [
                "Complete a foundational problem set covering arithmetic and logical deduction.",
                "Identify specific problem patterns causing incorrect answers.",
            ],
            "checkpoint": "Checkpoint — Diagnostic Gap Inventory",
        },
    }

    entry = prereq_catalog.get(category_code)
    if not entry:
        return []

    return [{
        "id": f"prereq-{category_code.lower()}",
        "title": entry["title"],
        "category_code": category_code,
        "node_type": "prerequisite",
        "why_it_matters": entry["reason"],
        "tasks": entry["tasks"],
        "checkpoint": entry["checkpoint"],
    }]


def _build_jd_roadmap_graph(improvements, rows, jd_context: dict | None = None) -> dict:
    from functions.talent_check.schemas import normalize_category

    jd_context = jd_context or {}
    jd_skills = jd_context.get("jd_skills") or {}
    jd_title = jd_context.get("jd_title") or "Target Role"

    unassessed = sorted(
        {row["category"] for row in rows if row["candidate_level"] is None}
    )

    # Determine which canonical categories are actually required by the uploaded JD
    jd_required_codes = set()
    if isinstance(jd_skills, dict):
        radix_categories = jd_skills.get("radix_categories") or {}
        technologies = jd_skills.get("technologies") or []
        for cat_key, items in radix_categories.items():
            code = normalize_category(cat_key)
            if code:
                jd_required_codes.add(code)
            if isinstance(items, list):
                for item in items:
                    item_code = normalize_category(str(item))
                    if item_code:
                        jd_required_codes.add(item_code)
        for tech in technologies:
            if isinstance(tech, str) and tech.strip():
                code = normalize_category(tech)
                if code:
                    jd_required_codes.add(code)

    # Filter improvements to only include confirmed gaps that are required by the JD
    # and deduplicate by canonical category code (Case E)
    seen_categories = set()
    unique_gaps = []

    for item in (improvements or []):
        cat_name = item.get("category", "")
        code = item.get("category_code") or normalize_category(cat_name) or "OTH"

        if code in seen_categories:
            continue

        # If JD specified required categories, exclude any skill not required by the JD
        if jd_required_codes and code not in jd_required_codes:
            continue

        # Exclude skills where candidate meets or exceeds requirement
        current = item.get("current_level")
        required = item.get("required_level")
        gap = item.get("gap")
        if current is not None and required is not None and current >= required:
            continue

        seen_categories.add(code)
        unique_gaps.append({
            "category": cat_name,
            "category_code": code,
            "current_level": current,
            "required_level": required,
            "gap": gap or (required - current if current is not None and required is not None else 1),
        })

    # Case B: Zero missing skills and zero unassessed JD skills -> display empty state, no generic roadmap
    # Extract unassessed skills that are required by the JD and not mentioned in the resume (candidate_level is None)
    unassessed_items = []
    seen_unassessed = set()
    for row in rows:
        current = row.get("candidate_level")
        if current is None:
            cat_name = row.get("category", "")
            code = row.get("category_code") or normalize_category(cat_name) or "OTH"
            if jd_required_codes and code not in jd_required_codes:
                continue
            if code in seen_categories or code in seen_unassessed:
                continue
            seen_unassessed.add(code)
            required = row.get("required_level") or 5
            unassessed_items.append({
                "category": cat_name,
                "category_code": code,
                "current_level": None,
                "required_level": required,
                "gap": required,
            })

    # Also include any JD-required categories that were never mentioned in candidate rows at all
    evaluated_codes = {
        row.get("category_code") or normalize_category(row.get("category", ""))
        for row in rows
    }
    for code in sorted(jd_required_codes):
        if code not in seen_categories and code not in seen_unassessed and code not in evaluated_codes:
            from functions.skill_categories import TALENT_CATEGORY_NAMES
            cat_name = TALENT_CATEGORY_NAMES.get(code, code)
            seen_unassessed.add(code)
            unassessed_items.append({
                "category": cat_name,
                "category_code": code,
                "current_level": None,
                "required_level": 5,
                "gap": 5,
            })

    if not unique_gaps and not unassessed_items:
        return {
            "target_role": jd_title,
            "total_gaps": 0,
            "unassessed_count": 0,
            "total_items": 0,
            "has_gaps": False,
            "summary": "No skill gaps identified against this job description.",
            "stages": [],
            "connections": [],
            "unassessed_skills": [],
        }

    # Group confirmed gaps and unassessed JD skills by broad tracks for parallel branching
    engineering_codes = {"COD", "SWE", "OOD", "DSA"}
    data_systems_codes = {"SQL", "SYSD", "CLOUD", "AI", "OS", "NETW"}
    diagnostic_codes = {"APTI", "COMM"}

    track_engineering = []
    track_data_systems = []
    track_diagnostic = []
    connections = []

    # 1. Confirmed Gap Nodes
    for item in unique_gaps:
        cat_name = item["category"]
        code = item["category_code"]
        current = item["current_level"]
        required = item["required_level"]
        gap = item["gap"]

        jd_terms = _jd_terms_for_category(code, cat_name, jd_skills)
        if jd_terms:
            focus_title = f"{cat_name} ({', '.join(jd_terms[:2])})"
            why_matters = f"Explicitly required in the uploaded JD ({', '.join(jd_terms[:3])}). Current level {current} vs required level {required} (gap of {gap} levels)."
        else:
            focus_title = cat_name
            why_matters = f"Required by role expectations at Level {required}; assessed at Level {current} (gap of {gap} levels)."

        gap_node = {
            "id": f"gap-{code.lower()}",
            "title": focus_title,
            "category": cat_name,
            "category_code": code,
            "node_type": "gap_skill",
            "current_level": current,
            "target_level": required,
            "gap": gap,
            "jd_terms": jd_terms,
            "why_it_matters": why_matters,
            "status": "gap",
        }

        if code in engineering_codes:
            track_engineering.append(gap_node)
        elif code in diagnostic_codes:
            track_diagnostic.append(gap_node)
        else:
            track_data_systems.append(gap_node)

    # 2. Unassessed JD Skills Nodes (Required by JD, not mentioned in resume)
    for item in unassessed_items:
        cat_name = item["category"]
        code = item["category_code"]
        required = item["required_level"]

        jd_terms = _jd_terms_for_category(code, cat_name, jd_skills)
        if jd_terms:
            focus_title = f"{cat_name} ({', '.join(jd_terms[:2])})"
            why_matters = f"Required in the uploaded JD ({', '.join(jd_terms[:3])}) but not mentioned in the resume. Learning roadmap provided for baseline mastery."
        else:
            focus_title = cat_name
            why_matters = f"Required by {jd_title} but not mentioned in the resume. Learning roadmap provided for baseline mastery."

        unassessed_node = {
            "id": f"unassessed-{code.lower()}",
            "title": focus_title,
            "category": cat_name,
            "category_code": code,
            "node_type": "unassessed_skill",
            "current_level": None,
            "target_level": required,
            "gap": required,
            "jd_terms": jd_terms,
            "why_it_matters": why_matters,
            "status": "unassessed",
        }

        if code in engineering_codes:
            track_engineering.append(unassessed_node)
        elif code in diagnostic_codes:
            track_diagnostic.append(unassessed_node)
        else:
            track_data_systems.append(unassessed_node)

    active_tracks = []
    for track_id, track_name, nodes in [
        ("track-engineering", "Engineering & Architecture Track", track_engineering),
        ("track-data-systems", "Data, Systems & Cloud Track", track_data_systems),
        ("track-diagnostic", "Analytical & Professional Track", track_diagnostic),
    ]:
        if nodes:
            active_tracks.append({
                "track_id": track_id,
                "track_name": track_name,
                "nodes": nodes,
            })
            for i in range(len(nodes) - 1):
                connections.append({"from": nodes[i]["id"], "to": nodes[i + 1]["id"], "type": "sequence"})

    total_roadmap_items = len(unique_gaps) + len(unassessed_items)
    stages = [
        {
            "id": "stage-gaps",
            "name": "Skill Gap & Requirement Roadmap",
            "description": f"Targeted learning path addressing {len(unique_gaps)} confirmed gaps and {len(unassessed_items)} unassessed requirements for {jd_title}.",
            "parallel": len(active_tracks) > 1,
            "tracks": active_tracks,
        }
    ]

    return {
        "target_role": jd_title,
        "total_gaps": len(unique_gaps),
        "unassessed_count": len(unassessed_items),
        "total_items": total_roadmap_items,
        "has_gaps": total_roadmap_items > 0,
        "summary": f"Personalized learning roadmap targeting {len(unique_gaps)} confirmed skill gaps and {len(unassessed_items)} unassessed skills for {jd_title}.",
        "stages": stages,
        "connections": connections,
        "unassessed_skills": [
            {"category": item["category"], "category_code": item["category_code"], "reason": "Required by JD but not mentioned in resume."}
            for item in unassessed_items
        ],
    }


def _fallback_roadmap(improvements, rows, jd_context: dict | None = None):
    """Build a sequential roadmap from confirmed gaps; no generic or diagnostic fallbacks."""
    from functions.talent_check.schemas import normalize_category

    jd_context = jd_context or {}
    jd_skills = jd_context.get("jd_skills") or {}
    jd_title = jd_context.get("jd_title") or "Target Role"

    # Determine which canonical categories are actually required by the uploaded JD
    jd_required_codes = set()
    if isinstance(jd_skills, dict):
        radix_categories = jd_skills.get("radix_categories") or {}
        technologies = jd_skills.get("technologies") or []
        for cat_key, items in radix_categories.items():
            code = normalize_category(cat_key)
            if code:
                jd_required_codes.add(code)
            if isinstance(items, list):
                for item in items:
                    item_code = normalize_category(str(item))
                    if item_code:
                        jd_required_codes.add(item_code)
        for tech in technologies:
            if isinstance(tech, str) and tech.strip():
                code = normalize_category(tech)
                if code:
                    jd_required_codes.add(code)

    roadmap = []
    seen = set()
    week_start = 1

    for item in (improvements or []):
        cat_name = item.get("category", "")
        code = item.get("category_code") or normalize_category(cat_name) or "OTH"

        if code in seen:
            continue

        if jd_required_codes and code not in jd_required_codes:
            continue

        current = item.get("current_level")
        required = item.get("required_level")
        gap = item.get("gap")
        if current is not None and required is not None and current >= required:
            continue

        seen.add(code)

        jd_terms = _jd_terms_for_category(code, cat_name, jd_skills)
        if jd_terms:
            focus_title = f"{cat_name} ({', '.join(jd_terms[:2])})"
        else:
            focus_title = cat_name

        _, default_tasks, default_milestone = _category_guidance(code)

        roadmap.append({
            "week": f"{week_start}-{week_start + 1}",
            "focus": focus_title,
            "tasks": default_tasks,
            "milestone": default_milestone,
            "category_code": code,
            "current_level": current,
            "target_level": required,
            "gap": gap or (required - current if current is not None and required is not None else 1),
            "jd_terms": jd_terms,
        })
        week_start += 2

    return roadmap[:MAX_ROADMAP_ITEMS]


def _fallback_projects(improvements, rows):
    """Recommend practical projects tied to confirmed gaps, not unknowns."""
    categories = []
    for item in improvements:
        if item["category"] not in categories:
            categories.append(item["category"])

    projects = []
    project_templates = {
        "networking": (
            "Network-Aware API Diagnostics",
            "Demonstrate networking knowledge by tracing requests and diagnosing failures.",
            [
                "Instrument request timing and status codes",
                "Document DNS/TLS/HTTP failure cases",
                "Add reproducible diagnostics and tests",
            ],
        ),
        "software engineering": (
            "Tested Backend Service",
            "Show software engineering practices through reliable, maintainable backend changes.",
            [
                "Add unit and integration tests",
                "Add structured logging and error handling",
                "Document setup and test commands",
            ],
        ),
        "system design": (
            "Scalable Service Design Case Study",
            "Demonstrate system design trade-offs using a working service.",
            [
                "Create an architecture diagram and design note",
                "Load-test a key endpoint",
                "Explain caching, bottlenecks, and failure handling",
            ],
        ),
        "communication": (
            "Technical Project Walkthrough",
            "Practise explaining a technical project clearly to different audiences.",
            [
                "Write a concise README",
                "Prepare a short architecture walkthrough",
                "Collect peer feedback and revise the explanation",
            ],
        ),
    }

    for category in categories:
        if len(projects) >= MAX_PROJECTS:
            break
        key = _text(category).lower()
        template = project_templates.get(key)
        if template is None:
            display, _, _ = _category_guidance(category)
            template = (
                f"{display} Practical Demonstration",
                f"Build verifiable evidence of the confirmed {display} gap.",
                [
                    "Create a working implementation or practical assessment",
                    "Add tests or measurable results",
                    "Document design decisions and lessons learned",
                ],
            )
        name, purpose, deliverables = template
        projects.append(
            {
                "name": name,
                "purpose": purpose,
                "deliverables": deliverables,
            }
        )

    return projects[:MAX_PROJECTS]


def _deterministic_details(assessment, summary, improvements, strengths, rows):
    companies = _company_assessments(assessment)
    ranked = []
    for company in companies:
        if not isinstance(company, dict):
            continue
        score = company.get("readiness_score")
        if _valid_number(score):
            ranked.append(
                (
                    _text(company.get("company"), "Unknown company"),
                    score,
                    company.get("coverage_percentage"),
                    company.get("assessed_categories"),
                    company.get("total_categories"),
                )
            )
    ranked.sort(key=lambda item: -item[1])

    if ranked:
        comparison = "; ".join(
            f"{name}: readiness {score:.2f}%"
            + (f", coverage {coverage:.2f}%" if _valid_number(coverage) else "")
            + (
                f" ({assessed}/{total} categories assessed)"
                if _valid_number(assessed) and _valid_number(total)
                else ""
            )
            for name, score, coverage, assessed, total in ranked
        )
    else:
        comparison = "No numeric readiness scores were available."

    if improvements:
        gap_details = "; ".join(
            f"{item['category']}: assessed level {item['current_level']} "
            f"versus configured requirement {item['required_level']} "
            f"for {item['company']} (gap {item['gap']})"
            for item in improvements
        )
    else:
        gap_details = (
            "No below-requirement gaps were found among the numeric assessed "
            "levels. This does not establish full readiness."
        )

    if strengths:
        strength_details = "; ".join(
            f"{item['category']}: {item['reason']}" for item in strengths
        )
    else:
        strength_details = (
            "No strengths could be established by comparing numeric assessed "
            "levels with configured requirements."
        )

    unassessed = sorted(
        {row["category"] for row in rows if row["candidate_level"] is None}
    )
    unassessed_details = (
        "Unassessed categories: "
        + ", ".join(unassessed)
        + ". Missing levels are unknown, not zero and not confirmed weaknesses."
        if unassessed
        else "No categories with null candidate levels were found in this assessment."
    )

    next_steps = (
        "Prioritize the confirmed below-requirement categories in the roadmap. "
        "Keep unassessed categories in a separate evidence-gathering track. "
        "Verify configured company requirements before interpreting them as "
        "real hiring criteria."
    )

    return [
        {"heading": "Comparative readiness", "details": comparison + ". " + summary},
        {"heading": "Confirmed skill gaps", "details": gap_details},
        {"heading": "Strengths and evidence", "details": strength_details},
        {"heading": "Unassessed categories", "details": unassessed_details},
        {"heading": "Practical next steps", "details": next_steps},
    ]


def generate_candidate_analysis(assessment: dict, jd_context: dict | None = None) -> dict:
    """
    Generate career recommendations while keeping scores, gaps, coverage,
    roadmap priorities, and detailed findings grounded in assessment data.

    Layer A (always deterministic): scores, gaps, coverage, improvement_areas.
    Layer B (AI-generated when available): ai_overview, learning_roadmap,
    recommended_projects, detailed_analysis, strengths narrative.
    """
    rows = _skill_rows(assessment)
    improvements = _deterministic_improvements(assessment)
    strengths = _deterministic_strengths(assessment)
    summary = _deterministic_summary(assessment)
    roadmap_graph = _build_jd_roadmap_graph(improvements, rows, jd_context)
    learning_roadmap = _fallback_roadmap(improvements, rows, jd_context)

    result = {
        "summary": summary,
        "strengths": strengths,
        "improvement_areas": improvements,  # always deterministic
        "learning_roadmap": learning_roadmap,
        "roadmap_graph": roadmap_graph,
        "recommended_projects": _fallback_projects(improvements, rows),
        "limitations": DEFAULT_LIMITATIONS.copy(),
        "detailed_analysis": _deterministic_details(
            assessment, summary, improvements, strengths, rows
        ),
        "graphs": _graph_data(assessment),
    }

    # Add only useful, data-backed caveats. Avoid free-form provider warnings,
    # which previously caused duplicate or contradictory limitation messages.
    unassessed_categories = sorted(
        {row["category"] for row in rows if row["candidate_level"] is None}
    )
    if unassessed_categories:
        result["limitations"].append(
            "Not assessed: " + ", ".join(unassessed_categories) + "."
        )

    medium_confidence = sorted(
        {
            row["category"]
            for row in rows
            if _text(row.get("confidence")).strip().lower() == "medium"
        }
    )
    if medium_confidence:
        result["limitations"].append(
            "Evidence confidence is medium for: " + ", ".join(medium_confidence) + "."
        )

    provider_errors = {}
    groq_overview = None  # ai_overview candidate from Groq
    gemini_used = False  # True when Gemini output is actually applied
    data = _assessment_json(assessment)

    groq_prompt = (
        "Return JSON with key ai_overview containing a concise string "
        "summarising the candidate overall readiness. Use only numeric, "
        "assessed levels. Do not treat unassessed (null) skills as gaps "
        "or weaknesses.\n\n"
        "Assessment:\n" + data
    )

    jd_desc = ""
    if jd_context:
        title = jd_context.get("jd_title") or ""
        jd_skills_dict = jd_context.get("jd_skills") or {}
        if title or jd_skills_dict:
            jd_desc = f"\nTarget Job Description:\nRole: {title}\nJD Skills: {json.dumps(jd_skills_dict, ensure_ascii=False)}\n"

    gemini_prompt = (
        "Return valid JSON with keys summary, strengths, learning_roadmap, "
        "recommended_projects, limitations, detailed_analysis. "
        "Focus the learning_roadmap strictly on the candidate's confirmed below-requirement skill gaps for this specific target role. "
        "Do not invent unrelated generic skills or technologies. "
        "Never treat null candidate "
        "levels as zero or as weaknesses. Never claim configured demo "
        "requirements are verified hiring criteria. Make any limitations "
        "specific and cautious. Use the required fields and correct types.\n\n"
        f"Assessment:\n{data}\n{jd_desc}"
    )

    try:
        groq_result = _request_groq(groq_prompt)
        if not isinstance(groq_result.get("ai_overview"), str):
            raise RuntimeError("Groq ai_overview must be a string.")
        groq_overview = groq_result["ai_overview"]
    except Exception as error:
        provider_errors["groq"] = f"{type(error).__name__}: {error}"

    try:
        generated = _request_gemini(gemini_prompt)

        required_lists = (
            "strengths",
            "learning_roadmap",
            "recommended_projects",
            "limitations",
            "detailed_analysis",
        )
        for key in required_lists:
            if not isinstance(generated.get(key), list):
                raise RuntimeError(f"Gemini {key} must be a list.")
        if not isinstance(generated.get("summary"), str):
            raise RuntimeError("Gemini summary must be a string.")

        # --- Layer B: use Gemini output for explanatory content ---
        # ai_overview: Gemini summary is the primary AI-generated overview.
        result["ai_overview"] = generated["summary"]

        # Strengths: replace with AI-generated narrative when valid.
        ai_strengths = _normalize_roadmap.__module__ and _as_list(
            generated.get("strengths")
        )
        if ai_strengths and all(isinstance(s, dict) for s in ai_strengths):
            result["strengths"] = (
                [
                    {
                        "category": _text(s.get("category"), "General"),
                        "reason": _text(s.get("reason"), ""),
                    }
                    for s in ai_strengths[:5]
                    if _text(s.get("reason"))
                ]
                or strengths
            )  # fall back to deterministic if AI list empty after filtering

        # Learning roadmap: replace with AI-generated roadmap when valid.
        ai_roadmap = _normalize_roadmap(generated.get("learning_roadmap", []))
        if ai_roadmap:
            result["learning_roadmap"] = ai_roadmap

        # Recommended projects: replace with AI-generated projects when valid.
        ai_projects = _normalize_projects(generated.get("recommended_projects", []))
        if ai_projects:
            result["recommended_projects"] = ai_projects

        # Detailed analysis: replace with AI-generated details when valid.
        ai_details = _normalize_details(generated.get("detailed_analysis", []))
        if ai_details:
            result["detailed_analysis"] = ai_details

        # Model-generated limitations intentionally not merged; they can
        # repeat or contradict the application-generated caveats.
        gemini_used = True

    except Exception as error:
        provider_errors["gemini"] = f"{type(error).__name__}: {error}"

    # Set ai_overview from best available source.
    if "ai_overview" not in result:
        if groq_overview is not None:
            result["ai_overview"] = groq_overview
        else:
            result["ai_overview"] = f"Deterministic overview: {summary}"

    if provider_errors:
        result["limitations"].append(
            "One or more AI providers failed; deterministic assessment results remain available."
        )

    # Final safety net: trim whitespace and remove duplicate caveats
    # case-insensitively while preserving their original order.
    clean_limitations = []
    seen_limitations = set()
    for limitation in result["limitations"]:
        if not isinstance(limitation, str):
            continue
        limitation = " ".join(limitation.split())
        key = limitation.casefold()
        if limitation and key not in seen_limitations:
            seen_limitations.add(key)
            clean_limitations.append(limitation)
    result["limitations"] = clean_limitations

    result["provider_errors"] = provider_errors

    # Determine ai_status and analysis_mode based on what was actually used.
    if gemini_used:
        result["ai_status"] = "complete"
        result["analysis_mode"] = "deterministic_assessment_with_ai_explanations"
    elif groq_overview is not None:
        result["ai_status"] = "partial"
        result["analysis_mode"] = "deterministic_assessment_with_ai_explanations"
    elif provider_errors:
        # At least one provider was configured but all failed.
        result["ai_status"] = "fallback"
        result["analysis_mode"] = "deterministic_assessment_with_deterministic_fallback"
    else:
        # No errors means no providers were configured at all.
        result["ai_status"] = "unavailable"
        result["analysis_mode"] = "deterministic_assessment_with_deterministic_fallback"

    return result
