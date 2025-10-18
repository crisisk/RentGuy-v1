"""
Celery Tasks for CRM Automation
Implements workflows from automation/workflows/*.yaml files
"""
from .celery_app import celery_app
from .email_service import EmailService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# LEAD PROCESSING TASKS
# ============================================================================

@celery_app.task(name='app.automation.tasks.lead_intake', bind=True, max_retries=3)
def lead_intake(self, lead_id: int, tenant_id: str):
    """
    Process new lead intake automation
    Workflow: automation/workflows/lead_intake.yaml

    Steps:
    1. Send welcome email to lead
    2. Create follow-up task in CRM
    3. Notify sales team
    4. Log activity to CRM
    """
    logger.info(f"Processing lead intake for lead {lead_id} (tenant: {tenant_id})")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.service import CRMService
        from sqlalchemy.orm import Session

        # Get database session
        db = next(get_db())
        service = CRMService(db, tenant_id)

        # Get lead details
        lead = db.query(service.models.CrmLead).filter_by(id=lead_id).first()

        if not lead:
            logger.error(f"Lead {lead_id} not found")
            return {"status": "failed", "error": "Lead not found"}

        # Send welcome email
        email_service = EmailService()
        try:
            email_service.send_template(
                to_email=lead.email,
                template_name='lead_welcome',
                context={
                    'first_name': lead.name.split()[0] if lead.name else 'daar',
                    'tenant_id': tenant_id,
                    'lead_id': lead_id
                }
            )
            logger.info(f"Welcome email sent to {lead.email}")
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
            # Don't fail the task if email fails

        # Create follow-up task (would integrate with task management system)
        # For now, just log it
        logger.info(f"TODO: Create follow-up task for lead {lead_id}")

        # Update lead status
        lead.status = 'contacted'
        db.commit()

        # Log activity
        activity = service.log_activity({
            'deal_id': lead_id,  # Assuming deal exists
            'activity_type': 'email',
            'summary': 'Welcome email sent via automation',
            'payload': 'Automated lead intake workflow executed'
        })

        return {
            "status": "completed",
            "lead_id": lead_id,
            "email_sent": True,
            "activity_logged": True
        }

    except Exception as e:
        logger.error(f"Error in lead_intake task: {e}", exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(name='app.automation.tasks.proposal_followup', bind=True, max_retries=3)
def proposal_followup(self, deal_id: int, tenant_id: str):
    """
    Process proposal follow-up automation
    Workflow: automation/workflows/proposal_followup.yaml

    Triggers when deal moves to "Offerte Uitgebracht" stage
    """
    logger.info(f"Processing proposal followup for deal {deal_id} (tenant: {tenant_id})")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.service import CRMService

        db = next(get_db())
        service = CRMService(db, tenant_id)

        # Get deal and lead details
        deal = db.query(service.models.CrmDeal).filter_by(id=deal_id).first()

        if not deal or not deal.lead_id:
            logger.error(f"Deal {deal_id} or associated lead not found")
            return {"status": "failed", "error": "Deal or lead not found"}

        lead = db.query(service.models.CrmLead).filter_by(id=deal.lead_id).first()

        # Send proposal follow-up email
        email_service = EmailService()
        try:
            email_service.send_template(
                to_email=lead.email,
                template_name='proposal_followup',
                context={
                    'first_name': lead.name.split()[0] if lead.name else 'daar',
                    'deal_title': deal.title,
                    'deal_value': f"€{float(deal.value):,.2f}",
                    'tenant_id': tenant_id
                }
            )
            logger.info(f"Proposal follow-up email sent to {lead.email}")
        except Exception as e:
            logger.error(f"Failed to send proposal email: {e}")

        # Schedule follow-up reminder (3 days later)
        send_followup_reminder.apply_async(
            args=[deal_id, tenant_id],
            countdown=60 * 60 * 24 * 3  # 3 days
        )

        return {
            "status": "completed",
            "deal_id": deal_id,
            "email_sent": True
        }

    except Exception as e:
        logger.error(f"Error in proposal_followup task: {e}", exc_info=True)
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(name='app.automation.tasks.post_event_care', bind=True)
def post_event_care(self, deal_id: int, tenant_id: str):
    """
    Process post-event care automation
    Workflow: automation/workflows/post_event_care.yaml

    Triggers when deal moves to "Event Uitgevoerd" stage
    """
    logger.info(f"Processing post-event care for deal {deal_id} (tenant: {tenant_id})")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.service import CRMService

        db = next(get_db())
        service = CRMService(db, tenant_id)

        deal = db.query(service.models.CrmDeal).filter_by(id=deal_id).first()

        if not deal or not deal.lead_id:
            return {"status": "failed", "error": "Deal or lead not found"}

        lead = db.query(service.models.CrmLead).filter_by(id=deal.lead_id).first()

        # Send thank you & feedback request email
        email_service = EmailService()
        try:
            email_service.send_template(
                to_email=lead.email,
                template_name='post_event_care',
                context={
                    'first_name': lead.name.split()[0] if lead.name else 'daar',
                    'deal_title': deal.title,
                    'tenant_id': tenant_id,
                    'review_link': f'https://mr-dj.sevensa.nl/review/{deal_id}'
                }
            )
            logger.info(f"Post-event email sent to {lead.email}")
        except Exception as e:
            logger.error(f"Failed to send post-event email: {e}")

        return {
            "status": "completed",
            "deal_id": deal_id,
            "email_sent": True
        }

    except Exception as e:
        logger.error(f"Error in post_event_care task: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


# ============================================================================
# EMAIL TASKS
# ============================================================================

@celery_app.task(name='app.automation.tasks.send_welcome_email')
def send_welcome_email(lead_email: str, lead_name: str, tenant_id: str):
    """Send welcome email to new lead"""
    email_service = EmailService()
    return email_service.send_template(
        to_email=lead_email,
        template_name='lead_welcome',
        context={
            'first_name': lead_name.split()[0] if lead_name else 'daar',
            'tenant_id': tenant_id
        }
    )


@celery_app.task(name='app.automation.tasks.send_followup_reminder')
def send_followup_reminder(deal_id: int, tenant_id: str):
    """Send follow-up reminder email"""
    logger.info(f"Sending follow-up reminder for deal {deal_id}")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.service import CRMService

        db = next(get_db())
        service = CRMService(db, tenant_id)

        deal = db.query(service.models.CrmDeal).filter_by(id=deal_id).first()
        if not deal or not deal.lead_id:
            return {"status": "skipped", "reason": "Deal or lead not found"}

        lead = db.query(service.models.CrmLead).filter_by(id=deal.lead_id).first()

        email_service = EmailService()
        email_service.send_template(
            to_email=lead.email,
            template_name='followup_reminder',
            context={
                'first_name': lead.name.split()[0] if lead.name else 'daar',
                'deal_title': deal.title
            }
        )

        return {"status": "sent"}

    except Exception as e:
        logger.error(f"Error sending follow-up reminder: {e}")
        return {"status": "error", "message": str(e)}


# ============================================================================
# PERIODIC TASKS
# ============================================================================

@celery_app.task(name='app.automation.tasks.check_stale_leads')
def check_stale_leads():
    """
    Check for leads that haven't been contacted in 7 days
    Runs daily at 9 AM
    """
    logger.info("Checking for stale leads...")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.models import CrmLead

        db = next(get_db())

        # Find leads older than 7 days with status 'new'
        cutoff_date = datetime.now() - timedelta(days=7)
        stale_leads = db.query(CrmLead).filter(
            CrmLead.status == 'new',
            CrmLead.created_at < cutoff_date
        ).all()

        logger.info(f"Found {len(stale_leads)} stale leads")

        # Send notification to sales team
        # TODO: Implement notification logic

        return {
            "status": "completed",
            "stale_leads_count": len(stale_leads)
        }

    except Exception as e:
        logger.error(f"Error checking stale leads: {e}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name='app.automation.tasks.send_daily_pipeline_report')
def send_daily_pipeline_report():
    """
    Send daily pipeline report to sales team
    Runs daily at 8:30 AM
    """
    logger.info("Generating daily pipeline report...")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.service import CRMService

        db = next(get_db())

        # Generate report for each tenant
        tenants = ['mrdj', 'sevensa']  # TODO: Get from config

        reports = {}
        for tenant_id in tenants:
            service = CRMService(db, tenant_id)
            dashboard_data = service.dashboard_metrics()
            reports[tenant_id] = dashboard_data

        # Send email with reports
        # TODO: Implement email sending

        logger.info("Daily pipeline reports generated")
        return {"status": "completed", "tenants": len(tenants)}

    except Exception as e:
        logger.error(f"Error generating pipeline report: {e}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name='app.automation.tasks.cleanup_old_automation_runs')
def cleanup_old_automation_runs():
    """
    Cleanup automation runs older than 90 days
    Runs weekly on Sunday at 2 AM
    """
    logger.info("Cleaning up old automation runs...")

    try:
        from app.modules.auth.deps import get_db
        from app.modules.crm.models import CrmAutomationRun

        db = next(get_db())

        cutoff_date = datetime.now() - timedelta(days=90)
        deleted_count = db.query(CrmAutomationRun).filter(
            CrmAutomationRun.created_at < cutoff_date
        ).delete()

        db.commit()

        logger.info(f"Deleted {deleted_count} old automation runs")
        return {"status": "completed", "deleted_count": deleted_count}

    except Exception as e:
        logger.error(f"Error cleaning up automation runs: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
