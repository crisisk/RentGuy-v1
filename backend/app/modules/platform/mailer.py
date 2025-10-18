import smtplib, ssl
from email.message import EmailMessage
from datetime import datetime
from app.core.config import settings

def send_email(to_email: str, subject: str, body_text: str, ics_content: str | None = None):
    if not settings.SMTP_HOST or not to_email:
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email
    msg.set_content(body_text)
    if ics_content:
        msg.add_attachment(ics_content.encode("utf-8"), maintype="text", subtype="calendar", filename="booking.ics")

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls(context=context)
        if settings.SMTP_USER and settings.SMTP_PASS:
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.send_message(msg)
    return True

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
