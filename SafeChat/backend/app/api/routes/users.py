from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db, get_optional_user
from backend.app.models import User, Follow, Post, Comment, Message
from backend.app.core.security import get_password_hash, verify_password
from backend.app.schemas import UserPublic, UserUpdate, UserPasswordChange, UserProfile, UserStats, NotificationPublic

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserPublic])
def list_users(db: Session = Depends(get_db)) -> List[User]:
    return db.query(User).order_by(User.id.desc()).all()

@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/username/{username}", response_model=UserPublic)
def get_user_by_username(username: str, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> UserProfile:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    followers = db.query(Follow).filter(Follow.following_id == user_id).count()
    following = db.query(Follow).filter(Follow.follower_id == user_id).count()
    posts = db.query(Post).filter(Post.author_id == user_id).count()
    comments_flagged = db.query(Comment).filter(Comment.author_id == user_id, Comment.is_toxic == True).count()
    messages_flagged = db.query(Message).filter(Message.sender_id == user_id, Message.is_toxic == True).count()

    is_following = False
    is_followed_by = False
    if current_user is not None:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        ).first() is not None
        is_followed_by = db.query(Follow).filter(
            Follow.follower_id == user_id,
            Follow.following_id == current_user.id,
        ).first() is not None

    stats = UserStats(
        posts=posts,
        followers=followers,
        following=following,
        comments_flagged=comments_flagged,
        messages_flagged=messages_flagged,
        is_following=is_following,
        is_followed_by=is_followed_by,
    )

    return UserProfile(user=user, stats=stats)

@router.patch("/me", response_model=UserPublic)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.bio is not None:
        current_user.bio = payload.bio
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
def change_password(
    payload: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/me/notifications", response_model=List[NotificationPublic])
def my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[NotificationPublic]:
    notifications: List[NotificationPublic] = []

    follows = (
        db.query(Follow)
        .filter(Follow.following_id == current_user.id)
        .order_by(Follow.created_at.desc())
        .limit(100)
        .all()
    )
    for f in follows:
        notifications.append(
            NotificationPublic(
                id=f"follow-{f.id}",
                type="follow",
                text=f"{f.follower.username} started following you.",
                created_at=f.created_at,
                actor=f.follower,
                post_id=None,
            )
        )

    comments = (
        db.query(Comment)
        .join(Post, Comment.post_id == Post.id)
        .filter(Post.author_id == current_user.id, Comment.author_id != current_user.id)
        .order_by(Comment.created_at.desc())
        .limit(100)
        .all()
    )
    for c in comments:
        notifications.append(
            NotificationPublic(
                id=f"comment-{c.id}",
                type="comment",
                text=f"{c.author.username} commented on your post.",
                created_at=c.created_at,
                actor=c.author,
                post_id=c.post_id,
            )
        )

    notifications.sort(key=lambda n: n.created_at, reverse=True)
    return notifications[:100]
