from typing import Literal

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

from functions.models import model


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
    evidence: str
    confidence: Literal["High", "Medium", "Low"]


class ProfileResponseModel(BaseModel):
    name: str
    email: str
    education: str
    skills: list[Skill]
    hackathons: list[str]
    internships: list[str]
    certifications: list[str]
    preferred_roles: list[str]
    cv_file: str


# Usage Example


def parse_pdf(path: str) -> str:
    loader = PyPDFLoader(path)
    pdf = loader.load()
    return pdf[0].page_content


def extract_Data(data_dump: str) -> BaseModel:
    structured_model = model.with_structured_output(ProfileResponseModel)
    prompt = ChatPromptTemplate.from_template("""
    Extract the user's professional profile from the following data.

    Preserve names, email addresses, capitalization, and technical terms.
    Do not invent information that is not present in the source.
    Assign a confidence level to each skill based on the evidence.

    Source data:
    {data}
    """)

    pipeline = prompt | structured_model
    data = ProfileResponseModel.parse_obj(pipeline.invoke({"data": data_dump}))
    return data


if __name__ == "__main__":
    print(
        extract_Data(
            parse_pdf(
                "/home/sarthak/dev/Radix-Talent-Match/backend/files/Resumes/PDF/Ananya Rao.pdf"
            )
        )
    )
