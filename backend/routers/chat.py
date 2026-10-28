from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from functions.models import model_genai, model

logger = logging.getLogger("radix.chat")

chat_router = APIRouter(tags=["chat"])

RADIX_ASSISTANT_SYSTEM_PROMPT = """You are the RADIX Talent Match Assistant, an intelligent career and technical advisor built into the RADIX Talent Match platform.

Your mission is to assist candidates and recruiters in evaluating technical qualifications, skill alignments, and learning paths.

Key Domain Knowledge:
1. RADIX evaluates candidates across 12 canonical technical categories:
   - COD: Coding & Programming (Python, JavaScript, syntax, clean code)
   - DSA: Data Structures & Algorithms (trees, graphs, complexity analysis)
   - OOD: Object-Oriented Design (SOLID principles, design patterns)
   - APTI: Aptitude & Problem Solving (logical deduction, quantitative reasoning)
   - COMM: Communication Skills (technical writing, stakeholder clarity)
   - AI: AI Native Engineering (LLMs, generative AI, machine learning APIs)
   - CLOUD: Cloud Computing (AWS, GCP, Azure, Docker, microservices)
   - SQL: Relational Databases & SQL (schema design, query optimization, ACID)
   - SWE: Software Engineering (testing, Git workflows, CI/CD automation)
   - SYSD: System Design & Architecture (distributed systems, scalability, caching)
   - NETW: Networking Protocols (TCP/IP, HTTP/HTTPS, REST, gRPC)
   - OS: Operating Systems (processes, threads, concurrency, memory management)

2. Skill Evaluation Distinctions:
   - Confirmed Skill Gap: The skill is required by the job description, candidate has evidence in resume, but assessed proficiency is below the required level (Level < Target).
   - Unassessed Skill: The skill is required by the job description, but the candidate has no evidence in their resume (Not in Resume).
   - Matched Skill: The candidate possesses the skill at or above the level required by the role.

3. Guidance:
   - Provide concise, practical, and constructive advice.
   - When asked about preparation or gaps, refer to the 12 canonical skill learning roadmaps and PDFs available in RADIX.
   - Format technical suggestions using clean markdown (bullet points, bold highlights, code formatting where appropriate).
   - Keep answers professional, empathetic, and encouraging.
"""

class ChatHistoryItem(BaseModel):
    role: str = Field(description="Role: 'user' or 'assistant'")
    text: str = Field(description="Message content")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's query")
    history: list[ChatHistoryItem] = Field(default_factory=list, description="Recent conversation history")
    context: dict | None = Field(default=None, description="Optional candidate profile or JD context")

class ChatResponse(BaseModel):
    reply: str


@chat_router.post("/chat", response_model=ChatResponse)
@chat_router.post("/chat/", response_model=ChatResponse)
@chat_router.post("/api/chat", response_model=ChatResponse)
@chat_router.post("/api/chat/", response_model=ChatResponse)
async def chat_with_agent(payload: ChatRequest):
    user_query = payload.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Build LangChain message history
    messages = [SystemMessage(content=RADIX_ASSISTANT_SYSTEM_PROMPT)]

    # Include recent conversation turns (up to last 10 messages for context)
    for item in payload.history[-10:]:
        role = item.role.lower()
        if role == "user":
            messages.append(HumanMessage(content=item.text))
        elif role in ("assistant", "bot"):
            messages.append(AIMessage(content=item.text))

    messages.append(HumanMessage(content=user_query))

    # 1. Primary Attempt: Google Gemini (model_genai)
    try:
        response = model_genai.invoke(messages)
        reply_content = response.content
        if isinstance(reply_content, list):
            reply_text = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in reply_content)
        else:
            reply_text = str(reply_content)
        return ChatResponse(reply=reply_text.strip())
    except Exception as primary_exc:
        logger.warning("Primary LLM (Gemini) failed for chat: %s. Trying OpenRouter fallback.", primary_exc)

    # 2. Secondary Attempt: OpenRouter (model)
    try:
        response = model.invoke(messages)
        reply_content = response.content
        if isinstance(reply_content, list):
            reply_text = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in reply_content)
        else:
            reply_text = str(reply_content)
        return ChatResponse(reply=reply_text.strip())
    except Exception as fallback_exc:
        logger.error("Both Gemini and OpenRouter failed for chat: %s", fallback_exc)

    # 3. Contextual Rule-Based Fallback
    lower_query = user_query.lower()
    if "roadmap" in lower_query or "gap" in lower_query:
        fallback_reply = (
            "RADIX generates candidate- and JD-specific skill-gap roadmaps based on verified differences "
            "between your resume evidence and the target job description requirements. You can click on any "
            "skill node in the roadmap to view its detailed PDF curriculum and practice checkpoints."
        )
    elif "unassessed" in lower_query or "not assessed" in lower_query or "missing" in lower_query:
        fallback_reply = (
            "Unassessed skills are requirements explicitly listed in the target Job Description for which no direct "
            "supporting evidence was detected in your uploaded resume. RADIX displays these in the roadmap section "
            "so you can study the baseline concepts using their dedicated learning roadmap."
        )
    elif "score" in lower_query or "match" in lower_query:
        fallback_reply = (
            "Your overall readiness score is calculated by comparing your proficiency in each required category "
            "against the target company's benchmark levels. Categories where you meet or exceed requirements add to "
            "your readiness, while gaps outline areas for targeted interview preparation."
        )
    else:
        fallback_reply = (
            "I'm here to help you navigate your RADIX skill match results, resume evaluation, and roadmap learning paths. "
            "Feel free to ask about specific skill categories (like SQL, Cloud, System Design, or Algorithms) or how to address gaps."
        )

    return ChatResponse(reply=fallback_reply)
