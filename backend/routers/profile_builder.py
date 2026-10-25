from fastapi import APIRouter, File, HTTPException, UploadFile

from files.prompts import profile_extraction_prompt
from functions.profile_builder import extract_data, parse_document
from functions.profile_builder import ProfileResponseModel

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
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty files are not allowed")

        parsed_text = parse_document(content, file.filename)
        if not parsed_text.strip():
            raise HTTPException(status_code=400, detail="Text could not be parsed")

        profile = await extract_data(
            data_dump=parsed_text,
            prompt=profile_extraction_prompt,
            pydantic_model=ProfileResponseModel,
        )
        return profile
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to build profile.",
            )
