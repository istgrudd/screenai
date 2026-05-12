"""Authentication router — register, login, logout, current user.

Endpoints:
    POST /api/auth/register  — Public; creates a candidate account.
    POST /api/auth/login     — Public; returns a JWT.
    POST /api/auth/logout    — Auth; client-side token discard.
    GET  /api/auth/me        — Auth; return current user's profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User, UserRole
from backend.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_verification_token,
    verify_email_token,
)
from backend.services.email_service import send_verification_email
from backend.utils.security import hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    @classmethod
    def from_user(cls, user: User) -> "UserOut":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            is_active=user.is_active,
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new candidate account. Role is always 'candidate'."""
    email = payload.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_verification_token(db, user)
    send_verification_email(user.email, user.full_name, token)

    return {
        "success": True,
        "data": {
            "message": "Registrasi berhasil. Cek email kamu untuk verifikasi akun.",
            "email": user.email,
        },
        "error": None,
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT."""
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email belum diverifikasi. Cek inbox kamu atau minta kirim ulang.",
        )

    token = create_access_token(user)
    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": UserOut.from_user(user).model_dump(),
        },
        "error": None,
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint.

    JWTs are stateless, so logout is handled client-side by discarding the
    token. This endpoint exists to let the client signal intent and to
    reserve a hook for future token-revocation (e.g. blacklist).
    """
    return {
        "success": True,
        "data": {"message": "Logged out"},
        "error": None,
    }


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email address using the token from the verification link.

    Called when the candidate clicks the link in their verification email.
    On success, the account becomes active and the candidate can log in.
    """
    user = verify_email_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token verifikasi tidak valid atau sudah kadaluarsa.",
        )
    return {
        "success": True,
        "data": {"message": "Email berhasil diverifikasi. Silakan login."},
        "error": None,
    }


@router.post("/resend-verification")
def resend_verification(
    payload: ResendVerificationRequest, db: Session = Depends(get_db)
):
    """Resend the verification email.

    Accepts email only (no password required) to lower friction.
    Always returns 200 regardless of whether the email exists —
    this prevents email enumeration attacks.
    """
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not user.is_active:
        return {
            "success": True,
            "data": {
                "message": "Jika email terdaftar, link verifikasi telah dikirim ulang."
            },
            "error": None,
        }

    if user.is_verified:
        return {
            "success": True,
            "data": {"message": "Email sudah terverifikasi. Silakan login."},
            "error": None,
        }

    token = create_verification_token(db, user)
    send_verification_email(user.email, user.full_name, token)

    return {
        "success": True,
        "data": {
            "message": "Jika email terdaftar, link verifikasi telah dikirim ulang."
        },
        "error": None,
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return {
        "success": True,
        "data": UserOut.from_user(current_user).model_dump(),
        "error": None,
    }
