from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.mongodb import (
    cases_collection,
    evidence_collection,
    analysis_collection,
    text_tracker_collection,
    copilot_chats_collection
)
import os
import uuid
from datetime import datetime, timezone
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter(
    prefix="/copilot",
    tags=["Copilot"]
)


class QuestionRequest(BaseModel):
    question: str
    session_id: str | None = None


def _build_case_context(case_id: str) -> str:
    """Build rich forensic context string from MongoDB for the given case."""
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        return ""

    evidence_list = list(evidence_collection.find({"case_id": case_id}, {"_id": 0}))

    context = f"=== CASE DOSSIER ===\n"
    context += f"Title: {case.get('title')}\n"
    context += f"Description: {case.get('description', 'N/A')}\n"
    context += f"Status: {case.get('status', 'Active')}\n"
    context += f"Created: {case.get('created_at', 'Unknown')}\n\n"
    context += f"=== EVIDENCE INVENTORY ({len(evidence_list)} items) ===\n"

    for ev in evidence_list:
        ev_id = ev.get("evidence_id")
        context += f"\n[Evidence] {ev.get('evidence_name')} | Type: {ev.get('evidence_type')} | SHA256: {ev.get('file_hash', 'N/A')}\n"

        # AI Analysis result
        analysis = analysis_collection.find_one({"evidence_id": ev_id}, {"_id": 0})
        if analysis:
            anlz = analysis.get("analysis", {})
            risk = analysis.get("risk_level", anlz.get("risk_level", "Unknown"))
            score = analysis.get("risk_score", anlz.get("risk_score", 0))
            summary = anlz.get("nlp", {}).get("summary") or anlz.get("executive_summary", "")
            ml_cat = anlz.get("ml", {}).get("predicted_category", "N/A")
            ml_conf = anlz.get("ml", {}).get("confidence", 0)
            ela_tampered = anlz.get("deepfake", {}).get("is_tampered", False)
            context += f"  ► AI Risk: {risk} (Score: {score}/100)\n"
            context += f"  ► ML Category: {ml_cat} ({ml_conf}% confidence)\n"
            if ela_tampered:
                context += f"  ► ⚠ Image Tampering Detected (ELA)\n"
            if summary:
                context += f"  ► Summary: {summary[:300]}\n"

        # Text Tracker result
        tracker = text_tracker_collection.find_one({"evidence_id": ev_id}, {"_id": 0})
        if tracker:
            ind_count = len(tracker.get("indicators", []))
            context += f"  ► Text Tracker: {tracker.get('total_lines', 0)} lines scanned, {ind_count} indicators found.\n"
            top_inds = tracker.get("indicators", [])[:5]
            for ind in top_inds:
                context += f"      - [{ind.get('severity', 'LOW')}] {ind.get('type', 'Keyword')}: {ind.get('value', '')} — {ind.get('reason', '')}\n"

    return context


@router.post("/{case_id}/ask")
def ask_copilot(case_id: str, payload: QuestionRequest):
    """Ask a question to the AI Forensic Copilot with persistent session history."""

    # Verify case exists
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Session management
    session_id = payload.session_id or str(uuid.uuid4())

    # Load existing session history from MongoDB
    session_doc = copilot_chats_collection.find_one(
        {"session_id": session_id, "case_id": case_id},
        {"_id": 0}
    )

    chat_history = session_doc.get("messages", []) if session_doc else []

    # Build case context (only once per session or first message)
    context = _build_case_context(case_id)

    # Build messages array for LLM
    system_prompt = f"""You are an expert AI Forensic Copilot assisting a digital forensics investigator.
You have access to the complete case dossier, evidence analysis results, ML threat classifications, and Text Tracker findings.

Use ONLY the provided case context to answer questions. Do not invent evidence or facts.
Be concise, professional, and forensically precise. Use bullet points for lists.

=== LIVE CASE CONTEXT ===
{context}
"""

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 turns max to stay within token limits)
    for msg in chat_history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add new user question
    messages.append({"role": "user", "content": payload.question})

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages,
            temperature=0.3,
            max_tokens=1200
        )
        answer = response.choices[0].message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Persist conversation turn to MongoDB
    now_iso = datetime.now(timezone.utc).isoformat()
    new_turns = [
        {"role": "user", "content": payload.question, "timestamp": now_iso},
        {"role": "assistant", "content": answer, "timestamp": now_iso},
    ]

    if session_doc:
        # Append to existing session
        copilot_chats_collection.update_one(
            {"session_id": session_id, "case_id": case_id},
            {
                "$push": {"messages": {"$each": new_turns}},
                "$set": {"last_updated": now_iso}
            }
        )
    else:
        # Create new session document
        copilot_chats_collection.insert_one({
            "session_id": session_id,
            "case_id": case_id,
            "title": payload.question[:60],
            "messages": new_turns,
            "created_at": now_iso,
            "last_updated": now_iso,
        })

    return {
        "answer": answer,
        "session_id": session_id,
    }


@router.get("/{case_id}/sessions")
def get_copilot_sessions(case_id: str):
    """Retrieve all past copilot sessions for a case."""
    sessions = list(
        copilot_chats_collection.find(
            {"case_id": case_id},
            {"_id": 0, "messages": 0}  # Exclude full message history for listing
        ).sort("last_updated", -1).limit(30)
    )
    return {"sessions": sessions}


@router.get("/{case_id}/sessions/{session_id}")
def get_session_messages(case_id: str, session_id: str):
    """Retrieve full message history for a specific session."""
    doc = copilot_chats_collection.find_one(
        {"session_id": session_id, "case_id": case_id},
        {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc


@router.delete("/{case_id}/sessions/{session_id}")
def delete_session(case_id: str, session_id: str):
    """Delete a copilot session."""
    copilot_chats_collection.delete_one({"session_id": session_id, "case_id": case_id})
    return {"message": "Session deleted"}
