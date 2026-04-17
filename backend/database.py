"""SQLAlchemy engine, session, and base model setup."""

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from backend.config import settings

# For SQLite, check_same_thread=False is required for FastAPI's
# async request handling across threads.
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a database session.

    Usage in routers:
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables defined by Base subclasses.

    Called once at application startup. Also runs lightweight in-place
    migrations to add columns that may be missing on pre-existing
    SQLite databases.
    """
    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()


_EXPECTED_COLUMNS: dict[str, dict[str, str]] = {
    "candidates": {
        "language_score": "INTEGER",
        "language_bonus": "FLOAT",
    },
}


def _run_lightweight_migrations() -> None:
    """Add missing columns to existing tables without a migration framework.

    MVP shortcut in lieu of Alembic: checks each expected column against
    the live schema and issues ALTER TABLE ADD COLUMN for any that are
    missing. Columns are always nullable so this is safe for existing rows.
    """
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in _EXPECTED_COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for col_name, col_type in columns.items():
                if col_name in existing:
                    continue
                conn.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                )
                print(f"[DB] Added column {table}.{col_name}")
