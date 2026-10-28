import os
from pathlib import Path
import dotenv

_backend_env = Path(__file__).resolve().parent / ".env"
if _backend_env.exists():
    dotenv.load_dotenv(_backend_env)
else:
    dotenv.load_dotenv()

from routers.jd_analytics import jd_analytics_router
from fastapi import FastAPI, APIRouter
from routers.profile_builder import profile_builder_router
from routers.skills_matching import skill_matching_router
from fastapi.middleware.cors import CORSMiddleware
from routers.talent_check import talent_check_router
from routers.db.company_matching import router as company_matching_router
from routers.chat import chat_router

app = FastAPI(title="RADIX Talent Match API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level endpoints
app.include_router(profile_builder_router)
app.include_router(jd_analytics_router)
app.include_router(skill_matching_router)
app.include_router(talent_check_router)
app.include_router(company_matching_router)
app.include_router(chat_router)

# /api prefixed endpoints (for Vercel rewrites and reverse proxy deployments)
api_router = APIRouter(prefix="/api")
api_router.include_router(profile_builder_router)
api_router.include_router(jd_analytics_router)
api_router.include_router(skill_matching_router)
api_router.include_router(talent_check_router)
api_router.include_router(company_matching_router)
api_router.include_router(chat_router)
app.include_router(api_router)


@app.get("/")
@app.get("/api")
@app.get("/api/")
def read_root():
    return {"status": "success", "Running": True}
