"""SQLAlchemy models for the job board module."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class JobPosting(Base):
    """Represents an open position that applicants can respond to."""

    __tablename__ = "job_postings"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", server_default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    employer_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    employer = relationship(
        "app.modules.auth.models.User", back_populates="job_postings"
    )
    applications = relationship(
        "JobApplication",
        back_populates="job_posting",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_job_postings_status", "status"),
    )


class JobApplication(Base):
    """Represents an application submitted for a job posting."""

    __tablename__ = "job_applications"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    resume_file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="submitted", server_default="submitted"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_posting_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True
    )

    applicant = relationship(
        "app.modules.auth.models.User", back_populates="job_applications"
    )
    job_posting = relationship("JobPosting", back_populates="applications")

    __table_args__ = (
        Index("ix_job_applications_status", "status"),
    )


__all__ = ["JobApplication", "JobPosting"]
