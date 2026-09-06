from pydantic import BaseModel
from typing import Optional


class EvidenceCreate(BaseModel):
    case_id: str
    evidence_name: str
    evidence_type: str
    description: Optional[str] = None