import dotenv

dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.jd_analytics import jd_analytics_router
from routers.profile_builder import profile_builder_router
from routers.talent_check import talent_check_router


app = FastAPI(title="Alohomora Talent Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_builder_router)
app.include_router(jd_analytics_router)
app.include_router(talent_check_router)


@app.get("/")
def read_root():
    return {"status": "success", "Running": True}
