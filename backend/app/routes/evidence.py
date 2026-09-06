from fastapi import APIRouter, HTTPException, Depends
from app.models.evidence import EvidenceCreate
from app.database.mongodb import evidence_collection, audit_collection
from app.dependencies import verify_firebase_token
from datetime import datetime, timezone
from uuid import uuid4


router = APIRouter(
    prefix="/evidence",
    tags=["Evidence"]
)


def _actor(current_user: dict) -> str:
    return current_user.get("email") or current_user.get("uid") or "Unknown user"


@router.post("")
def create_evidence(evidence: EvidenceCreate):

    evidence_data = {
        "evidence_id": str(uuid4()),
        "case_id": evidence.case_id,
        "evidence_name": evidence.evidence_name,
        "evidence_type": evidence.evidence_type,
        "description": evidence.description,
        "created_at": datetime.now(timezone.utc)
    }

    evidence_collection.insert_one(evidence_data)

    return {
        "message": "Evidence added successfully",
        "evidence_id": evidence_data["evidence_id"]
    }


@router.get("")
def get_evidence():

    evidence = list(
        evidence_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(evidence),
        "evidence": evidence
    }


@router.get("/{evidence_id}")
def get_single_evidence(evidence_id: str, current_user: dict = Depends(verify_firebase_token)):

    evidence = evidence_collection.find_one(
        {"evidence_id": evidence_id},
        {"_id": 0}
    )

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    # Evidence Access Audit Log

    audit_data = {
        "audit_id": str(uuid4()),
        "case_id": evidence.get("case_id"),
        "evidence_id": evidence_id,
        "action": "Evidence Accessed",
        "performed_by": _actor(current_user),
        "description": (
            f"Evidence '{evidence.get('evidence_name')}' "
            f"was accessed."
        ),
        "created_at": datetime.now(timezone.utc)
    }

    audit_collection.insert_one(audit_data)

    return evidence