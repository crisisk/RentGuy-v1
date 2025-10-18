import smtplib, ssl
import logging
from email.message import EmailMessage
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body_text: str, body_html: str | None = None, ics_content: str | None = None):
    """
    Send email with optional HTML content.

    Args:
        to_email: Recipient email address
        subject: Email subject
        body_text: Plain text version of email
        body_html: Optional HTML version of email
        ics_content: Optional calendar attachment
    """
    if not settings.SMTP_HOST or not to_email:
        logger.warning(f"Skipping email - SMTP_HOST={settings.SMTP_HOST}, to_email={to_email}")
        return False

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        # Set plain text content
        msg.set_content(body_text)

        # Add HTML alternative if provided
        if body_html:
            msg.add_alternative(body_html, subtype='html')

        if ics_content:
            msg.add_attachment(ics_content.encode("utf-8"), maintype="text", subtype="calendar", filename="booking.ics")

        context = ssl.create_default_context()

        logger.info(f"Sending email to {to_email} from {settings.MAIL_FROM}")
        logger.info(f"Subject: {subject[:50]}...")
        logger.info(f"SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}")

        # Use SMTP_SSL for port 465, regular SMTP with starttls for 587
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context) as server:
                if settings.SMTP_USER and settings.SMTP_PASS:
                    server.login(settings.SMTP_USER, settings.SMTP_PASS)
                result = server.send_message(msg)
                logger.info(f"Email sent successfully via SSL (port 465). Result: {result}")
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                server.starttls(context=context)
                if settings.SMTP_USER and settings.SMTP_PASS:
                    server.login(settings.SMTP_USER, settings.SMTP_PASS)
                result = server.send_message(msg)
                logger.info(f"Email sent successfully via STARTTLS (port 587). Result: {result}")

        return True
    except Exception as e:
        logger.error(f"ERROR sending email: {type(e).__name__}: {e}", exc_info=True)
        return False

def make_ics(uid: str, dtstart: datetime, dtend: datetime, summary: str, description: str) -> str:
    # Basic ICS file (UTC; consumers will convert)
    def fmt(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%SZ")
    return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rentguyapp//EN
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{fmt(datetime.utcnow())}
DTSTART:{fmt(dtstart)}
DTEND:{fmt(dtend)}
SUMMARY:{summary}
DESCRIPTION:{description}
END:VEVENT
END:VCALENDAR
"""
