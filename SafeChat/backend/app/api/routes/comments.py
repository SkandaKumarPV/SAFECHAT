from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.core.config import settings
from backend.app.models import Comment, Post, User
from backend.app.schemas import CommentCreate, CommentPublic
from backend.app.services.toxicity import service as toxicity_service

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/posts/{post_id}", response_model=CommentPublic, status_code=status.HTTP_201_CREATED)
def create_comment(post_id: int, payload: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Comment:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    analysis = toxicity_service.analyze(payload.content)
    if analysis["is_toxic"] and settings.toxicity_mode == "block":
        raise HTTPException(status_code=400, detail="Comment blocked due to toxicity")

    comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=payload.content,
        is_toxic=analysis["is_toxic"],
        blocked=settings.toxicity_mode == "block" and analysis["is_toxic"],
        toxicity_scores=analysis,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/posts/{post_id}", response_model=List[CommentPublic])
def list_comments(post_id: int, db: Session = Depends(get_db)) -> List[Comment]:
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    can_delete = comment.author_id == current_user.id or post.author_id == current_user.id
    if not can_delete:
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

    db.delete(comment)
    db.commit()
