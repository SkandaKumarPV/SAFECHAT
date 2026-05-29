from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.user import UserSummary
from backend.app.schemas.comment import CommentPublic

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    image_url: Optional[str] = None


class PostUpdate(BaseModel):
    content: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    image_url: Optional[str] = None


class PostPublic(BaseModel):
    id: int
    content: str
    image_url: Optional[str] = None
    likes_count: int
    created_at: datetime
    author: UserSummary
    comments: List[CommentPublic] = []

    class Config:
        from_attributes = True


class PostLikeState(BaseModel):
    post_id: int
    likes_count: int
    liked: bool


class LikedPostsResponse(BaseModel):
    post_ids: List[int]
