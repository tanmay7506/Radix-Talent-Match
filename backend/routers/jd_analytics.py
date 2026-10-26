from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from functions.prompts import jd_extraction_prompt
from utils.extract_data import extract_data
from utils.parse_document import parse_document


jd_analytics_router = APIRouter(prefix="/jd")


class SkillExtractionOutput(BaseModel):
    radix_categories: dict[str, list[str]] = Field(
        description="A dictionary mapping the 12 RADIX skill categories to the specific skills found in the JD."
    )
    technologies: list[str] = Field(
        description="A list of specifically named tools, software, frameworks, or technologies."
    )


@jd_analytics_router.post("/extract-skills", response_model=SkillExtractionOutput)
async def extract_skills(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Empty files are not allowed")
    jd_text = parse_document(content, file.filename)
    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Text could not be parsed")

    return await extract_data(
        data_dump=jd_text,
        prompt=jd_extraction_prompt,
        pydantic_model=SkillExtractionOutput,
    )
