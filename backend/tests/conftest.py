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
from backend.database import init_db  # noqa: E402
import backend.models  # noqa: E402,F401 — register models with Base
from backend.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _setup_db():
    """Create all tables once for the test session."""
    init_db()
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
