from fastapi import APIRouter, HTTPException
from app.database.mongodb import audit_collection, evidence_collection
from app.services.evidence_service import calculate_file_hash
from datetime import datetime, timezone

router = APIRouter(prefix="/audit", tags=["Audit"])

def format_log(log: dict) -> dict:
    if "_id" in log:
        log["id"] = str(log.pop("_id"))
    ts = log.get("timestamp") or log.get("created_at")
    if isinstance(ts, datetime):
        ts_str = ts.isoformat()
    elif ts:
        ts_str = str(ts)
    else:
        ts_str = datetime.now(timezone.utc).isoformat()
    log["timestamp"] = ts_str
    log["created_at"] = log.get("created_at", ts_str)
    return log

@router.post("")
def create_audit_log(audit_data: dict):
    now_iso = datetime.now(timezone.utc).isoformat()
    audit_data["timestamp"] = now_iso
    audit_data["created_at"] = audit_data.get("created_at", now_iso)

    result = audit_collection.insert_one(audit_data)
    return {
        "message": "Audit log created",
        "audit_id": str(result.inserted_id)
    }

@router.get("")
def get_audit_logs():
    raw_logs = list(
        audit_collection.find({})
    )
    formatted = [format_log(l) for l in raw_logs]
    # Sort descending by timestamp / created_at
    formatted.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return {
        "audit_logs": formatted
    }

@router.get("/evidence/{evidence_id}/chain")
def get_evidence_chain(evidence_id: str):
    raw_logs = list(
        audit_collection.find({"evidence_id": evidence_id})
    )
    formatted = [format_log(l) for l in raw_logs]
    formatted.sort(key=lambda x: str(x.get("timestamp", "")))
    return {
        "evidence_id": evidence_id,
        "chain": formatted
    }

@router.get("/evidence/{evidence_id}/verify-hash")
def verify_evidence_hash(evidence_id: str):
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
    stored_hash = evidence.get("file_hash")

    if not file_path:
        raise HTTPException(
            status_code=400,
            detail="Evidence file path not found"
        )

    if not stored_hash:
        raise HTTPException(
            status_code=400,
            detail="Stored evidence hash not found"
        )

    try:
        current_hash = calculate_file_hash(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hash verification failed: {str(e)}"
        )

    is_valid = (current_hash.lower() == stored_hash.lower())

    # Log hash verification audit entry
    audit_collection.insert_one({
        "evidence_id": evidence_id,
        "case_id": evidence.get("case_id"),
        "action": "HASH_VERIFICATION",
        "description": f"Integrity check performed: {'PASS (Match)' if is_valid else 'FAIL (Tampered)'}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "evidence_id": evidence_id,
        "file_name": evidence.get("file_name"),
        "stored_hash": stored_hash,
        "current_hash": current_hash,
        "integrity_status": "Verified" if is_valid else "Tampered",
        "hash_match": is_valid
    }

@router.get("/{audit_id}")
def get_audit_log(audit_id: str):
    log = audit_collection.find_one(
        {"audit_id": audit_id}
    )
    if not log:
        try:
            from bson import ObjectId
            log = audit_collection.find_one({"_id": ObjectId(audit_id)})
        except Exception:
            log = None

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return format_log(log)