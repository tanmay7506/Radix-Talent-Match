from fastapi import APIRouter, File, HTTPException, UploadFile
import asyncio
import hashlib

from functions.prompts import profile_extraction_prompt
from utils.extract_data import extract_data
from utils.extract_data import ProfileResponseModel
from utils.parse_document import parse_document
from utils.response_cache import get_cached, set_cached


profile_builder_router = APIRouter(
    prefix="/profile", tags=["profile", "profile-builder"]
)


@profile_builder_router.get("/")
def home():
    return {"status": "success", "running": True}


@profile_builder_router.post("/build/from-resume", response_model=ProfileResponseModel)
async def build_profile_from_resume(
    file: UploadFile = File(...),
) -> ProfileResponseModel:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty files are not allowed")

    cache_inputs = {
        "filename": file.filename,
        "content_sha256": hashlib.sha256(content).hexdigest(),
    }
    cached = await asyncio.to_thread(get_cached, "profile-from-resume", cache_inputs)
    if cached is not None:
        return ProfileResponseModel.model_validate(cached)

    parsed_text = parse_document(content, file.filename)
    if not parsed_text.strip():
        raise HTTPException(status_code=400, detail="Text could not be parsed")

    result = await extract_data(
        data_dump=parsed_text,
        prompt=profile_extraction_prompt,
        pydantic_model=ProfileResponseModel,
    )
    await asyncio.to_thread(set_cached, "profile-from-resume", cache_inputs, result)
    return result
