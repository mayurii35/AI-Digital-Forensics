import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Keep the API available when the optional Groq integration is not configured.
# The route returns a structured, explainable fallback instead of preventing
# FastAPI from starting at import time.
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# These two fields are intentionally NOT sent to the LLM. Asking a language
# model to invent an "anomaly_score" or "fake_probability" produces a
# plausible-looking number with no actual model or algorithm behind it —
# that's misleading in a forensics tool. They stay explicitly marked as
# not implemented until a real ML/DL model exists.
_NOT_IMPLEMENTED_ML = {
    "status": "not_implemented",
    "note": "No trained ML model is integrated yet. See suspicious_detector.py for the current rule-based risk indicators.",
}

_NOT_IMPLEMENTED_DEEPFAKE = {
    "status": "not_implemented",
    "note": "No deepfake/image-tampering model is integrated yet. This requires a real image/video analysis model (e.g. a CNN-based tamper detector), not a text LLM.",
}


def analyze_evidence(evidence_text: str):
    if client is None:
        return {
            "nlp": {"entities_extracted": [], "summary": "AI analysis is unavailable because GROQ_API_KEY is not configured."},
            "ml": _NOT_IMPLEMENTED_ML,
            "deepfake": _NOT_IMPLEMENTED_DEEPFAKE,
        }

    prompt = f"""
You are an AI assistant for a digital forensics investigation system.

Analyze the following digital evidence information and provide a
structured investigative summary in STRICT JSON format.

Evidence:
{evidence_text}

You must return ONLY a JSON object with the following exact keys and structure (no markdown tags, just pure JSON):
{{
  "entities_extracted": ["list", "of", "entities", "e.g. names, IPs, dates, file names, locations"],
  "summary": "A concise investigative summary of what this evidence shows"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        nlp_result = json.loads(content)
    except Exception as e:
        nlp_result = {"entities_extracted": [], "summary": f"Failed to analyze: {str(e)}"}

    return {
        "nlp": nlp_result,
        "ml": _NOT_IMPLEMENTED_ML,
        "deepfake": _NOT_IMPLEMENTED_DEEPFAKE,
    }