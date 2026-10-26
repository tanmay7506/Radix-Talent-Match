from langchain_openrouter.chat_models import ChatOpenRouter
from langchain.chat_models import init_chat_model

import os

model_genai = init_chat_model(
    model="gemini-3.1-flash-lite", model_provider="google_genai"
)

model = ChatOpenRouter(
    model="nvidia/nemotron-3-ultra-550b-a55b:free",
    base_url="https://openrouter.ai/api/v1",
)
