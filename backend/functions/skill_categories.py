from typing import Literal


SkillCode = Literal[
    "COD", "DSA", "OOD", "APT", "COM", "AI", "CLD", "SQL", "SWE", "SYS", "NET", "OS", "OTH"
]

SkillName = Literal[
    "Coding",
    "Data Structures & Algorithms",
    "Object-Oriented Design",
    "Aptitude",
    "Communication",
    "Artificial Intelligence",
    "Cloud",
    "SQL",
    "Software Engineering",
    "System Design",
    "Networking",
    "Operating Systems",
    "Outside These Category",
]

PROFILE_SKILL_CODES: dict[str, SkillCode] = {
    "Coding": "COD",
    "Data Structures & Algorithms": "DSA",
    "Object-Oriented Design": "OOD",
    "Aptitude": "APT",
    "Communication": "COM",
    "Artificial Intelligence": "AI",
    "Cloud": "CLD",
    "SQL": "SQL",
    "Software Engineering": "SWE",
    "System Design": "SYS",
    "Networking": "NET",
    "Operating Systems": "OS",
    "Outside These Category": "OTH",
    # Profile extraction prompt labels — the LLM is instructed to use these exact strings
    # in the SKILL SETS section of profile_extraction_prompt. Without these mappings,
    # map_skill_metadata() cannot assign the correct skill_code and the candidate's skills
    # remain tagged 'OTH', which prevents the talent-check scoring from reading them.
    "Data Structures and Algorithms": "DSA",
    "Aptitude and Problem Solving": "APT",
    "Communication Skills": "COM",
    "Object-Oriented Programming and Design": "OOD",
    "AI Native Engineering": "AI",
    "SQL and Design": "SQL",
    "System Design and Architecture": "SYS",
    "DevOps and Cloud": "CLD",
    "Computer Networking": "NET",
    "Operating System": "OS",
}

TALENT_CATEGORIES = (
    "COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
)

TALENT_CATEGORY_NAMES = {
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

# Role 3/profile category names and common individual skills mapped to Role 4 codes.
TALENT_CATEGORY_ALIASES = {
    "coding": "COD",
    "programming": "COD",
    "data structures & algorithms": "DSA",
    "data structures and algorithms": "DSA",
    "dsa": "DSA",
    "object-oriented design": "OOD",
    "object oriented design": "OOD",
    # Aliases for the profile extraction prompt's skill labels (prompt uses these exact
    # strings as category names; without these aliases the LLM output from JD extraction
    # that mirrors those labels would map to OTH and be silently dropped).
    "object oriented programming and design": "OOD",
    "object-oriented programming and design": "OOD",
    "object oriented programming": "OOD",
    "aptitude": "APTI",
    "aptitude and problem solving": "APTI",
    "quantitative aptitude": "APTI",
    "communication": "COMM",
    "communication skills": "COMM",
    "artificial intelligence": "AI",
    # CLOUD canonical display name and common variants used by the JD extractor LLM.
    "cloud computing": "CLOUD",
    "cloud": "CLOUD",
    "devops and cloud": "CLOUD",
    "cloud and devops": "CLOUD",
    "cloud native": "CLOUD",
    # AI variants used by the JD extractor and profile extraction LLM.
    "ai native engineering": "AI",
    "ai engineering": "AI",
    # SQL variants used by the profile extraction prompt.
    "sql and design": "SQL",
    "sql": "SQL",
    "software engineering": "SWE",
    "system design": "SYSD",
    # System design variants used by the profile extraction prompt.
    "system design and architecture": "SYSD",
    "systems architecture": "SYSD",
    "systems design": "SYSD",
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
    "oth": "OTHER",
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
    "postgresql": "SQL",
    "mysql": "SQL",
    "sqlite": "SQL",
    "aws": "CLOUD",
    "amazon web services": "CLOUD",
    "azure": "CLOUD",
    "google cloud": "CLOUD",
    "gcp": "CLOUD",
    "operating system": "OS",
    "computer networks": "NETW",
    "computer networking": "NETW",
    "software development": "SWE",
    "machine learning": "AI",
}

# Categories returned by the JD extractor use the profile builder's codes.
PROFILE_CATEGORY_ALIASES = {
    " ".join(name.lower().replace("&", "and").replace("-", " ").split()): code
    for name, code in PROFILE_SKILL_CODES.items()
}
