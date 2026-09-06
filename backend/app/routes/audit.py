from fastapi import APIRouter, HTTPException
from app.models.audit import AuditCreate
from app.database.mongodb import audit_collection, evidence_collection
from datetime import datetime, timezone
from uuid import uuid4


router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"]
)


# =========================================================
# 1. Create Audit Log
# =========================================================

@router.post("")
def create_audit_log(audit: AuditCreate):

    audit_data = {
        "audit_id": str(uuid4()),
        "case_id": audit.case_id,
        "action": audit.action,
        "performed_by": audit.performed_by,
        "description": audit.description,
        "created_at": datetime.now(timezone.utc)
    }

    audit_collection.insert_one(audit_data)

    return {
        "message": "Audit log created successfully",
        "audit_id": audit_data["audit_id"]
    }


# =========================================================
# 2. Get All Audit Logs
# =========================================================

@router.get("")
def get_audit_logs():

    logs = list(
        audit_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(logs),
        "audit_logs": logs
    }


# =========================================================
# 3. Complete Evidence Chain of Custody
# =========================================================

@router.get("/evidence/{evidence_id}/chain")
def get_evidence_chain(evidence_id: str):

    # Get Evidence

    evidence = evidence_collection.find_one(
        {"evidence_id": evidence_id},
        {"_id": 0}
    )

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    # Get Evidence Audit History

    audit_logs = list(
        audit_collection.find(
            {"evidence_id": evidence_id},
            {"_id": 0}
        ).sort("created_at", 1)
    )

    return {
        "evidence": evidence,
        "chain_of_custody": audit_logs
    }


# =========================================================
# 4. Get Single Audit Log
# =========================================================

@router.get("/{audit_id}")
def get_audit_log(audit_id: str):

    log = audit_collection.find_one(
        {"audit_id": audit_id},
        {"_id": 0}
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return log