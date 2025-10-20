"""Pydantic schemas for the job board API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApplicationStatus(str, Enum):
    """Valid workflow states for job applications."""

    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class JobPostingCreate(BaseModel):
    """Payload for creating job postings."""

    title: str = Field(..., max_length=100)
    description: str = Field(..., min_length=10)
    location: str = Field(..., max_length=50)


class JobPostingUpdate(BaseModel):
    """Payload for updating job postings."""

    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, pattern=r"^(open|closed)$")


class UserSummary(BaseModel):
    """Lightweight representation of an auth user."""

    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)


class JobPostingResponse(BaseModel):
    """API response model for job postings."""

    id: int
    title: str
    description: str
    location: str
    status: str
    created_at: datetime
    employer: UserSummary

    model_config = ConfigDict(from_attributes=True)


class JobApplicationCreate(BaseModel):
    """Payload for submitting job applications."""

    job_posting_id: int
    resume_file_path: str = Field(..., max_length=200)


class JobApplicationUpdate(BaseModel):
    """Payload for updating the status of an application."""

    status: ApplicationStatus

    @field_validator("status")
    @classmethod
    def validate_transition(cls, value: ApplicationStatus) -> ApplicationStatus:
        if value == ApplicationStatus.SUBMITTED:
            raise ValueError("Status cannot be changed back to submitted")
        return value


class JobApplicationResponse(BaseModel):
    """Response payload for job applications."""

    id: int
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    resume_file_path: str
    applicant: UserSummary
    job_posting: JobPostingResponse

    model_config = ConfigDict(from_attributes=True)


__all__ = [
    "ApplicationStatus",
    "JobPostingCreate",
    "JobPostingUpdate",
    "JobPostingResponse",
    "JobApplicationCreate",
    "JobApplicationUpdate",
    "JobApplicationResponse",
    "UserSummary",
]
