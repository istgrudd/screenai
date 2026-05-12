"""EmailVerification ORM model — stores pending email verification tokens."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EmailVerification(Base):
    """One-time token for email address verification.

    A record is created on register and deleted on successful verification.
    Expired records are ignored (token_expires_at < now).
    """

    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String(64), unique=True, nullable=False, index=True)
    token_expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    @staticmethod
    def generate_token() -> str:
        """Return a cryptographically random 64-char hex token."""
        return uuid.uuid4().hex + uuid.uuid4().hex
