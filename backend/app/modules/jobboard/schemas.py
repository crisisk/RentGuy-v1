"""
Pydantic schemas for job board module
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator
from app.modules.auth.schemas import UserResponse

class ApplicationStatus(str, Enum):
    """Valid statuses for job applications"""
    SUBMITTED = 'submitted'
    UNDER_REVIEW = 'under_review'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'

class JobPostingCreate(BaseModel):
    """Schema for creating a job posting"""
    title: str = Field(..., max_length=100)
    description: str
    location: str = Field(..., max_length=50)
    
class JobPostingUpdate(BaseModel):
    """Schema for updating a job posting"""
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, pattern='^(open|closed)$')

class JobPostingResponse(BaseModel):
    """Response schema for job postings"""
    id: str
    title: str
    description: str
    location: str
    status: str
    created_at: datetime
    employer: UserResponse
    
    class Config:
        orm_mode = True

class JobApplicationCreate(BaseModel):
    """Schema for submitting a job application"""
    job_posting_id: str
    resume_file_path: str = Field(..., max_length=200)

class JobApplicationUpdate(BaseModel):
    """Schema for updating a job application"""
    status: ApplicationStatus
    
    @validator('status')
    def validate_status(cls, value):
        """Ensure valid status transition"""
        if value == ApplicationStatus.SUBMITTED:
            raise ValueError('Cannot revert to submitted status')
        return value

class JobApplicationResponse(BaseModel):
    """Response schema for job applications"""
    id: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    applicant: UserResponse
    job_posting: JobPostingResponse
    resume_file_path: str
    
    class Config:
        orm_mode = True