from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.mongodb import cases_collection, evidence_collection, analysis_collection
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter(prefix="/copilot", tags=["Copilot"])

class QuestionRequest(BaseModel):
    question: str

@router.post("/{case_id}/ask")
def ask_copilot(case_id: str, payload: QuestionRequest):
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    evidence_list = list(evidence_collection.find({"case_id": case_id}, {"_id": 0}))
    
    # Gather case context
    context = f"Case Title: {case.get('title')}\n"
    context += f"Case Description: {case.get('description')}\n"
    context += f"Status: {case.get('status')}\n\nEvidence:\n"
    
    for ev in evidence_list:
        context += f"- {ev.get('evidence_name')} ({ev.get('evidence_type')})\n"
        analysis = analysis_collection.find_one({"evidence_id": ev.get("evidence_id")}, {"_id": 0})
        if analysis:
            risk = analysis.get("risk_level", "Unknown")
            context += f"  Risk Level: {risk}\n"
            context += f"  Details: {analysis.get('analysis')}\n"
            
    prompt = f"""
You are an AI Copilot assisting a digital forensics investigator.
Use the following case context to answer the user's question.

Context:
{context}

Question:
{payload.question}

Answer concisely and accurately based on the provided context.
"""
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        answer = response.choices[0].message.content
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
