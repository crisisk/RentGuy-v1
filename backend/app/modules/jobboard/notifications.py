"""Notification service for job board events."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import JobApplication, JobPosting


class NotificationService:
    """Handles outbound notifications for job application events."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def _load_application(self, application: JobApplication) -> JobApplication:
        """Ensure relationships are loaded before accessing them."""

        if (
            "job_posting" in application.__dict__
            and application.__dict__["job_posting"] is not None
            and "applicant" in application.__dict__
            and application.__dict__["applicant"] is not None
        ):
            return application

        result = await self._db.execute(
            select(JobApplication)
            .options(
                selectinload(JobApplication.job_posting).selectinload(JobPosting.employer),
                selectinload(JobApplication.applicant),
            )
            .where(JobApplication.id == application.id)
        )
        return result.scalar_one()

    async def send_email(self, recipient: str, subject: str, body: str) -> None:
        """Send email notification (placeholder implementation)."""

        # In production this would be replaced by the mailer integration. The
        # print is kept to assist when running tests locally.
        print(f"Email sent to {recipient}: {subject}")

    async def create_in_app_notification(self, user_id: int, message: str) -> None:
        """Create an in-app notification (placeholder implementation)."""

        print(f"In-app notification for {user_id}: {message}")

    async def send_application_submitted(self, application: JobApplication) -> None:
        """Notify the employer about a new application."""

        application = await self._load_application(application)
        employer = getattr(application.job_posting, "employer", None)
        if employer is None or not getattr(employer, "email", None):
            return

        subject = "New Job Application Received"
        body = f"You have a new application for {application.job_posting.title}"

        await self.send_email(employer.email, subject, body)

    async def send_application_status_update(
        self,
        application: JobApplication,
        previous_status: Optional[str] = None,
    ) -> None:
        """Notify the applicant about a status change."""

        if previous_status is not None and application.status == previous_status:
            return

        application = await self._load_application(application)
        applicant = getattr(application, "applicant", None)
        if applicant is None or not getattr(applicant, "email", None):
            return

        subject = "Application Status Updated"
        body = (
            f"Your application for {application.job_posting.title} "
            f"has changed from {previous_status or 'submitted'} to {application.status}"
        )

        await self.send_email(applicant.email, subject, body)

        message = (
            f"Your application status for {application.job_posting.title} "
            f"updated to {application.status}"
        )
        await self.create_in_app_notification(applicant.id, message)


__all__ = ["NotificationService"]
