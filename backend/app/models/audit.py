from pydantic import BaseModel
from typing import Optional


class AuditCreate(BaseModel):
    case_id: str
    action: str
    performed_by: Optional[str] = None
    description: Optional[str] = None