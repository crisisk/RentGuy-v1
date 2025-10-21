"""Pydantic schemas for the job board module."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ApplicationStatus(str, Enum):
    """Valid statuses for job applications."""

    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class JobPostingCreate(BaseModel):
    """Schema for creating a job posting."""

    title: str = Field(..., max_length=100)
    description: str = Field(..., min_length=10)
    location: str = Field(..., max_length=100)


class JobPostingUpdate(BaseModel):
    """Schema for updating an existing job posting."""

    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern=r"^(open|closed)$")


class JobPostingResponse(BaseModel):
    """Response schema for job postings."""

    id: UUID
    title: str
    description: str
    location: str
    status: str
    created_at: datetime
    updated_at: datetime
    employer_id: int

    model_config = {"from_attributes": True}


class JobApplicationCreate(BaseModel):
    """Schema for submitting a job application."""

    job_posting_id: UUID
    resume_file_path: str = Field(..., max_length=255)


class JobApplicationUpdate(BaseModel):
    """Schema for updating an existing application."""

    status: ApplicationStatus

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: ApplicationStatus) -> ApplicationStatus:
        if value == ApplicationStatus.SUBMITTED:
            raise ValueError("Cannot revert to submitted status")
        return value


class JobApplicationResponse(BaseModel):
    """Response schema for job applications."""

    id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    applicant_id: int
    job_posting_id: UUID
    resume_file_path: str

    model_config = {"from_attributes": True}
