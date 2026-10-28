import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Literal
from pydantic import BaseModel, Field
from functions.skill_categories import PROFILE_SKILL_CODES, SkillCode, SkillName
from functions.models import model, model_genai
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

MODEL_EXECUTOR = ThreadPoolExecutor(
    max_workers=4,
    thread_name_prefix="model-call",
)

# Google API server-side errors that warrant a fallback to OpenRouter.
_GOOGLE_TRANSIENT_CODES = {429, 500, 502, 503, 504}


def _is_google_transient_error(exc: BaseException) -> bool:
    """Return True when the exception is a retryable Google API server error."""
    class_name = type(exc).__name__
    # langchain_google_genai wraps the raw error in GoogleAPIError
    if "GoogleAPIError" in class_name or "ServerError" in class_name:
        msg = str(exc)
        return any(str(code) in msg for code in _GOOGLE_TRANSIENT_CODES)
    return False


def _run_pipeline(llm, parsed_prompt, pydantic_model, data_dump):
    """Build and invoke a structured-output pipeline synchronously."""
    pipeline = parsed_prompt | llm.with_structured_output(pydantic_model)
    return pipeline.invoke({"data": data_dump})


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
    parsed_prompt = ChatPromptTemplate.from_template(prompt)
    loop = asyncio.get_running_loop()

    # ── Primary: Google Gemini ────────────────────────────────────────────────
    try:
        invocation = loop.run_in_executor(
            MODEL_EXECUTOR,
            partial(_run_pipeline, model_genai, parsed_prompt, pydantic_model, data_dump),
        )
        data = await asyncio.wait_for(invocation, timeout=90)
    except Exception as primary_exc:
        if not _is_google_transient_error(primary_exc):
            # Non-transient error (bad API key, malformed prompt, …) — re-raise immediately.
            raise

        # ── Fallback: OpenRouter ──────────────────────────────────────────────
        logger.warning(
            "Google Gemini unavailable (%s). Falling back to OpenRouter.",
            primary_exc,
        )
        try:
            fallback_invocation = loop.run_in_executor(
                MODEL_EXECUTOR,
                partial(_run_pipeline, model, parsed_prompt, pydantic_model, data_dump),
            )
            data = await asyncio.wait_for(fallback_invocation, timeout=120)
        except Exception as fallback_exc:
            # Both providers failed — surface a clear combined error.
            raise RuntimeError(
                f"Both AI providers failed. "
                f"Primary (Gemini): {primary_exc}. "
                f"Fallback (OpenRouter): {fallback_exc}"
            ) from fallback_exc

    parsed_model = pydantic_model.model_validate(data)
    if isinstance(parsed_model, ProfileResponseModel):
        return map_skill_metadata(parsed_model)
    return parsed_model
