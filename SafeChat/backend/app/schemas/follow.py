from datetime import datetime
from pydantic import BaseModel

from backend.app.schemas.user import UserSummary

class FollowPublic(BaseModel):
    id: int
    follower: UserSummary
    following: UserSummary
    created_at: datetime

    class Config:
        from_attributes = True
