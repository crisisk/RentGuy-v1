"""
Celery Application for RentGuy CRM Automation
Handles background tasks for email notifications, lead processing, and workflow automation.
"""
from celery import Celery
from celery.schedules import crontab
import os

# Initialize Celery app
celery_app = Celery(
    'rentguy_automation',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://rentguy-redis:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://rentguy-redis:6379/0')
)

# Celery Configuration
celery_app.conf.update(
    # Task serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',

    # Timezone
    timezone='Europe/Amsterdam',
    enable_utc=True,

    # Task routing
    task_routes={
        'app.automation.tasks.lead_intake': {'queue': 'crm'},
        'app.automation.tasks.proposal_followup': {'queue': 'crm'},
        'app.automation.tasks.post_event_care': {'queue': 'crm'},
        'app.automation.tasks.send_welcome_email': {'queue': 'email'},
        'app.automation.tasks.send_proposal_email': {'queue': 'email'},
        'app.automation.tasks.send_followup_email': {'queue': 'email'},
    },

    # Task time limits
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit

    # Task retries
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={
        'master_name': 'mymaster'
    },

    # Worker configuration
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,

    # Beat schedule for periodic tasks
    beat_schedule={
        'check-stale-leads': {
            'task': 'app.automation.tasks.check_stale_leads',
            'schedule': crontab(hour='9', minute='0'),  # Every day at 9 AM
        },
        'send-daily-pipeline-report': {
            'task': 'app.automation.tasks.send_daily_pipeline_report',
            'schedule': crontab(hour='8', minute='30'),  # Every day at 8:30 AM
        },
        'cleanup-old-automation-runs': {
            'task': 'app.automation.tasks.cleanup_old_automation_runs',
            'schedule': crontab(hour='2', minute='0', day_of_week='0'),  # Every Sunday at 2 AM
        },
    },
)

# Auto-discover tasks from the tasks module
celery_app.autodiscover_tasks(['app.automation.tasks'])

@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery setup"""
    print(f'Request: {self.request!r}')
    return 'Debug task executed successfully'
