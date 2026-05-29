from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models import Follow, User
from backend.app.schemas import FollowPublic

router = APIRouter(prefix="/follows", tags=["follows"])

@router.post("/{user_id}", response_model=FollowPublic, status_code=status.HTTP_201_CREATED)
def follow_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Follow:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")

    follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id,
    ).first()
    if follow is None:
        raise HTTPException(status_code=404, detail="Follow relationship not found")

    db.delete(follow)
    db.commit()
    return None

@router.get("/me/followers", response_model=List[FollowPublic])
def my_followers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Follow]:
    return db.query(Follow).filter(Follow.following_id == current_user.id).all()

@router.get("/me/following", response_model=List[FollowPublic])
def my_following(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Follow]:
    return db.query(Follow).filter(Follow.follower_id == current_user.id).all()
