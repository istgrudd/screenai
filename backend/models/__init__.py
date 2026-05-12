"""ORM models for the recruitment screening system.

Importing this package ensures all models are registered with
SQLAlchemy's Base so that init_db() can create the tables.
"""

from backend.models.candidate import Candidate, Document, DimensionScore  # noqa: F401
from backend.models.rubric import Rubric, Dimension  # noqa: F401
from backend.models.user import User, UserRole  # noqa: F401
from backend.models.email_verification import EmailVerification  # noqa: F401
