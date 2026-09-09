from datetime import datetime, timezone
import os
import json
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.database.mongodb import evidence_collection, text_tracker_collection, audit_collection
from app.dependencies import verify_firebase_token
from app.services.evidence_service import extract_text_from_file, extract_text_lines
from app.services.ai_service import (
    scan_text_for_indicators,
    calculate_risk_score,
    generate_forensic_recommendations,
    client
)

router = APIRouter(prefix="/text-tracker", tags=["text-tracker"])

def generate_text_summary(text: str, indicators: list[dict], file_name: str) -> str:
    """Generates concise AI/heuristic forensic summary for Text Tracker."""
    if not text.strip():
        return f"No textual content could be extracted from {file_name}."

    if client:
        try:
            indicators_sample = json.dumps(indicators[:12], default=str)
            prompt = f"""
You are a digital forensics specialist. Summarize the textual artifacts found in this evidence file: "{file_name}".

Sample Text (first 2500 chars):
{text[:2500]}

Detected Indicators:
{indicators_sample}

Provide a concise, 2-3 sentence forensic finding summary explaining what the text represents and any critical security implications.
"""
            res = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=250
            )
            return res.choices[0].message.content.strip()
        except Exception:
            pass

    # Fallback heuristic summary
    crit_count = sum(1 for i in indicators if i.get("severity") == "CRITICAL")
    high_count = sum(1 for i in indicators if i.get("severity") == "HIGH")
    return (
        f"Text Tracker inspected {file_name}. "
        f"Detected {len(indicators)} forensic indicators ({crit_count} Critical, {high_count} High). "
        "Review highlighted lines for detailed artifact breakdown."
    )

def perform_tracker_scan(evidence: dict, current_user: dict):
    file_path = evidence.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Evidence file not found on disk at {file_path}")

    extracted_text = extract_text_from_file(file_path)
    lines_list = extract_text_lines(file_path)
    indicators = scan_text_for_indicators(extracted_text)
    risk_score, risk_level = calculate_risk_score(indicators)
    recommendations = generate_forensic_recommendations(risk_level, indicators)
    ai_summary = generate_text_summary(extracted_text, indicators, evidence.get("file_name", "evidence"))

    # Breakdown counts
    type_counts = {}
    sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for ind in indicators:
        t = ind.get("type", "Other")
        type_counts[t] = type_counts.get(t, 0) + 1
        s = ind.get("severity", "LOW")
        sev_counts[s] = sev_counts.get(s, 0) + 1

    from app.ml.threat_classifier import classify_threat
    ml_threat = classify_threat(extracted_text)

    now_iso = datetime.now(timezone.utc).isoformat()
    tracker_record = {
        "evidence_id": evidence["evidence_id"],
        "case_id": evidence.get("case_id"),
        "file_name": evidence.get("file_name"),
        "file_type": evidence.get("file_type"),
        "total_lines": len(lines_list),
        "total_chars": len(extracted_text),
        "extracted_text": extracted_text,
        "lines": lines_list,
        "indicators": indicators,
        "type_counts": type_counts,
        "severity_counts": sev_counts,
        "risk_score": max(risk_score, int(ml_threat.get("confidence", 0) * 0.9)),
        "risk_level": ml_threat.get("risk_level") if ml_threat.get("confidence", 0) > 60 else risk_level,
        "ai_summary": ai_summary,
        "ml_threat": ml_threat,
        "recommendations": recommendations,
        "updated_at": now_iso
    }

    text_tracker_collection.update_one(
        {"evidence_id": evidence["evidence_id"]},
        {"$set": tracker_record},
        upsert=True
    )

    # Log to audit collection
    user_id = current_user.get("uid") or current_user.get("email") or "investigator"
    audit_collection.insert_one({
        "case_id": evidence.get("case_id"),
        "evidence_id": evidence["evidence_id"],
        "action": "TEXT_TRACKER_ANALYSIS",
        "description": f"Text Tracker scanned {evidence.get('file_name')}: {len(indicators)} indicators detected (Score: {risk_score}/100, Level: {risk_level})",
        "user_id": user_id,
        "created_at": now_iso,
        "timestamp": now_iso
    })

    tracker_record.pop("_id", None)
    return tracker_record

@router.post("/{evidence_id}")
def run_text_tracker(evidence_id: str, current_user: dict = Depends(verify_firebase_token)):
    evidence = evidence_collection.find_one({"evidence_id": evidence_id})
    if not evidence:
        try:
            evidence = evidence_collection.find_one({"_id": ObjectId(evidence_id)})
        except Exception:
            evidence = None

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return perform_tracker_scan(evidence, current_user)

@router.get("/{evidence_id}")
def get_text_tracker_result(evidence_id: str, current_user: dict = Depends(verify_firebase_token)):
    existing = text_tracker_collection.find_one({"evidence_id": evidence_id}, {"_id": 0})
    if existing:
        return existing

    # If no prior record, automatically execute tracker if evidence exists
    evidence = evidence_collection.find_one({"evidence_id": evidence_id})
    if not evidence:
        try:
            evidence = evidence_collection.find_one({"_id": ObjectId(evidence_id)})
        except Exception:
            evidence = None

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return perform_tracker_scan(evidence, current_user)

