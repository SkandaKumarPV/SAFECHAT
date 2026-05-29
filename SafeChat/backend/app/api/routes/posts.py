from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from backend.app.api.deps import get_current_user, get_db
from backend.app.models import Post, User, Comment, PostLike
from backend.app.schemas import PostCreate, PostUpdate, PostPublic, PostLikeState, LikedPostsResponse

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("", response_model=PostPublic, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Post:
    post = Post(author_id=current_user.id, content=payload.content, image_url=payload.image_url)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.get("", response_model=List[PostPublic])
def list_posts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    author_id: int | None = None,
) -> List[Post]:
    query = db.query(Post)
    if author_id is not None:
        query = query.filter(Post.author_id == author_id)
    return (
        query
        .options(
            selectinload(Post.author),
            selectinload(Post.comments).selectinload(Comment.author),
        )
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.get("/{post_id}", response_model=PostPublic)
def get_post(post_id: int, db: Session = Depends(get_db)) -> Post:
    post = (
        db.query(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.comments).selectinload(Comment.author),
        )
        .filter(Post.id == post_id)
        .first()
    )
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/{post_id}", response_model=PostPublic)
def update_post(
    post_id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this post")

    if payload.content is not None:
        post.content = payload.content
    if payload.image_url is not None:
        post.image_url = payload.image_url
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")
    db.delete(post)
    db.commit()
    return None


@router.post("/{post_id}/like", response_model=PostLikeState)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostLikeState:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = (
        db.query(PostLike)
        .filter(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
        .first()
    )
    if existing is None:
        db.add(PostLike(user_id=current_user.id, post_id=post_id))
        post.likes_count = int(post.likes_count or 0) + 1
        db.add(post)
        db.commit()
        db.refresh(post)
    return PostLikeState(post_id=post.id, likes_count=post.likes_count, liked=True)


@router.delete("/{post_id}/like", response_model=PostLikeState)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostLikeState:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = (
        db.query(PostLike)
        .filter(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
        .first()
    )
    if existing is not None:
        db.delete(existing)
        post.likes_count = max(0, int(post.likes_count or 0) - 1)
        db.add(post)
        db.commit()
        db.refresh(post)
    return PostLikeState(post_id=post.id, likes_count=post.likes_count, liked=False)


@router.get("/me/liked", response_model=LikedPostsResponse)
def my_liked_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LikedPostsResponse:
    rows = db.query(PostLike).filter(PostLike.user_id == current_user.id).all()
    return LikedPostsResponse(post_ids=[r.post_id for r in rows])
