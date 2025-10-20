"""Database models for the job board module."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class JobPosting(Base):
    """Job opportunities published by internal employers."""

    __tablename__ = "jobboard_postings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    employer_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    employer: Mapped["User"] = relationship("User", back_populates="job_postings")
    applications: Mapped[list["JobApplication"]] = relationship(
        "JobApplication",
        back_populates="job_posting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class JobApplication(Base):
    """Applications submitted by crew members for published jobs."""

    __tablename__ = "jobboard_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_file_path: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="submitted", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_posting_id: Mapped[int] = mapped_column(
        ForeignKey("jobboard_postings.id", ondelete="CASCADE"), nullable=False, index=True
    )

    applicant: Mapped["User"] = relationship("User", back_populates="job_applications")
    job_posting: Mapped[JobPosting] = relationship("JobPosting", back_populates="applications")


__all__ = ["JobPosting", "JobApplication"]
