from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from backend.app.schemas.user import UserSummary


class NotificationPublic(BaseModel):
    id: str
    type: str
    text: str
    created_at: datetime
    actor: Optional[UserSummary] = None
    post_id: Optional[int] = None

