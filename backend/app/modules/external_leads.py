"""External API endpoints for receiving leads from integrations (e.g., Mr. DJ)"""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.modules.crm.models import CRMLead
from app.modules.crm.service import serialize_lead
from app.modules.platform.mailer import send_email
from app.modules.templates.service import TemplateService

# Import automation features
try:
    from app.modules.automation.auto_responder import send_customer_auto_response
    from app.modules.crm.assignment import assign_lead
    AUTOMATION_ENABLED = True
except ImportError:
    AUTOMATION_ENABLED = False
    logger.warning("Automation modules not available, running without auto-responder and assignment")

logger = logging.getLogger(__name__)

router = APIRouter()

# Hardcoded notification email as requested
NOTIFICATION_EMAIL = "info@rentguy.nl"


class ExternalLeadSubmission(BaseModel):
    """Schema for external lead submission from integrations"""
    leadId: str = Field(..., description="External lead ID for deduplication")
    status: str = Field(default="new", description="Lead status")
    eventType: str | None = Field(None, description="Type of event (bruiloft, feest, etc.)")
    eventDate: str | None = Field(None, description="Event date in ISO format")
    packageId: str | None = Field(None, description="Requested package ID")
    message: str | None = Field(None, description="Lead message/notes")
    source: str = Field(..., description="Lead source (e.g., mister-dj-website)")
    contact: dict = Field(..., description="Contact information")
    persisted: bool = Field(default=False, description="Whether lead was persisted in source system")


class ExternalLeadResponse(BaseModel):
    """Response after receiving external lead"""
    success: bool
    leadId: int
    externalId: str
    status: str
    message: str
    emailSent: bool = False


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_workspace_from_header(x_rentguy_workspace: str | None = Header(None, alias="X-RentGuy-Workspace")) -> str:
    """Extract workspace from header, default to mr-dj"""
    if x_rentguy_workspace:
        return x_rentguy_workspace
    return "mr-dj"


def send_lead_notification(lead: CRMLead, payload: ExternalLeadSubmission, db: Session) -> bool:
    """Send email notification for new lead using template system"""

    logger.info(f"send_lead_notification called for lead {lead.id} to {NOTIFICATION_EMAIL}")

    try:
        # Format event date
        event_date_str = "Niet opgegeven"
        if payload.eventDate:
            try:
                event_date_str = datetime.fromisoformat(payload.eventDate.replace('Z', '+00:00')).strftime('%d-%m-%Y')
            except:
                event_date_str = payload.eventDate

        # Prepare template variables
        template_vars = {
            "client_name": lead.name,
            "client_email": lead.email,
            "client_phone": lead.phone,
            "event_type": payload.eventType or 'Niet opgegeven',
            "event_date": event_date_str,
            "package_id": payload.packageId or 'Niet opgegeven',
            "message": payload.message or 'Geen bericht opgegeven',
            "lead_id": lead.id,
            "external_id": lead.external_id,
            "status": lead.status,
            "source": payload.source,
            "workspace": lead.tenant_id,
            "received_at": datetime.now().strftime('%d-%m-%Y %H:%M:%S'),
            "crm_link": f"https://sevensa.rentguy.nl/crm/leads/{lead.id}"
        }

        # Try to get template from database
        template = TemplateService.get_template_by_type(
            db=db,
            template_type="lead_notification",
            tenant_id=lead.tenant_id,
            get_default=True
        )

        if template:
            # Use template system
            logger.info(f"Using template {template.id} ({template.name}) for lead notification")

            # Render HTML version if available
            body_html = None
            body_text = ""

            if template.content_html:
                rendered_html = TemplateService.render_template(
                    db=db,
                    template_id=template.id,
                    tenant_id=lead.tenant_id,
                    variables=template_vars,
                    format="html"
                )
                body_html = rendered_html["content"]
                subject = rendered_html["subject"] if rendered_html["subject"] else f"🎉 Nieuwe lead: {lead.name}"

            # Always render plain text version as fallback
            if template.content_text:
                rendered_text = TemplateService.render_template(
                    db=db,
                    template_id=template.id,
                    tenant_id=lead.tenant_id,
                    variables=template_vars,
                    format="text"
                )
                body_text = rendered_text["content"]
            else:
                # Generate basic plain text version
                body_text = f"""Nieuwe lead: {lead.name}
Email: {lead.email}
Telefoon: {lead.phone}
Event: {payload.eventType or 'Niet opgegeven'} op {event_date_str}
Bekijk in CRM: https://sevensa.rentguy.nl/crm/leads/{lead.id}
"""
        else:
            # Fallback to hardcoded template
            logger.warning("No template found for lead_notification, using fallback")
            subject = f"🎉 Nieuwe lead: {lead.name} ({payload.eventType or 'onbekend evenement'})"
            body_text = f"""Nieuwe lead ontvangen via Mr. DJ website!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTACTGEGEVENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Naam:           {lead.name}
Email:          {lead.email}
Telefoon:       {lead.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎪 EVENEMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type:           {payload.eventType or 'Niet opgegeven'}
Datum:          {event_date_str}
Pakket:         {payload.packageId or 'Niet opgegeven'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 BERICHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{payload.message or 'Geen bericht opgegeven'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  METADATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lead ID:        {lead.id}
External ID:    {lead.external_id}
Status:         {lead.status}
Bron:           {payload.source}
Workspace:      {lead.tenant_id}
Ontvangen:      {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 Bekijk deze lead in RentGuy CRM:
   https://sevensa.rentguy.nl/crm/leads/{lead.id}

Dit is een geautomatiseerde notificatie vanuit RentGuy CRM.
"""
            body_html = None

        logger.info(f"Sending email to {NOTIFICATION_EMAIL} with subject: {subject[:50]}...")
        logger.info(f"Email format: {'HTML + Text' if body_html else 'Text only'}")
        result = send_email(
            to_email=NOTIFICATION_EMAIL,
            subject=subject,
            body_text=body_text,
            body_html=body_html
        )
        logger.info(f"send_email returned: {result}")
        return result

    except Exception as e:
        # Log error but don't fail the lead creation
        logger.error(f"Failed to send email notification: {e}", exc_info=True)
        return False


@router.post("/leads", response_model=ExternalLeadResponse, status_code=status.HTTP_201_CREATED)
def create_external_lead(
    payload: ExternalLeadSubmission,
    db: Session = Depends(get_db),
    workspace: str = Depends(get_workspace_from_header),
):
    """
    Receive lead from external integration (e.g., Mr. DJ website).

    Supports deduplication via external_id.
    No authentication required (public endpoint for trusted integrations).
    Sends email notification to info@mr-dj.nl
    """

    # Map workspace to tenant_id
    tenant_id = workspace

    # Build full name from contact
    contact = payload.contact
    name = contact.get("name", "Unknown")
    email = contact.get("email")
    phone = contact.get("phone")

    # Check for existing lead with same external_id
    existing = db.query(CRMLead).filter(
        CRMLead.external_id == payload.leadId,
        CRMLead.tenant_id == tenant_id
    ).first()

    if existing:
        # Lead already exists - return existing lead info (no duplicate email)
        return ExternalLeadResponse(
            success=True,
            leadId=existing.id,
            externalId=existing.external_id or "",
            status=existing.status,
            message=f"Lead already exists (duplicate prevented)",
            emailSent=False
        )

    # Create new lead
    lead = CRMLead(
        tenant_id=tenant_id,
        external_id=payload.leadId,
        name=name,
        email=email,
        phone=phone,
        source=payload.source,
        status=payload.status or "new",
        event_type=payload.eventType,  # Set event type for automation routing
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Apply lead assignment rules (automation feature)
    if AUTOMATION_ENABLED:
        try:
            lead = assign_lead(lead, db)
            logger.info(f"✅ Lead assignment applied for lead {lead.id}")
        except Exception as e:
            logger.error(f"❌ Lead assignment failed: {e}", exc_info=True)

    # Send email notification to info@rentguy.nl
    email_sent = send_lead_notification(lead, payload, db)

    # Send customer auto-response email (automation feature)
    auto_response_sent = False
    if AUTOMATION_ENABLED:
        try:
            # Convert Pydantic model to dict for auto_responder function
            payload_dict = payload.dict() if hasattr(payload, 'dict') else payload.model_dump()
            auto_response_sent = send_customer_auto_response(lead, payload_dict, db)
            if auto_response_sent:
                logger.info(f"✅ Customer auto-response sent to {lead.email} for lead {lead.id}")
            else:
                logger.warning(f"⚠️ Customer auto-response failed for lead {lead.id}")
        except Exception as e:
            logger.error(f"❌ Customer auto-response error: {e}", exc_info=True)

    return ExternalLeadResponse(
        success=True,
        leadId=lead.id,
        externalId=lead.external_id or "",
        status=lead.status,
        message=f"Lead created successfully from {payload.source}",
        emailSent=email_sent
    )
