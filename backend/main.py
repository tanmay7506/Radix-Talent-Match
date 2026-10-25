import dotenv
from fastapi import FastAPI

dotenv.load_dotenv()
from functions.profile_builder import extract_Data, parse_pdf

app = FastAPI()


@app.get("/")
def read_root():
    data = extract_Data(
        parse_pdf(
            "/home/sarthak/dev/Radix-Talent-Match/backend/files/Resumes/PDF/Ananya Rao.pdf"
        )
    )
    return {"status": "success", "Parsed": data.model_dump()}
