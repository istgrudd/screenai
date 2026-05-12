"""User ORM model for authentication and RBAC."""

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    """Role enum for RBAC.

    super_admin: full system access, user management
    recruiter:   evaluate candidates, manage rubrics
    candidate:   upload own CV, view own application status
    """

    SUPER_ADMIN = "super_admin"
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"


class User(Base):
    """An authenticated user of the system."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, native_enum=False, length=20),
        nullable=False,
        default=UserRole.CANDIDATE,
    )
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
