import io

import docx
from fastapi import HTTPException
from pypdf import PdfReader


def parse_document(file_content: bytes, filename: str) -> str:
    """Extracts raw text from PDF or DOCX files[cite: 1]."""
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_content))
        return " ".join(
            [page.extract_text() for page in reader.pages if page.extract_text()]
        )
    elif filename.lower().endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_content))
        return " ".join([para.text for para in doc.paragraphs])
    elif filename.lower().endswith((".txt", ".md")):
        return file_content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(
            status_code=400, detail="Only PDF, DOCX, and TXT files are supported."
        )
