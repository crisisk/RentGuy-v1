"""FastAPI routes for job board operations."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_async_session
from app.modules.auth.deps import get_current_user
from app.modules.auth.models import User

from .models import JobApplication, JobPosting
from .notifications import NotificationService
from .schemas import (
    ApplicationStatus,
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationUpdate,
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
)

router = APIRouter(prefix="/jobs", tags=["jobboard"])


@router.post("/postings", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> JobPostingResponse:
    """Create a new job posting (employers only)."""

    if not current_user.is_employer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only planner or admin roles can create job postings",
        )

    job = JobPosting(
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        employer_id=current_user.id,
    )

    db.add(job)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create job posting",
        ) from exc

    await db.refresh(job)
    return job


@router.get("/postings", response_model=list[JobPostingResponse])
async def get_job_postings(
    title: Optional[str] = Query(None, max_length=100),
    location: Optional[str] = Query(None, max_length=100),
    status_filter: Optional[str] = Query(None, pattern=r"^(open|closed)$"),
    db: AsyncSession = Depends(get_async_session),
) -> list[JobPostingResponse]:
    """Retrieve a filtered list of job postings."""

    query = select(JobPosting)
    if title:
        query = query.where(JobPosting.title.ilike(f"%{title}%"))
    if location:
        query = query.where(JobPosting.location.ilike(f"%{location}%"))
    if status_filter:
        query = query.where(JobPosting.status == status_filter)

    result = await db.execute(query.order_by(JobPosting.created_at.desc()))
    return result.scalars().all()


@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    application_data: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> JobApplicationResponse:
    """Apply to a job posting (applicants only)."""

    if not current_user.is_applicant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Current role is not permitted to submit applications",
        )

    try:
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.id == application_data.job_posting_id)
        )
        job = job_result.scalar_one()
    except NoResultFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        ) from exc

    existing_result = await db.execute(
        select(JobApplication).where(
            JobApplication.applicant_id == current_user.id,
            JobApplication.job_posting_id == job.id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already applied to this job",
        )

    new_application = JobApplication(
        resume_file_path=application_data.resume_file_path,
        applicant_id=current_user.id,
        job_posting_id=job.id,
    )
    db.add(new_application)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application data",
        ) from exc

    await db.refresh(new_application)
    notifications = NotificationService(db)
    await notifications.send_application_submitted(new_application)
    return new_application


@router.patch("/applications/{application_id}/status", response_model=JobApplicationResponse)
async def update_application_status(
    application_id: UUID,
    status_data: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> JobApplicationResponse:
    """Update an application status (job owner only)."""

    result = await db.execute(
        select(JobApplication)
        .options(
            selectinload(JobApplication.job_posting),
        )
        .where(JobApplication.id == application_id)
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    job_result = await db.execute(
        select(JobPosting).where(JobPosting.id == application.job_posting_id)
    )
    job = job_result.scalar_one()
    if not (current_user.is_admin or job.employer_id == current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this application",
        )

    previous_status = application.status
    application.status = status_data.status.value
    application.updated_at = datetime.utcnow()

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update application status",
        ) from exc

    await db.refresh(application)
    notifications = NotificationService(db)
    await notifications.send_application_status_update(application, previous_status)
    return application


@router.get("/applications", response_model=list[JobApplicationResponse])
async def get_applications(
    job_id: Optional[UUID] = None,
    user_id: Optional[int] = None,
    status_filter: Optional[ApplicationStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> list[JobApplicationResponse]:
    """Retrieve job applications filtered by job, user, or status."""

    query = select(JobApplication)

    if user_id is not None and user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applications for other users",
        )

    if job_id is not None:
        job_result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
        job = job_result.scalar_one_or_none()
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
        if not (current_user.is_admin or job.employer_id == current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view applications for this job",
            )
        query = query.where(JobApplication.job_posting_id == job_id)

    if user_id is not None:
        query = query.where(JobApplication.applicant_id == user_id)

    if status_filter is not None:
        query = query.where(JobApplication.status == status_filter.value)

    result = await db.execute(query.order_by(JobApplication.updated_at.desc()))
    return result.scalars().all()
