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
