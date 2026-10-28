import os
from pathlib import Path
import dotenv

# Load .env from backend directory or parent directories if present
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    dotenv.load_dotenv(_env_path)
else:
    dotenv.load_dotenv()

# Ensure GEMINI_API_KEY is mirrored from GOOGLE_API_KEY if needed by langchain
google_key = (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()
if google_key and not os.getenv("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = google_key

from langchain_openrouter.chat_models import ChatOpenRouter
from langchain.chat_models import init_chat_model

# 1. Initialize OpenRouter model safely
openrouter_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
try:
    model = ChatOpenRouter(
        model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key or "sk-placeholder",
    )
except Exception:
    model = None

# 2. Initialize Gemini model safely
model_genai = None
if google_key:
    try:
        model_genai = init_chat_model(
            model=os.getenv("GOOGLE_MODEL", "gemini-3.1-flash-lite"),
            model_provider="google_genai",
            api_key=google_key,
        )
    except Exception:
        model_genai = None

# If Gemini is not configured or fails to initialize, fall back to OpenRouter
if model_genai is None and model is not None:
    model_genai = model
