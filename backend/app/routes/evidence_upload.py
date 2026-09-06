from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.database.mongodb import cases_collection, evidence_collection, audit_collection
from app.services.evidence_service import calculate_file_hash, get_file_extension
from app.dependencies import verify_firebase_token
from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path


router = APIRouter(
    prefix="/upload-evidence",
    tags=["Evidence Upload"]
)


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# --- Upload validation limits ---
MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
ALLOWED_EXTENSIONS = {
    ".txt", ".log", ".csv", ".pdf",
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".mp4", ".mov", ".avi",
    ".mp3", ".wav",
    ".zip", ".7z",
    ".doc", ".docx", ".xls", ".xlsx",
}


def _actor(current_user: dict) -> str:
    return current_user.get("email") or current_user.get("uid") or "Unknown user"


# =========================================================
# 1. Upload Evidence
# =========================================================

@router.post("")
async def upload_evidence(
    case_id: str = Form(...),
    evidence_type: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_firebase_token),
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File is required"
        )

    extension = get_file_extension(file.filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{extension or 'unknown'}' is not allowed."
        )

    if not cases_collection.find_one({"case_id": case_id}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Case not found")

    evidence_id = str(uuid4())

    saved_filename = evidence_id + extension

    file_path = UPLOAD_DIR / saved_filename

    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(file_content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB upload limit."
        )

    with open(file_path, "wb") as output_file:
        output_file.write(file_content)
    await file.close()

    file_hash = calculate_file_hash(str(file_path))

    evidence_data = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "evidence_name": file.filename,
        "evidence_type": evidence_type,
        "description": description,
        "file_path": str(file_path),
        "file_hash": file_hash,
        "created_at": datetime.now(timezone.utc)
    }

    evidence_collection.insert_one(evidence_data)

    # Automatic Audit Log

    audit_data = {
        "audit_id": str(uuid4()),
        "case_id": case_id,
        "evidence_id": evidence_id,
        "action": "Evidence Uploaded",
        "performed_by": _actor(current_user),
        "description": (
            f"Evidence file '{file.filename}' "
            f"uploaded successfully."
        ),
        "created_at": datetime.now(timezone.utc)
    }

    audit_collection.insert_one(audit_data)

    return {
        "message": "Evidence file uploaded successfully",
        "evidence_id": evidence_id,
        "file_name": file.filename,
        "file_hash": file_hash,
        "audit_id": audit_data["audit_id"]
    }


# =========================================================
# 2. Verify Evidence Hash
# =========================================================

@router.get("/verify/{evidence_id}")
def verify_evidence_hash(evidence_id: str, current_user: dict = Depends(verify_firebase_token)):

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

    if not file_path or not stored_hash:
        raise HTTPException(
            status_code=400,
            detail="File path or stored hash is missing"
        )

    if not Path(file_path).is_file():
        raise HTTPException(status_code=404, detail="Evidence file is no longer available")

    current_hash = calculate_file_hash(file_path)

    integrity_status = (
        "Verified"
        if current_hash == stored_hash
        else "Integrity compromised"
    )

    # Hash Verification Audit Log

    audit_data = {
        "audit_id": str(uuid4()),
        "case_id": evidence.get("case_id"),
        "evidence_id": evidence_id,
        "action": "Evidence Integrity Check",
        "performed_by": _actor(current_user),
        "description": (
            f"Hash verification performed for evidence "
            f"'{evidence.get('evidence_name')}'. "
            f"Result: {integrity_status}"
        ),
        "created_at": datetime.now(timezone.utc)
    }

    audit_collection.insert_one(audit_data)

    return {
        "evidence_id": evidence_id,
        "stored_hash": stored_hash,
        "current_hash": current_hash,
        "integrity_status": integrity_status,
        "audit_id": audit_data["audit_id"]
    }