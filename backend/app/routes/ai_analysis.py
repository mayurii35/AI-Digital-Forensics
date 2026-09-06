from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import verify_firebase_token

from app.database.mongodb import (
    cases_collection,
    evidence_collection,
    analysis_collection,
    audit_collection
)

from app.services.ai_service import analyze_evidence
from app.services.evidence_service import extract_text_from_file
from app.ml.suspicious_detector import detect_suspicious_indicators

from datetime import datetime, timezone
from uuid import uuid4


router = APIRouter(
    prefix="/ai",
    tags=["AI Analysis"]
)


# =========================================================
# 1. Analyze Single Evidence
# =========================================================

@router.post("/analyze/{evidence_id}")
def analyze_single_evidence(evidence_id: str, current_user: dict = Depends(verify_firebase_token)):

    evidence = evidence_collection.find_one(
        {"evidence_id": evidence_id},
        {"_id": 0}
    )

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    file_path = evidence.get("file_path")

    extracted_text = ""

    if file_path:
        extracted_text = extract_text_from_file(file_path)

    evidence_text = f"""
Evidence Name: {evidence.get("evidence_name")}
Evidence Type: {evidence.get("evidence_type")}
Description: {evidence.get("description")}
File Hash: {evidence.get("file_hash")}
Case ID: {evidence.get("case_id")}

Extracted Evidence Content:
{extracted_text if extracted_text else "No text content could be extracted from this file type."}
"""

    suspicious_indicators = detect_suspicious_indicators(
        evidence_text
    )

    analysis = analyze_evidence(evidence_text)

    analysis_data = {
        "analysis_id": str(uuid4()),
        "evidence_id": evidence_id,
        "case_id": evidence.get("case_id"),
        "analysis": analysis,
        "risk_level": suspicious_indicators["risk_level"],
        "indicator_count": suspicious_indicators["indicator_count"],
        "suspicious_indicators": suspicious_indicators["indicators"],
        "created_at": datetime.now(timezone.utc)
    }

    # Re-analysis replaces the prior result only after a new result is ready,
    # avoiding duplicate dashboard findings while preserving the prior record
    # if extraction or analysis fails.
    analysis_collection.delete_many({"evidence_id": evidence_id})
    analysis_collection.insert_one(analysis_data)

    # Automatic Audit Log for AI Analysis

    audit_data = {
        "audit_id": str(uuid4()),
        "case_id": evidence.get("case_id"),
        "action": "AI Evidence Analysis",
        "performed_by": "AI System",
        "description": (
            f"AI analysis completed for evidence "
            f"'{evidence.get('evidence_name')}'."
        ),
        "created_at": datetime.now(timezone.utc)
    }

    audit_collection.insert_one(audit_data)

    result = {
        "message": "Evidence analyzed successfully",
        "evidence_id": evidence_id,
        "analysis_id": analysis_data["analysis_id"],
        "risk_level": suspicious_indicators["risk_level"],
        "indicator_count": suspicious_indicators["indicator_count"],
        "suspicious_indicators": suspicious_indicators["indicators"]
    }
    
    if isinstance(analysis, dict):
        result.update(analysis)
    else:
        result["analysis"] = analysis

    return result


# =========================================================
# 2. Get Analysis of Single Evidence
# =========================================================

@router.get("/analysis/{evidence_id}")
def get_analysis(evidence_id: str):

    analysis = analysis_collection.find_one(
        {"evidence_id": evidence_id},
        {"_id": 0}
    )

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    result = {
        "evidence_id": evidence_id,
        "analysis_id": analysis.get("analysis_id"),
        "risk_level": analysis.get("risk_level"),
        "indicator_count": analysis.get("indicator_count"),
        "suspicious_indicators": analysis.get("suspicious_indicators")
    }

    ai_data = analysis.get("analysis", {})
    if isinstance(ai_data, dict):
        result.update(ai_data)
    else:
        result["analysis"] = ai_data

    return result


# =========================================================
# 3. Get All Analysis of a Case
# =========================================================

@router.get("/case/{case_id}")
def get_case_analysis(case_id: str):

    evidence_list = list(
        evidence_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
    )

    if not evidence_list:
        raise HTTPException(
            status_code=404,
            detail="No evidence found for this case"
        )

    results = []

    for evidence in evidence_list:

        evidence_id = evidence.get("evidence_id")

        analysis = analysis_collection.find_one(
            {"evidence_id": evidence_id},
            {"_id": 0}
        )

        results.append({
            "evidence_id": evidence_id,
            "evidence_name": evidence.get("evidence_name"),
            "risk_level": (
                analysis.get("risk_level")
                if analysis else None
            ),
            "suspicious_indicators": (
                analysis.get("suspicious_indicators")
                if analysis else []
            ),
            "analysis": (
                analysis.get("analysis")
                if analysis else None
            )
        })

    return {
        "case_id": case_id,
        "evidence_count": len(evidence_list),
        "analyses": results
    }


# =========================================================
# 4. Case Dashboard
# =========================================================

@router.get("/case/{case_id}/dashboard")
def get_case_dashboard(case_id: str):

    # Get Case

    case = cases_collection.find_one(
        {"case_id": case_id},
        {"_id": 0}
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    # Get Evidence

    evidence_list = list(
        evidence_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
    )

    analyses = []

    high = 0
    medium = 0
    low = 0

    total_indicators = 0

    # Process Evidence

    for evidence in evidence_list:

        evidence_id = evidence["evidence_id"]

        analysis = analysis_collection.find_one(
            {"evidence_id": evidence_id},
            {"_id": 0}
        )

        risk = (
            analysis.get("risk_level")
            if analysis
            else None
        )

        if risk == "High":
            high += 1

        elif risk == "Medium":
            medium += 1

        elif risk == "Low":
            low += 1

        if analysis:

            total_indicators += analysis.get(
                "indicator_count",
                0
            )

        analyses.append({
            "evidence_id": evidence_id,
            "evidence_name": evidence.get("evidence_name"),
            "evidence_type": evidence.get("evidence_type"),
            "risk_level": risk,
            "suspicious_indicators": (
                analysis.get(
                    "suspicious_indicators",
                    []
                )
                if analysis
                else []
            )
        })

    # Overall Risk

    if high > 0:
        overall_risk = "High"

    elif medium > 0:
        overall_risk = "Medium"

    elif low > 0:
        overall_risk = "Low"

    else:
        overall_risk = "Not Analyzed"

    # Recent Audit Logs

    audit_logs = list(
        audit_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
        .sort("created_at", -1)
        .limit(10)
    )

    # Final Dashboard Response

    return {
        "case": case,

        "summary": {
            "total_evidence": len(evidence_list),
            "analyzed_evidence": high + medium + low,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "total_suspicious_indicators": total_indicators,
            "overall_risk": overall_risk
        },

        "evidence_analysis": analyses,

        "recent_audit_logs": audit_logs
    }
