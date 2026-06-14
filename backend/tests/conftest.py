"""Pytest fixtures for the demo-mode tests.

Uses an isolated temp SQLite database so tests never touch real data.
The DATABASE_URL env var is set BEFORE any backend module is imported so
the Settings singleton picks it up.
"""

import os
import tempfile

# --- Isolate the database before importing backend ---
# Unique per process so a lingering handle from a previous run can't block us.
_TEST_DB = os.path.join(tempfile.gettempdir(), f"screenai_demo_test_{os.getpid()}.db")
if os.path.exists(_TEST_DB):
    try:
        os.remove(_TEST_DB)
    except OSError:
        pass
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB}"
os.environ["DEMO_MODE"] = "false"  # individual tests flip this via fixture

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.config import settings  # noqa: E402
from backend.database import init_db, SessionLocal  # noqa: E402
import backend.models  # noqa: E402,F401 — register models with Base
from backend.models.rubric import Rubric, Dimension  # noqa: E402
from backend.models.demo_submission import DemoSubmission  # noqa: E402
from backend.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _setup_db():
    """Create all tables once for the test session."""
    init_db()
    yield


@pytest.fixture(autouse=True)
def _clean_tables():
    """Start every test from a clean rubric/demo state.

    The demo source of truth is the rubrics table, so tests must not leak
    rubrics into each other. ``/positions`` / ``ensure_demo_rubrics`` re-seed
    the two defaults on demand, keeping each test reset-safe.
    """
    db = SessionLocal()
    try:
        db.query(DemoSubmission).delete()
        db.query(Dimension).delete()
        db.query(Rubric).delete()
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture()
def client():
    """A plain TestClient (lifespan not required for these endpoint tests)."""
    return TestClient(app)


@pytest.fixture()
def demo_enabled():
    """Enable demo mode for the duration of a test, then restore."""
    original = settings.demo_mode
    settings.demo_mode = True
    yield
    settings.demo_mode = original
