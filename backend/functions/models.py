from langchain_openrouter.chat_models import ChatOpenRouter
from langchain.chat_models import init_chat_model

import os

model_genai = init_chat_model(
    model="gemini-3.1-flash-lite", model_provider="google_genai"
)

model = ChatOpenRouter(
    model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
    base_url="https://openrouter.ai/api/v1",
)
