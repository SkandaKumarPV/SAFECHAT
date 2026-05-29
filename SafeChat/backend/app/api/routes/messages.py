from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from backend.app.api.deps import get_current_user, get_db
from backend.app.core.config import settings
from backend.app.models import Follow, Message, User
from backend.app.schemas import MessageCreate, MessagePublic
from backend.app.services.toxicity import service as toxicity_service

router = APIRouter(prefix="/messages", tags=["messages"])


def sender_follows_receiver(db: Session, sender_id: int, receiver_id: int) -> bool:
    return (
        db.query(Follow)
        .filter(
            Follow.follower_id == sender_id,
            Follow.following_id == receiver_id,
        )
        .first()
        is not None
    )

@router.post("", response_model=MessagePublic, status_code=status.HTTP_201_CREATED)
def send_message(payload: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Message:
    if payload.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if receiver is None:
        raise HTTPException(status_code=404, detail="Receiver not found")

    if not sender_follows_receiver(db, current_user.id, receiver.id):
        raise HTTPException(status_code=403, detail="Follow this user to send messages")

    analysis = toxicity_service.analyze(payload.content)
    if analysis["is_toxic"] and settings.toxicity_mode == "block":
        raise HTTPException(status_code=400, detail="Message blocked due to toxicity")

    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        content=payload.content,
        is_toxic=analysis["is_toxic"],
        blocked=settings.toxicity_mode == "block" and analysis["is_toxic"],
        toxicity_scores=analysis,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

@router.get("/inbox", response_model=List[MessagePublic])
def inbox(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Message]:
    return (
        db.query(Message)
        .options(selectinload(Message.sender), selectinload(Message.receiver))
        .filter(Message.receiver_id == current_user.id)
        .order_by(Message.created_at.desc())
        .all()
    )

@router.get("/outbox", response_model=List[MessagePublic])
def outbox(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Message]:
    return (
        db.query(Message)
        .options(selectinload(Message.sender), selectinload(Message.receiver))
        .filter(Message.sender_id == current_user.id)
        .order_by(Message.created_at.desc())
        .all()
    )
