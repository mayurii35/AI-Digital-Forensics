from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnalysisOut(BaseModel):
    analysis_id: str
    evidence_id: str
    analysis: str
    created_at: datetime