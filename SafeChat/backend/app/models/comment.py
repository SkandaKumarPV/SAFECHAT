from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text, Boolean
from sqlalchemy.orm import relationship

from backend.app.db.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_toxic = Column(Boolean, default=False, nullable=False)
    blocked = Column(Boolean, default=False, nullable=False)
    toxicity_scores = Column(JSON, nullable=True)

    post = relationship("Post", back_populates="comments", lazy="selectin")
    author = relationship("User", back_populates="comments", lazy="selectin")

    @property
    def toxicity_label(self) -> str | None:
        scores = (self.toxicity_scores or {}).get("scores", {})
        if not scores:
            return None
        label = max(scores, key=scores.get)
        return label.replace("_", " ").title()

    @property
    def toxicity_score(self) -> float | None:
        scores = (self.toxicity_scores or {}).get("scores", {})
        if not scores:
            return None
        return float(scores[max(scores, key=scores.get)])
