from typing import Literal

from pydantic import BaseModel, Field
from functions.models import model, model_genai
from langchain_core.prompts import ChatPromptTemplate

SkillCode = Literal[
    "COD",
    "DSA",
    "OOD",
    "APT",
    "COM",
    "AI",
    "CLD",
    "SQL",
    "SWE",
    "SYS",
    "NET",
    "OS",
    "OTH",
]

SKILL_CODES: dict[str, SkillCode] = {
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


class Skill(BaseModel):
    skill_name: Literal[
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
    skill_code: SkillCode
    skill_level: int = Field(ge=1, le=10)
    evidence: list[str]
    confidence: Literal["High", "Medium", "Low"]


class Education(BaseModel):
    degree: str
    college: str
    graducation_year: str
    cgpa: float = Field(gt=1, le=10)


class ProfileResponseModel(BaseModel):
    name: str
    email: str
    education: Education
    skills: list[Skill]
    hackathons: list[str]
    internships: list[str]
    certifications: list[str]
    preferred_roles: list[str]
    cv_file: str


def map_skill_metadata(profile: ProfileResponseModel) -> ProfileResponseModel:
    for skill in profile.skills:
        skill.skill_code = SKILL_CODES[skill.skill_name]
    return profile


async def extract_data[T: BaseModel](
    data_dump: str, prompt: str, pydantic_model: type[T]
) -> T:
    structured_model = model_genai.with_structured_output(pydantic_model)
    parsed_prompt = ChatPromptTemplate.from_template(prompt)
    pipeline = parsed_prompt | structured_model
    data = pipeline.invoke({"data": data_dump})
    parsed_model = pydantic_model.model_validate(data)
    if isinstance(parsed_model, ProfileResponseModel):
        return map_skill_metadata(parsed_model)
    return parsed_model
