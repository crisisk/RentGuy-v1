"""
SQLAlchemy models for job board module
"""
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base

class JobPosting(Base):
    """
    Represents a job posting created by an employer
    Attributes:
        id: Unique identifier for the job posting
        title: Job title
        description: Detailed job description
        location: Work location (city/country)
        status: Current status of the job posting (open/closed)
        created_at: Timestamp of creation
        employer_id: Reference to the user who created the job
        applications: List of applications for this job
    """
    __tablename__ = "job_postings"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='open', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()')
    employer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    employer = relationship("User", back_populates="job_postings")
    applications = relationship("JobApplication", back_populates="job_posting", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_job_postings_employer_id", "employer_id"),
        Index("ix_job_postings_status", "status"),
    )

class JobApplication(Base):
    """
    Represents a job application from a user to a job posting
    Attributes:
        id: Unique identifier for the application
        resume_file_path: Path to the applicant's resume file
        status: Current status of the application
        created_at: Timestamp of application submission
        updated_at: Timestamp of last status update
        applicant_id: Reference to the applying user
        job_posting_id: Reference to the target job posting
    """
    __tablename__ = "job_applications"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    resume_file_path: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='submitted', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()')
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=datetime.utcnow)
    applicant_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    job_posting_id: Mapped[UUID] = mapped_column(ForeignKey("job_postings.id"), nullable=False)
    
    applicant = relationship("User", back_populates="job_applications")
    job_posting = relationship("JobPosting", back_populates="applications")
    
    __table_args__ = (
        Index("ix_job_applications_applicant_id", "applicant_id"),
        Index("ix_job_applications_status", "status"),
        Index("ix_job_applications_job_posting_id", "job_posting_id"),
    )