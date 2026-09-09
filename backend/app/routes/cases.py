from fastapi import APIRouter, HTTPException, Depends
from app.models.case import CaseCreate, CaseOut, CasesResponse, CaseCreateResponse
from app.database.mongodb import (
    cases_collection,
    evidence_collection,
    audit_collection,
    analysis_collection,
    text_tracker_collection,
    copilot_chats_collection
)
from app.dependencies import verify_firebase_token
from datetime import datetime, timezone
from uuid import uuid4
import os


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
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    case_title = case.get("title", "Case Root") if case else "Case Root"

    evidence_list = list(
        evidence_collection.find(
            {"case_id": case_id},
            {"_id": 0}
        )
    )

    nodes = [{
        "id": case_id,
        "label": case_title,
        "type": "case",
        "size": 18,
        "color": "#3b82f6"
    }]
    edges = []
    seen_nodes = {case_id}

    for ev in evidence_list:
        ev_id = ev.get("evidence_id")
        ev_label = ev.get("evidence_name") or ev.get("file_name", "Evidence")
        ev_type = ev.get("evidence_type", "document")

        if ev_id not in seen_nodes:
            seen_nodes.add(ev_id)
            nodes.append({
                "id": ev_id,
                "label": ev_label,
                "type": "evidence",
                "subType": ev_type,
                "size": 14,
                "color": "#06b6d4"
            })

        edges.append({
            "source": case_id,
            "target": ev_id,
            "relation": "contains"
        })

        # Check AI analysis findings for entities
        analysis = analysis_collection.find_one({"evidence_id": ev_id}, {"_id": 0})
        if analysis:
            entities = analysis.get("analysis", {}).get("nlp", {}).get("entities_extracted", [])
            for ent in entities[:6]:
                ent_name = ent if isinstance(ent, str) else str(ent.get("name") or ent.get("value") or ent)
                ent_id = f"entity_{ent_name.lower().strip()}"
                if ent_id not in seen_nodes:
                    seen_nodes.add(ent_id)
                    nodes.append({
                        "id": ent_id,
                        "label": ent_name,
                        "type": "entity",
                        "size": 10,
                        "color": "#10b981"
                    })
                edges.append({
                    "source": ev_id,
                    "target": ent_id,
                    "relation": "references"
                })

        # Check Text Tracker findings
        tracker = text_tracker_collection.find_one({"evidence_id": ev_id}, {"_id": 0})
        if tracker:
            top_indicators = tracker.get("indicators", [])[:5]
            for ind in top_indicators:
                ind_val = ind.get("value", "")
                ind_sev = ind.get("severity", "MEDIUM")
                ind_id = f"ind_{ind_val.lower().strip()}"
                sev_color = "#ef4444" if ind_sev == "CRITICAL" else "#f97316" if ind_sev == "HIGH" else "#eab308"

                if ind_id not in seen_nodes:
                    seen_nodes.add(ind_id)
                    nodes.append({
                        "id": ind_id,
                        "label": f"{ind.get('type')}: {ind_val[:20]}",
                        "type": "indicator",
                        "severity": ind_sev,
                        "size": 11,
                        "color": sev_color
                    })
                edges.append({
                    "source": ev_id,
                    "target": ind_id,
                    "relation": "flagged_artifact"
                })

    return {"nodes": nodes, "edges": edges}


@router.delete("/{case_id}")
def delete_case(case_id: str, current_user: dict = Depends(verify_firebase_token)):
    """Delete a case and ALL related evidence, analyses, tracker results, and copilot sessions."""
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Collect all evidence to delete physical files too
    ev_list = list(evidence_collection.find({"case_id": case_id}, {"_id": 0}))
    for ev in ev_list:
        fp = ev.get("file_path")
        if fp and os.path.exists(fp):
            try:
                os.remove(fp)
            except Exception:
                pass

    # Cascade delete all related MongoDB records
    evidence_ids = [ev["evidence_id"] for ev in ev_list]
    if evidence_ids:
        analysis_collection.delete_many({"evidence_id": {"$in": evidence_ids}})
        text_tracker_collection.delete_many({"evidence_id": {"$in": evidence_ids}})

    evidence_collection.delete_many({"case_id": case_id})
    copilot_chats_collection.delete_many({"case_id": case_id})
    audit_collection.delete_many({"case_id": case_id})
    cases_collection.delete_one({"case_id": case_id})

    return {"message": f"Case '{case.get('title')}' and all related data deleted successfully."}
