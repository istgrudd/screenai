"""Authentication service: JWT creation/verification and user lookup."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.email_verification import EmailVerification
from backend.models.user import User
from backend.utils.security import verify_password


def create_access_token(user: User) -> str:
    """Create a signed JWT for the given user.

    Claims:
        sub:  user id (stringified)
        email, role: convenience claims for the client
        exp:  expiry (UTC)
        iat:  issued-at (UTC)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns payload dict or None if invalid."""
    try:
        return jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Look up user by email and verify password. Returns User or None."""
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_verification_token(db: Session, user: "User") -> str:
    """Generate and persist a verification token for the given user.

    Deletes any existing tokens for this user before creating a new one
    to prevent duplicate records.
    Returns the raw 64-char hex token.
    """
    from backend.config import settings

    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id
    ).delete()

    token = EmailVerification.generate_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=settings.email_verification_expire_hours
    )
    record = EmailVerification(
        user_id=user.id,
        token=token,
        token_expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    return token


def verify_email_token(db: Session, token: str) -> "User | None":
    """Validate a verification token and mark the user as verified.

    Returns the User on success.
    Returns None if token is missing, expired, or the user no longer exists.
    Always deletes the token record on expiry or success to keep the table clean.
    """
    record = (
        db.query(EmailVerification)
        .filter(EmailVerification.token == token)
        .first()
    )
    if not record:
        return None

    now = datetime.now(timezone.utc)
    expires_at = record.token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        db.delete(record)
        db.commit()
        return None

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        db.delete(record)
        db.commit()
        return None

    user.is_verified = True
    db.delete(record)
    db.commit()
    db.refresh(user)
    return user
