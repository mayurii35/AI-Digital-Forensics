from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    crime_category: Optional[str] = None
    status: str = "Open"


class CaseOut(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = None
    crime_category: Optional[str] = None
    status: str
    created_at: datetime


class CasesResponse(BaseModel):
    count: int
    cases: list[CaseOut]


class CaseCreateResponse(BaseModel):
    message: str
    case_id: str