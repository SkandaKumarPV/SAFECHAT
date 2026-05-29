from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.user import UserSummary

class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=4000)

class MessagePublic(BaseModel):
    id: int
    content: str
    created_at: datetime
    sender: UserSummary
    receiver: UserSummary
    is_toxic: bool
    blocked: bool
    toxicity_label: Optional[str] = None
    toxicity_score: Optional[float] = None
    toxicity_scores: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
