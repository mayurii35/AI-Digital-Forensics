from fastapi import APIRouter, HTTPException, Depends
from app.models.case import CaseCreate, CaseOut, CasesResponse, CaseCreateResponse
from app.database.mongodb import cases_collection, evidence_collection, audit_collection
from app.dependencies import verify_firebase_token
from datetime import datetime, timezone
from uuid import uuid4


router = APIRouter(prefix="/cases", tags=["Cases"])


def _actor(current_user: dict) -> str:
    """Best-effort human-readable identity for audit logs."""
    return current_user.get("email") or current_user.get("uid") or "Unknown user"


@router.post("", response_model=CaseCreateResponse)
def create_case(case: CaseCreate, current_user: dict = Depends(verify_firebase_token)):

    case_data = {
        "case_id": str(uuid4()),
        "title": case.title,
        "description": case.description,
        "crime_category": case.crime_category,
        "status": case.status,
        "created_at": datetime.now(timezone.utc)
    }

    cases_collection.insert_one(case_data)

    audit_collection.insert_one({
        "audit_id": str(uuid4()),
        "case_id": case_data["case_id"],
        "action": "Case Created",
        "performed_by": _actor(current_user),
        "description": f"Case '{case_data['title']}' was created.",
        "created_at": case_data["created_at"],
    })

    return {
        "message": "Case created successfully",
        "case_id": case_data["case_id"]
    }


@router.get("", response_model=CasesResponse)
def get_cases():

    cases = list(
        cases_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(cases),
        "cases": cases
    }


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: str):

    case = cases_collection.find_one(
        {"case_id": case_id},
        {"_id": 0}
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return case


@router.get("/{case_id}/evidence")
def get_case_evidence(case_id: str):

    case = cases_collection.find_one(
        {"case_id": case_id}
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    evidence = list(
        evidence_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
    )

    return {
        "case_id": case_id,
        "count": len(evidence),
        "evidence": evidence
    }


@router.get("/{case_id}/timeline")
def get_case_timeline(case_id: str):
    audit_logs = list(
        audit_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        ).sort("created_at", 1)
    )

    events = []
    for log in audit_logs:
        events.append({
            "id": log.get("audit_id"),
            "timestamp": log.get("created_at"),
            "action": log.get("action"),
            "description": log.get("description")
        })
    return events


@router.get("/{case_id}/graph")
def get_case_graph(case_id: str):
    evidence_list = list(
        evidence_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
    )

    nodes = [{"id": case_id, "label": "Case Root", "type": "case"}]
    edges = []
    for ev in evidence_list:
        nodes.append({
            "id": ev.get("evidence_id"),
            "label": ev.get("evidence_name"),
            "type": ev.get("evidence_type", "evidence")
        })
        edges.append({
            "source": case_id,
            "target": ev.get("evidence_id"),
            "relation": "contains"
        })

    return {"nodes": nodes, "edges": edges}