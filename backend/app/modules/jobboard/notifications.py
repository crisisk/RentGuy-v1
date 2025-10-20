"""Notification helpers for the job board module."""

from __future__ import annotations

import logging

from .models import JobApplication

logger = logging.getLogger(__name__)


class NotificationService:
    """Dispatch lightweight notifications for job board events."""

    def send_email(self, recipient: str, subject: str, body: str) -> None:
        """Send an e-mail notification.

        In production this would integrate with the configured mailer. During
        development we log the payload so the behaviour remains observable.
        """

        logger.info("Email sent", extra={"to": recipient, "subject": subject, "body": body})

    def create_in_app_notification(self, user_id: int, message: str) -> None:
        """Persist an in-app notification placeholder."""

        logger.info("In-app notification", extra={"user_id": user_id, "message": message})

    def send_application_submitted(self, application: JobApplication) -> None:
        """Notify the employer about a newly submitted application."""

        subject = "New job application received"
        body = (
            f"You have a new application for {application.job_posting.title} "
            f"from {application.applicant.email}."
        )
        self.send_email(application.job_posting.employer.email, subject, body)

    def send_application_status_update(
        self, application: JobApplication, previous_status: str | None = None
    ) -> None:
        """Notify the applicant about a status change."""

        if previous_status == application.status:
            return

        subject = "Your job application status changed"
        body = (
            f"Your application for {application.job_posting.title} changed from "
            f"{previous_status or 'submitted'} to {application.status}."
        )
        self.send_email(application.applicant.email, subject, body)
        self.create_in_app_notification(application.applicant_id, body)


__all__ = ["NotificationService"]
