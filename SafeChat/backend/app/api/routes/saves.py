from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from backend.app.api.deps import get_current_user, get_db
from backend.app.models import Comment, Post, SavedPost, User
from backend.app.schemas import PostPublic, SavedPostPublic

router = APIRouter(prefix="/saves", tags=["saves"])


@router.post("/{post_id}", response_model=SavedPostPublic, status_code=status.HTTP_201_CREATED)
def save_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedPost:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = (
        db.query(SavedPost)
        .filter(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id)
        .first()
    )
    if existing is not None:
        return existing

    saved = SavedPost(user_id=current_user.id, post_id=post_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    saved = (
        db.query(SavedPost)
        .filter(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id)
        .first()
    )
    if saved is None:
        return None
    db.delete(saved)
    db.commit()
    return None


@router.get("/me", response_model=List[PostPublic])
def list_saved_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Post]:
    saved_rows = (
        db.query(SavedPost)
        .filter(SavedPost.user_id == current_user.id)
        .order_by(SavedPost.created_at.desc())
        .all()
    )
    post_ids = [row.post_id for row in saved_rows]
    if not post_ids:
        return []

    posts = (
        db.query(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.comments).selectinload(Comment.author),
        )
        .filter(Post.id.in_(post_ids))
        .all()
    )

    post_by_id = {p.id: p for p in posts}
    ordered = [post_by_id[pid] for pid in post_ids if pid in post_by_id]
    return ordered

