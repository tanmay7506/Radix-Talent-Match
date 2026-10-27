import dotenv

dotenv.load_dotenv()

from routers.jd_analytics import jd_analytics_router
from fastapi import FastAPI
from routers.profile_builder import profile_builder_router
from routers.skills_matching import skill_matching_router
from fastapi.middleware.cors import CORSMiddleware
from routers.talent_check import talent_check_router
from routers.db.company_matching import router as company_matching_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_builder_router)
app.include_router(jd_analytics_router)
app.include_router(skill_matching_router)
app.include_router(talent_check_router)
app.include_router(company_matching_router)


@app.get("/")
def read_root():
    return {"status": "success", "Running": True}
