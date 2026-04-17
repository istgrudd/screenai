"""Password hashing helpers (bcrypt)."""

import bcrypt


def hash_password(password: str) -> str:
    """Return a bcrypt hash for the given plaintext password."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed.encode("utf-8"),
    )
