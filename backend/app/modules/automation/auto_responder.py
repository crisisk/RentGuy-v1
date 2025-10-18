"""
Auto-responder module for sending automatic customer response emails.
AI-Generated with Claude Haiku, adapted for RentGuy CRM.
Enhanced with OpenRouter AI for personalized email generation.
"""

import logging
import os
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.modules.crm.models import CRMLead
from app.modules.templates.service import TemplateService
from app.modules.platform.mailer import send_email

# Import AI email generator
try:
    from app.modules.automation.ai_email_generator import generate_personalized_email, wrap_html_email
    AI_EMAIL_ENABLED = True
except ImportError:
    AI_EMAIL_ENABLED = False
    logger.warning("AI email generator not available")

logger = logging.getLogger(__name__)

# Configuration
USE_AI_GENERATED_EMAILS = os.getenv("USE_AI_GENERATED_EMAILS", "true").lower() == "true"


def send_customer_auto_response(
    lead: CRMLead,
    payload: dict,
    db: Session
) -> bool:
    """
    Send automated customer response email after lead submission.
    Uses AI-generated personalized content when enabled, falls back to template.

    Args:
        lead: CRMLead object with customer information
        payload: Dictionary with event details (eventType, eventDate, etc.)
        db: Database session

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Validate input
        if not lead or not lead.email:
            logger.warning(f"Invalid lead or missing email for lead {lead.id if lead else 'Unknown'}")
            return False

        logger.info(f"Attempting to send auto-response to {lead.email} for lead {lead.id}")

        # Format event date if available
        event_date_str = "binnenkort"
        if payload.get('eventDate'):
            try:
                event_date = datetime.fromisoformat(payload['eventDate'].replace('Z', '+00:00'))
                event_date_str = event_date.strftime('%d %B %Y')
            except Exception:
                event_date_str = payload.get('eventDate', 'binnenkort')

        # Company details
        company_name = 'Mister DJ'
        company_email = 'info@mr-dj.nl'
        company_phone = '+31 20 123 4567'

        subject = None
        body_text = None
        body_html = None

        # Try AI-generated email first if enabled
        if USE_AI_GENERATED_EMAILS and AI_EMAIL_ENABLED:
            logger.info(f"🤖 Generating AI-personalized email for {lead.name} (lead {lead.id})")

            ai_email = generate_personalized_email(
                customer_name=lead.name or 'Geachte klant',
                event_type=payload.get('eventType', 'evenement'),
                event_date=event_date_str,
                package_requested=payload.get('packageId', 'Niet gespecificeerd'),
                message=payload.get('message', ''),
                company_name=company_name,
                company_email=company_email,
                company_phone=company_phone
            )

            if ai_email:
                subject = ai_email['subject']
                body_text = ai_email['body_text']
                # Wrap HTML in branded template
                body_html = wrap_html_email(ai_email['body_html'], company_name)
                logger.info(f"✅ AI email generated successfully for lead {lead.id}")
            else:
                logger.warning(f"⚠️ AI email generation failed, falling back to template for lead {lead.id}")

        # Fallback to template-based email if AI failed or disabled
        if not subject or not body_text:
            logger.info(f"📄 Using template-based email for lead {lead.id}")

            # Fetch customer auto-response template
            template = TemplateService.get_template_by_type(
                db=db,
                template_type="customer_auto_response",
                tenant_id=lead.tenant_id,
                get_default=True
            )

            if not template:
                logger.warning("Customer auto-response template not found, skipping")
                return False

            # Prepare template variables
            template_vars = {
                'client_name': lead.name or 'Geachte klant',
                'event_type': payload.get('eventType', 'evenement'),
                'event_date': event_date_str,
                'company_name': company_name,
                'company_email': company_email,
                'company_phone': company_phone,
                'lead_id': lead.id,
                'package_requested': payload.get('packageId', 'Niet gespecificeerd')
            }

            # Render template
            if template.content_html:
                rendered_html = TemplateService.render_template(
                    db=db,
                    template_id=template.id,
                    tenant_id=lead.tenant_id,
                    variables=template_vars,
                    format="html"
                )
                body_html = rendered_html["content"]
                subject = rendered_html["subject"] if rendered_html["subject"] else f"Bedankt voor je aanvraag - {company_name}"
            else:
                subject = f"Bedankt voor je aanvraag - {company_name}"

            # Generate plain text version
            body_text = f"""Beste {template_vars['client_name']},

Bedankt voor je aanvraag voor {template_vars['event_type']} op {event_date_str}!

We hebben je aanvraag ontvangen en nemen binnen 24 uur contact met je op om de mogelijkheden te bespreken.

Met vriendelijke groet,
{company_name}

Contact: {company_email} | {company_phone}
"""

        # Send email
        email_sent = send_email(
            to_email=lead.email,
            subject=subject,
            body_text=body_text,
            body_html=body_html
        )

        if email_sent:
            mode = "AI-generated" if (USE_AI_GENERATED_EMAILS and AI_EMAIL_ENABLED and body_html and "email-wrapper" in body_html) else "template-based"
            logger.info(f"✅ Auto-response ({mode}) sent successfully to {lead.email} for lead {lead.id}")
            return True
        else:
            logger.error(f"❌ Failed to send auto-response to {lead.email}")
            return False

    except Exception as e:
        logger.error(f"❌ Auto-response error for lead {lead.id if lead else 'Unknown'}: {str(e)}", exc_info=True)
        # Don't raise - we don't want to fail lead creation if auto-response fails
        return False


def send_team_assignment_notification(
    lead: CRMLead,
    assigned_to: str,
    db: Session
) -> bool:
    """
    Notify assigned team member about new lead.

    Args:
        lead: CRMLead object
        assigned_to: Team member identifier
        db: Database session

    Returns:
        bool: Success status
    """
    try:
        # This could be extended with actual team member email lookup
        logger.info(f"Lead {lead.id} assigned to {assigned_to}")
        # TODO: Implement team notification email
        return True
    except Exception as e:
        logger.error(f"Team notification error: {str(e)}")
        return False
