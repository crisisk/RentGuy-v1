"""
Email Service for RentGuy CRM
Handles email sending with templates using SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from jinja2 import Template
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails with template support"""

    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('EMAIL_FROM', 'noreply@mr-dj.nl')

        # Check if SMTP is configured
        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP credentials not configured, emails will not be sent")
            self._enabled = False
        else:
            self._enabled = True

    def send_template(self, to_email: str, template_name: str, context: dict):
        """
        Send email using a template

        Args:
            to_email: Recipient email address
            template_name: Name of the template to use
            context: Dict of variables to render in template

        Returns:
            dict: Status of email sending
        """
        if not self._enabled:
            logger.info(f"SMTP not configured, would send email to {to_email} with template {template_name}")
            return {"status": "skipped", "reason": "SMTP not configured"}

        from .email_templates import EMAIL_TEMPLATES

        template = EMAIL_TEMPLATES.get(template_name)
        if not template:
            raise ValueError(f"Template {template_name} not found")

        # Render template
        subject = Template(template['subject']).render(**context)
        html_body = Template(template['html']).render(**context)
        text_body = Template(template.get('text', '')).render(**context)

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.from_email
        msg['To'] = to_email

        # Attach text and HTML parts
        if text_body:
            msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email} (template: {template_name})")
            return {"status": "sent", "to": to_email, "template": template_name}

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {"status": "failed", "error": str(e)}

    def send_plain(self, to_email: str, subject: str, body: str):
        """
        Send plain text email

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (plain text)

        Returns:
            dict: Status of email sending
        """
        if not self._enabled:
            logger.info(f"SMTP not configured, would send email to {to_email}")
            return {"status": "skipped", "reason": "SMTP not configured"}

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = self.from_email
        msg['To'] = to_email

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return {"status": "sent", "to": to_email}

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {"status": "failed", "error": str(e)}
