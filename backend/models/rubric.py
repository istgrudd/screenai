"""Rubric-related ORM models: Rubric and Dimension."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Rubric(Base):
    """A scoring rubric defined by the recruiter for a specific position.

    Each rubric contains multiple competency dimensions with
    weights that must sum to 1.0 (100%).
    """

    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, doc="Rubric name, e.g. 'Lab Assistant 2026'")
    position = Column(
        String(200), nullable=False, doc="Position this rubric applies to"
    )
    description = Column(Text, nullable=True, doc="Optional description of the rubric")
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)

    # --- Relationships ---
    dimensions = relationship(
        "Dimension", back_populates="rubric", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Rubric(id={self.id}, name='{self.name}', position='{self.position}')>"


class Dimension(Base):
    """A single competency dimension within a rubric.

    Example: 'Technical Skills' with weight 0.3 and indicators like
    'programming experience', 'relevant coursework', etc.
    """

    __tablename__ = "dimensions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rubric_id = Column(
        Integer, ForeignKey("rubrics.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(200), nullable=False, doc="Dimension name, e.g. 'Technical Skills'")
    weight = Column(
        Float,
        nullable=False,
        doc="Weight of this dimension (0.0 - 1.0). All weights in a rubric must sum to 1.0.",
    )
    description = Column(
        Text, nullable=True, doc="Description of what this dimension measures"
    )
    indicators = Column(
        JSON,
        nullable=True,
        doc='Concrete indicators the LLM should look for: ["programming experience", "relevant coursework"]',
    )

    # --- Relationships ---
    rubric = relationship("Rubric", back_populates="dimensions")
    scores = relationship(
        "DimensionScore", back_populates="dimension", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Dimension(id={self.id}, name='{self.name}', weight={self.weight})>"
