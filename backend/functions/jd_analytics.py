from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
import io
import docx
from pypdf import PdfReader
from langchain_core.prompts import ChatPromptTemplate
from functions.models import model

app = FastAPI(title="JD Analytics API")

# Define the structured output format requested by the LLM extraction[cite: 1]
class SkillExtractionOutput(BaseModel):
    radix_categories: Dict[str, List[str]] = Field(
        description="A dictionary mapping the 12 RADIX skill categories to the specific skills found in the JD."
    )
    technologies: List[str] = Field(
        description="A list of specifically named tools, software, frameworks, or technologies."
    )

def parse_document(file_content: bytes, filename: str) -> str:
    """Extracts raw text from PDF or DOCX files[cite: 1]."""
    if filename.lower().endswith('.pdf'):
        reader = PdfReader(io.BytesIO(file_content))
        return " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif filename.lower().endswith('.docx'):
        doc = docx.Document(io.BytesIO(file_content))
        return " ".join([para.text for para in doc.paragraphs])
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

@app.post("/api/v1/extract-skills", response_model=SkillExtractionOutput)
async def extract_skills(file: UploadFile = File(...)):
    # Read the uploaded file 
    content = await file.read()
    jd_text = parse_document(content, file.filename)
    
    # Initialize the LLM (Requires OPENAI_API_KEY in your environment)
    structured_model = model.with_structured_output(SkillExtractionOutput)
    
    # Construct prompt ensuring it targets specific sections and the 12 RADIX categories[cite: 1]
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are an expert technical recruiter. Analyze the provided Job Description (JD). "
         "Extract a structured list of skills and technologies. "
         "Map the requirements onto the 12 RADIX skill categories plus any named technologies[cite: 1]. "
         "Because this is written in natural prose, rely on semantic understanding rather than plain keyword-matching[cite: 1]. "
         "The skill signal is heavily concentrated in sections like 'Key Responsibilities' and 'What We're Looking For' — start your analysis there[cite: 1]."),
        ("user", "{jd_text}")
    ])
    
    chain = prompt | structured_model
    
    try:
        # Pass the extracted text to the LLM
        result = chain.invoke({"jd_text": jd_text})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {str(e)}")
