import dotenv

dotenv.load_dotenv()

from routers.jd_analytics import jd_analytics_router
from fastapi import FastAPI
from routers.profile_builder import profile_builder_router
from routers.skills_matching import skill_matching_router

app = FastAPI()
app.include_router(profile_builder_router)
app.include_router(jd_analytics_router)
app.include_router(skill_matching_router)


@app.get("/")
def read_root():
    return {"status": "success", "Running": True}
