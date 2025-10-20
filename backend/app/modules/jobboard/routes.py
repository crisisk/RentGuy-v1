"""FastAPI routes for the job board module."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_current_user, get_db, require_role
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

router = APIRouter(prefix="/jobboard", tags=["Job Board"])
notification_service = NotificationService()


def _ensure_applicant(user: User) -> None:
    if user.role in {"admin", "planner"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employers cannot submit applications.",
        )


@router.post("/postings", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    payload: JobPostingCreate,
    current_user: User = Depends(require_role("admin", "planner")),
    db: Session = Depends(get_db),
) -> JobPostingResponse:
    posting = JobPosting(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        employer_id=current_user.id,
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return JobPostingResponse.model_validate(posting)


@router.get("/postings", response_model=list[JobPostingResponse])
def list_job_postings(
    status_filter: Optional[str] = Query(None, pattern=r"^(open|closed)$"),
    location: Optional[str] = Query(None, max_length=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[JobPostingResponse]:
    stmt = select(JobPosting).order_by(JobPosting.created_at.desc())
    filters = []
    if status_filter:
        filters.append(JobPosting.status == status_filter)
    if location:
        filters.append(JobPosting.location.ilike(f"%{location}%"))
    if filters:
        stmt = stmt.where(and_(*filters))
    postings = db.execute(stmt).scalars().all()
    return [JobPostingResponse.model_validate(posting) for posting in postings]


@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    payload: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobApplicationResponse:
    _ensure_applicant(current_user)

    job_posting = db.get(JobPosting, payload.job_posting_id)
    if job_posting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = db.execute(
        select(JobApplication).where(
            JobApplication.job_posting_id == job_posting.id,
            JobApplication.applicant_id == current_user.id,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already applied to this job.",
        )

    application = JobApplication(
        resume_file_path=payload.resume_file_path,
        applicant_id=current_user.id,
        job_posting_id=job_posting.id,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    notification_service.send_application_submitted(application)
    return JobApplicationResponse.model_validate(application)


@router.patch(
    "/applications/{application_id}/status",
    response_model=JobApplicationResponse,
)
def update_application_status(
    application_id: int,
    payload: JobApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "planner")),
) -> JobApplicationResponse:
    application = db.get(JobApplication, application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    job_posting = application.job_posting
    if job_posting.employer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update this application.",
        )

    previous_status = application.status
    application.status = payload.status.value
    application.updated_at = datetime.utcnow()
    db.add(application)
    db.commit()
    db.refresh(application)

    notification_service.send_application_status_update(application, previous_status)
    return JobApplicationResponse.model_validate(application)


@router.get("/applications", response_model=list[JobApplicationResponse])
def list_applications(
    job_id: Optional[int] = None,
    applicant_id: Optional[int] = None,
    status_filter: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[JobApplicationResponse]:
    filters = []

    if applicant_id is not None and applicant_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to inspect other applicants.",
        )

    if job_id is not None:
        job_posting = db.get(JobPosting, job_id)
        if job_posting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        if job_posting.employer_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorised to inspect this job's applications.",
            )
        filters.append(JobApplication.job_posting_id == job_id)

    if applicant_id is not None:
        filters.append(JobApplication.applicant_id == applicant_id)
    if status_filter is not None:
        filters.append(JobApplication.status == status_filter.value)

    stmt = select(JobApplication).order_by(JobApplication.updated_at.desc())
    if filters:
        stmt = stmt.where(and_(*filters))

    applications = db.execute(stmt).scalars().all()
    return [JobApplicationResponse.model_validate(application) for application in applications]


__all__ = ["router"]
