"""Demo Mode ORM model: DemoSubmission.

Stores the result of a public, auth-less demo evaluation in a table that
is kept SEPARATE from real candidates. Rows are short-lived: a background
task auto-purges submissions older than `settings.demo_purge_minutes`, and
the uploaded CV file is never persisted (it is deleted right after
evaluation).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _generate_demo_id() -> str:
    """Generate a short demo identifier like 'DEMO-a1b2c3d4'."""
    return f"DEMO-{uuid.uuid4().hex[:8]}"


class DemoSubmission(Base):
    """A single demo-mode CV evaluation.

    Intentionally decoupled from the Candidate/Document/DimensionScore
    models so demo traffic never mixes with real applicant data. The
    recruiter ranking surfaces these rows via a UNION in list_candidates.
    """

    __tablename__ = "demo_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anonymous_id = Column(
        String(20), unique=True, nullable=False, default=_generate_demo_id
    )
    display_name = Column(
        String(120),
        nullable=False,
        default="Pengunjung Pameran",
        doc="Visitor-supplied name (optional) shown on the recruiter ranking",
    )
    position_id = Column(
        Integer, nullable=False, doc="Hardcoded demo position id (see demo_positions)"
    )
    rubric_id = Column(
        Integer,
        nullable=True,
        doc="Rubric used for scoring (resolved from position_id)",
    )

    composite_score = Column(Float, nullable=True, doc="Weighted total score (0-100)")
    dimension_scores_json = Column(
        JSON, nullable=True, doc="Per-dimension breakdown: [{dimension, score, weight, weighted_score}]"
    )
    entities_json = Column(
        JSON, nullable=True, doc="IndoBERT NER entities: [{text, label, replacement}]"
    )
    sections_json = Column(
        JSON, nullable=True, doc="Detected CV sections (education/experience/skills/...)"
    )
    profile_summary = Column(Text, nullable=True, doc="Full LLM narrative summary")
    explanation = Column(
        Text, nullable=True, doc="Short 2-4 sentence AI explanation shown in the demo UI"
    )

    status = Column(String(20), nullable=False, default="scored")
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    def __repr__(self) -> str:
        return (
            f"<DemoSubmission(id={self.id}, anon='{self.anonymous_id}', "
            f"score={self.composite_score})>"
        )
