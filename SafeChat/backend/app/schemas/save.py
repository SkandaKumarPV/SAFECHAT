from datetime import datetime

from pydantic import BaseModel


class SavedPostPublic(BaseModel):
    id: int
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True

