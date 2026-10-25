import dotenv

dotenv.load_dotenv()

from fastapi import FastAPI
from routers.profile_builder import profile_builder_router


app = FastAPI()
app.include_router(profile_builder_router)


@app.get("/")
def read_root():
    return {"status": "success", "Running": True}
