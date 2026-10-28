import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Literal
from pydantic import BaseModel, Field
from functions.skill_categories import PROFILE_SKILL_CODES, SkillCode, SkillName
from functions.models import model, model_genai
from langchain_core.prompts import ChatPromptTemplate

MODEL_EXECUTOR = ThreadPoolExecutor(
    max_workers=4,
    thread_name_prefix="model-call",
)


class Skill(BaseModel):
    # Resume extraction emits the 12 category labels, while the manual-profile
    # UI can contain a named technology such as Python. Keep both valid at the
    # API boundary; matching still requires explicit evidence.
    skill_name: str
    skill_code: SkillCode = "OTH"
    skill_level: int = Field(default=1, ge=1, le=10)
    evidence: list[str] = Field(default_factory=list)
    confidence: Literal["High", "Medium", "Low"] = "Medium"


class Education(BaseModel):
    degree: str = ""
    college: str = ""
    graducation_year: str = ""
    cgpa: float | None = Field(default=None, gt=1, le=10)


class ProfileResponseModel(BaseModel):
    name: str
    email: str
    education: Education = Field(default_factory=Education)
    skills: list[Skill] = Field(default_factory=list)
    hackathons: list[str] = Field(default_factory=list)
    internships: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    preferred_roles: list[str] = Field(default_factory=list)
    cv_file: str = ""


def map_skill_metadata(profile: ProfileResponseModel) -> ProfileResponseModel:
    for skill in profile.skills:
        skill.skill_code = PROFILE_SKILL_CODES.get(skill.skill_name, skill.skill_code)
    return profile


async def extract_data[T: BaseModel](
    data_dump: str, prompt: str, pydantic_model: type[T]
) -> T:
    structured_model = model_genai.with_structured_output(pydantic_model)
    parsed_prompt = ChatPromptTemplate.from_template(prompt)
    pipeline = parsed_prompt | structured_model
    loop = asyncio.get_running_loop()
    invocation = loop.run_in_executor(
        MODEL_EXECUTOR,
        partial(pipeline.invoke, {"data": data_dump}),
    )
    data = await asyncio.wait_for(
        invocation,
        timeout=90,
    )
    parsed_model = pydantic_model.model_validate(data)
    if isinstance(parsed_model, ProfileResponseModel):
        return map_skill_metadata(parsed_model)
    return parsed_model
