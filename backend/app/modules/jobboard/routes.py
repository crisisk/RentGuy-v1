"""
FastAPI routes for job board operations
"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, or_
from sqlalchemy.exc import NoResultFound, IntegrityError
from app.database import get_async_session, AsyncSession
from app.modules.auth.authStore import get_current_user
from app.modules.auth.schemas import UserResponse
from .models import JobPosting, JobApplication
from .schemas import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    ApplicationStatus,
)
from .notifications import NotificationService

router = APIRouter(prefix="/jobs", tags=["jobboard"])

@router.post("/postings", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
) -> JobPostingResponse:
    """
    Create a new job posting (employers only)
    
    Args:
        job_data: Job posting data
        current_user: Authenticated user (must be employer)
        db: Async database session
    
    Returns:
        Created job posting
    
    Raises:
        HTTPException 403: If user is not an employer
    """
    if not current_user.is_employer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can create job postings"
        )
    
    new_job = JobPosting(
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        employer_id=current_user.id
    )
    
    try:
        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create job posting"
        ) from e
    
    return new_job

@router.get("/postings", response_model=list[JobPostingResponse])
async def get_job_postings(
    title: Optional[str] = Query(None, max_length=100),
    location: Optional[str] = Query(None, max_length=50),
    status: Optional[str] = Query(None, pattern='^(open|closed)$'),
    db: AsyncSession = Depends(get_async_session)
) -> list[JobPostingResponse]:
    """
    Get filtered list of job postings
    
    Args:
        title: Filter by job title (partial match)
        location: Filter by location (partial match)
        status: Filter by open/closed status
        db: Async database session
    
    Returns:
        List of matching job postings
    """
    filters = []
    if title:
        filters.append(JobPosting.title.ilike(f"%{title}%"))
    if location:
        filters.append(JobPosting.location.ilike(f"%{location}%"))
    if status:
        filters.append(JobPosting.status == status)
    
    result = await db.execute(
        select(JobPosting).where(and_(*filters)).order_by(JobPosting.created_at.desc())
    )
    postings = result.scalars().all()
    return postings

@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    application_data: JobApplicationCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
) -> JobApplicationResponse:
    """
    Apply to a job posting (applicants only)
    
    Args:
        application_data: Application data
        current_user: Authenticated user (must be applicant)
        db: Async database session
    
    Returns:
        Created job application
    
    Raises:
        HTTPException 403: If user is employer
        HTTPException 404: If job posting not found
        HTTPException 409: If duplicate application
    """
    if current_user.is_employer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employers cannot apply to jobs"
        )
    
    try:
        # Check job exists
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.id == UUID(application_data.job_posting_id))
        )
        job = job_result.scalar_one()
        
        # Check for existing application
        existing_application = await db.execute(
            select(JobApplication).where(
                and_(
                    JobApplication.applicant_id == current_user.id,
                    JobApplication.job_posting_id == job.id
                )
            )
        )
        if existing_application.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already applied to this job"
            )
        
        new_application = JobApplication(
            resume_file_path=application_data.resume_file_path,
            applicant_id=current_user.id,
            job_posting_id=job.id
        )
        
        db.add(new_application)
        await db.commit()
        await db.refresh(new_application)
    except NoResultFound as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        ) from e
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application data"
        ) from e
    
    # Send notification
    await NotificationService().send_application_submitted(new_application)
    
    return new_application

@router.patch("/applications/{application_id}/status", response_model=JobApplicationResponse)
async def update_application_status(
    application_id: UUID,
    status_data: JobApplicationUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
) -> JobApplicationResponse:
    """
    Update application status (job owner only)
    
    Args:
        application_id: Target application ID
        status_data: New status data
        current_user: Authenticated user (must be job owner)
        db: Async database session
    
    Returns:
        Updated job application
    
    Raises:
        HTTPException 403: If user is not job owner
        HTTPException 404: If application not found
    """
    try:
        result = await db.execute(
            select(JobApplication).where(JobApplication.id == application_id)
        )
        application = result.scalar_one()
        
        # Verify job ownership
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.id == application.job_posting_id)
        )
        job = job_result.scalar_one()
        
        if job.employer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this application"
            )
        
        previous_status = application.status
        application.status = status_data.status.value
        application.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(application)
    except NoResultFound as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        ) from e
    
    # Send status update notification
    await NotificationService().send_application_status_update(application, previous_status)
    
    return application

@router.get("/applications", response_model=list[JobApplicationResponse])
async def get_applications(
    job_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    status: Optional[ApplicationStatus] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
) -> list[JobApplicationResponse]:
    """
    Get filtered list of job applications
    
    Args:
        job_id: Filter by job posting ID
        user_id: Filter by applicant ID
        status: Filter by application status
        current_user: Authenticated user
        db: Async database session
    
    Returns:
        List of matching applications
    
    Raises:
        HTTPException 403: If unauthorized filter
    """
    filters = []
    
    # Security checks
    if user_id and user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' applications"
        )
    
    if job_id:
        # Verify job ownership if not admin
        if not current_user.is_admin:
            job_result = await db.execute(
                select(JobPosting).where(JobPosting.id == job_id)
            )
            job = job_result.scalar_one()
            if job.employer_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view applications for this job"
                )
        filters.append(JobApplication.job_posting_id == job_id)
    
    if user_id:
        filters.append(JobApplication.applicant_id == user_id)
    
    if status:
        filters.append(JobApplication.status == status.value)
    
    result = await db.execute(
        select(JobApplication).where(and_(*filters)).order_by(JobApplication.updated_at.desc())
    )
    applications = result.scalars().all()
    return applications