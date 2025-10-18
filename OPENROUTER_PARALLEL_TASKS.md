# 🚀 OpenRouter Parallel Execution Tasks
## RentGuy ↔ Mr-DJ Integration - Remaining Tasks

**Date**: 2025-10-18
**Priority**: High
**Execution Mode**: Parallel (alle taken tegelijk)
**Estimated Total Time**: 2-3 uur (parallel) vs 6-8 uur (sequential)

---

## 📋 TASK OVERVIEW

| Task ID | Task Name | Priority | Time Est. | Dependencies |
|---------|-----------|----------|-----------|--------------|
| T1 | ContactForm Integration | HIGH | 30 min | None |
| T2 | Celery Worker Setup | HIGH | 45 min | None |
| T3 | Email Templates Config | HIGH | 30 min | T2 |
| T4 | reCAPTCHA v3 Integration | MEDIUM | 20 min | T1 |
| T5 | WhatsApp Business API | MEDIUM | 45 min | None |
| T6 | MS 365 Calendar Sync | MEDIUM | 45 min | None |
| T7 | Metabase Dashboards | LOW | 60 min | None |
| T8 | Sentry Error Tracking | LOW | 20 min | None |

**Total Tasks**: 8
**Can Run in Parallel**: 6 (T1, T2, T5, T6, T7, T8)
**Sequential Dependencies**: T3 depends on T2, T4 depends on T1

---

## 🎯 TASK 1: ContactForm Integration (HIGH PRIORITY)

### Objective
Integreer ContactForm.jsx in de mr-dj.sevensa.nl website homepage en contact pagina.

### Current Status
- ✅ Component gemaakt: `/srv/apps/mr-djv1/ContactForm.jsx`
- ✅ API endpoint getest en werkend
- ❌ Nog niet geïntegreerd in website

### Implementation Steps

**1.1 Find main website files**
```bash
cd /srv/apps/mr-djv1
find . -name "*.jsx" -o -name "*.html" -o -name "index.*" | grep -v node_modules
```

**1.2 Update App.jsx or main entry point**
```jsx
// Add to imports
import ContactForm from './ContactForm';

// Add route or section
<section id="contact">
  <ContactForm />
</section>
```

**1.3 Test integration**
```bash
# If using Vite/React
npm run dev
# Check http://localhost:5173/#contact

# For production
npm run build
```

**1.4 Deploy to production**
```bash
# Copy build to production server or restart container
docker-compose restart mr-dj-eds-frontend
```

### Success Criteria
- [ ] ContactForm visible op homepage
- [ ] Form submission werkt
- [ ] Lead komt binnen in RentGuy CRM
- [ ] Success message wordt getoond

### Files to Modify
- `/srv/apps/mr-djv1/App.jsx` - Add component
- `/srv/apps/mr-djv1/index.html` - Add contact section if needed
- Consider: `/srv/apps/mr-djv1/*.jsx` - Check existing structure

---

## 🎯 TASK 2: Celery Worker Setup (HIGH PRIORITY)

### Objective
Voeg Celery worker container toe aan docker-compose voor automation workflows.

### Current Status
- ✅ Workflows gedefinieerd (3 YAML files)
- ✅ Redis running (backend available)
- ❌ Worker container niet actief

### Implementation Steps

**2.1 Create Celery app configuration**
```python
# File: /srv/apps/RentGuy-v1/backend/app/automation/celery_app.py

from celery import Celery
import os

celery_app = Celery(
    'rentguy_automation',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://rentguy-redis:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://rentguy-redis:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'app.automation.tasks.lead_intake': {'queue': 'crm'},
        'app.automation.tasks.proposal_followup': {'queue': 'crm'},
        'app.automation.tasks.post_event_care': {'queue': 'crm'},
    }
)

# Auto-discover tasks
celery_app.autodiscover_tasks(['app.automation.tasks'])
```

**2.2 Create tasks module**
```python
# File: /srv/apps/RentGuy-v1/backend/app/automation/tasks.py

from .celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name='app.automation.tasks.lead_intake')
def lead_intake(lead_id: int, tenant_id: str):
    """Process new lead intake automation"""
    logger.info(f"Processing lead intake for lead {lead_id} (tenant: {tenant_id})")

    # TODO: Implement logic from automation/workflows/lead_intake.yaml
    # 1. Send welcome email
    # 2. Create follow-up task
    # 3. Update lead status

    return {"status": "completed", "lead_id": lead_id}

@celery_app.task(name='app.automation.tasks.proposal_followup')
def proposal_followup(deal_id: int, tenant_id: str):
    """Process proposal follow-up automation"""
    logger.info(f"Processing proposal followup for deal {deal_id} (tenant: {tenant_id})")

    # TODO: Implement logic from automation/workflows/proposal_followup.yaml

    return {"status": "completed", "deal_id": deal_id}

@celery_app.task(name='app.automation.tasks.post_event_care')
def post_event_care(deal_id: int, tenant_id: str):
    """Process post-event care automation"""
    logger.info(f"Processing post-event care for deal {deal_id} (tenant: {tenant_id})")

    # TODO: Implement logic from automation/workflows/post_event_care.yaml

    return {"status": "completed", "deal_id": deal_id}
```

**2.3 Update docker-compose.production.yml**
```yaml
# Add to services section:

  rentguy-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: rentguy-backend:${VERSION:-latest}
    container_name: rentguy-worker-prod
    restart: unless-stopped
    command: celery -A app.automation.celery_app worker --loglevel=info --concurrency=4 -Q crm,default
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@rentguy-db:5432/${POSTGRES_DB}
      - CELERY_BROKER_URL=redis://rentguy-redis:6379/0
      - CELERY_RESULT_BACKEND=redis://rentguy-redis:6379/0
      - REDIS_URL=redis://rentguy-redis:6379/0
      - LOG_LEVEL=INFO
    networks:
      - rentguy-internal
    depends_on:
      rentguy-redis:
        condition: service_healthy
      rentguy-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "celery -A app.automation.celery_app inspect ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  rentguy-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: rentguy-backend:${VERSION:-latest}
    container_name: rentguy-beat-prod
    restart: unless-stopped
    command: celery -A app.automation.celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@rentguy-db:5432/${POSTGRES_DB}
      - CELERY_BROKER_URL=redis://rentguy-redis:6379/0
      - REDIS_URL=redis://rentguy-redis:6379/0
    networks:
      - rentguy-internal
    depends_on:
      - rentguy-worker
```

**2.4 Deploy worker**
```bash
cd /srv/apps/RentGuy-v1
docker-compose -f docker-compose.production.yml up -d rentguy-worker rentguy-beat
```

### Success Criteria
- [ ] Worker container running
- [ ] Beat scheduler running
- [ ] Tasks discoverable: `celery -A app.automation.celery_app inspect registered`
- [ ] Can manually trigger task and see it execute

---

## 🎯 TASK 3: Email Templates Config (HIGH PRIORITY)

**Dependencies**: Task 2 moet eerst klaar zijn

### Objective
Configureer email templates en SMTP voor automation workflows.

### Implementation Steps

**3.1 Create email templates**
```python
# File: /srv/apps/RentGuy-v1/backend/app/automation/email_templates.py

EMAIL_TEMPLATES = {
    'lead_welcome': {
        'subject': 'Welkom bij Mr. DJ - We hebben je aanvraag ontvangen!',
        'html': '''
            <h1>Hallo {{first_name}},</h1>
            <p>Bedankt voor je interesse in Mr. DJ!</p>
            <p>We hebben je aanvraag ontvangen en nemen binnen 24 uur contact met je op.</p>
            <p>Met vriendelijke groet,<br>Het Mr. DJ Team</p>
        ''',
        'text': '''
            Hallo {{first_name}},

            Bedankt voor je interesse in Mr. DJ!
            We hebben je aanvraag ontvangen en nemen binnen 24 uur contact met je op.

            Met vriendelijke groet,
            Het Mr. DJ Team
        '''
    },
    'proposal_followup': {
        'subject': 'Je offerte van Mr. DJ',
        'html': '''
            <h1>Hallo {{first_name}},</h1>
            <p>Hierbij je persoonlijke offerte voor je bruiloft op {{event_date}}.</p>
            <p>Bekijk de offerte: <a href="{{proposal_link}}">Download PDF</a></p>
            <p>Heb je vragen? Neem gerust contact op!</p>
        '''
    }
}
```

**3.2 Update .env with SMTP credentials**
```bash
# Add to /srv/apps/RentGuy-v1/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@mr-dj.nl
SMTP_PASSWORD=<your-app-password>
EMAIL_FROM=Mr. DJ <noreply@mr-dj.nl>
```

**3.3 Create email service**
```python
# File: /srv/apps/RentGuy-v1/backend/app/automation/email_service.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from jinja2 import Template

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('EMAIL_FROM')

    def send_template(self, to_email: str, template_name: str, context: dict):
        from .email_templates import EMAIL_TEMPLATES

        template = EMAIL_TEMPLATES.get(template_name)
        if not template:
            raise ValueError(f"Template {template_name} not found")

        # Render template
        subject = Template(template['subject']).render(**context)
        html_body = Template(template['html']).render(**context)

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.from_email
        msg['To'] = to_email

        msg.attach(MIMEText(html_body, 'html'))

        # Send
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
```

**3.4 Update tasks to use email service**
```python
# Update /srv/apps/RentGuy-v1/backend/app/automation/tasks.py

from .email_service import EmailService

@celery_app.task(name='app.automation.tasks.lead_intake')
def lead_intake(lead_id: int, tenant_id: str):
    from app.modules.crm.service import CRMService
    from app.modules.auth.deps import get_db

    db = next(get_db())
    service = CRMService(db, tenant_id)
    lead = service.get_lead(lead_id)

    # Send welcome email
    email_service = EmailService()
    email_service.send_template(
        to_email=lead.email,
        template_name='lead_welcome',
        context={'first_name': lead.name.split()[0]}
    )

    return {"status": "completed", "lead_id": lead_id}
```

### Success Criteria
- [ ] SMTP credentials configured
- [ ] Email templates created
- [ ] Test email successfully sent
- [ ] Lead welcome email triggers on new lead

---

## 🎯 TASK 4: reCAPTCHA v3 Integration (MEDIUM PRIORITY)

**Dependencies**: Task 1 moet eerst klaar zijn

### Objective
Voeg Google reCAPTCHA v3 toe aan lead capture forms voor spam protectie.

### Implementation Steps

**4.1 Register site with Google reCAPTCHA**
- Go to https://www.google.com/recaptcha/admin
- Register mr-dj.sevensa.nl
- Get site key and secret key

**4.2 Update ContactForm.jsx**
```jsx
// Add to ContactForm.jsx

import { useEffect, useState } from 'react';

const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Replace with actual key

const ContactForm = () => {
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.onload = () => setRecaptchaLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recaptchaLoaded) {
      alert('reCAPTCHA not loaded yet, please try again');
      return;
    }

    // Get reCAPTCHA token
    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });

    // Submit with token
    const response = await fetch('https://sevensa.rentguy.nl/api/v1/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        tenant: 'mrdj',
        captcha_token: token
      })
    });

    // ... rest of submit logic
  };
};
```

**4.3 Update backend verification**
```python
# File: /srv/apps/RentGuy-v1/backend/app/modules/crm/deps.py

import httpx
import os

class CaptchaVerifier:
    def __init__(self):
        self.secret_key = os.getenv('RECAPTCHA_SECRET_KEY')
        self.verify_url = 'https://www.google.com/recaptcha/api/siteverify'

    async def verify(self, token: str, remote_ip: str = None) -> bool:
        if not self.secret_key:
            # Skip verification in development
            return True

        async with httpx.AsyncClient() as client:
            response = await client.post(self.verify_url, data={
                'secret': self.secret_key,
                'response': token,
                'remoteip': remote_ip
            })
            result = response.json()

            return result.get('success', False) and result.get('score', 0) > 0.5
```

**4.4 Add to .env**
```bash
RECAPTCHA_SECRET_KEY=<your-secret-key>
```

### Success Criteria
- [ ] reCAPTCHA loads on form
- [ ] Token generated on submit
- [ ] Backend verifies token
- [ ] Spam submissions blocked

---

## 🎯 TASK 5: WhatsApp Business API (MEDIUM PRIORITY)

### Objective
Integreer WhatsApp Business API voor geautomatiseerde communicatie met leads.

### Implementation Steps

**5.1 Setup WhatsApp Business Account**
- Create account at https://business.whatsapp.com
- Get API credentials
- Register phone number
- Create message templates

**5.2 Add WhatsApp credentials to .env**
```bash
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_ACCESS_TOKEN=<your-access-token>
WHATSAPP_VERIFY_TOKEN=<your-verify-token>
```

**5.3 Create WhatsApp service**
```python
# File: /srv/apps/RentGuy-v1/backend/app/automation/whatsapp_service.py

import httpx
import os

class WhatsAppService:
    def __init__(self):
        self.phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
        self.api_url = f"https://graph.facebook.com/v18.0/{self.phone_number_id}/messages"

    async def send_template(self, to_phone: str, template_name: str, params: list):
        """Send WhatsApp template message"""

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'messaging_product': 'whatsapp',
            'to': to_phone,
            'type': 'template',
            'template': {
                'name': template_name,
                'language': {'code': 'nl'},
                'components': [{
                    'type': 'body',
                    'parameters': [{'type': 'text', 'text': p} for p in params]
                }]
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, headers=headers, json=payload)
            return response.json()

    async def send_text(self, to_phone: str, message: str):
        """Send plain text WhatsApp message"""

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'messaging_product': 'whatsapp',
            'to': to_phone,
            'type': 'text',
            'text': {'body': message}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, headers=headers, json=payload)
            return response.json()
```

**5.4 Add webhook endpoint**
```python
# Add to /srv/apps/RentGuy-v1/backend/app/modules/crm/routes.py

@router.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages"""
    data = await request.json()

    # Process incoming message
    # Log to CRM activities

    return {"status": "ok"}

@router.get("/webhooks/whatsapp")
async def whatsapp_webhook_verify(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token")
):
    """Verify WhatsApp webhook"""
    verify_token = os.getenv('WHATSAPP_VERIFY_TOKEN')

    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge)

    raise HTTPException(status_code=403, detail="Verification failed")
```

**5.5 Update automation tasks**
```python
# Add to tasks.py

@celery_app.task(name='app.automation.tasks.send_whatsapp_followup')
def send_whatsapp_followup(deal_id: int, tenant_id: str):
    from .whatsapp_service import WhatsAppService

    service = WhatsAppService()
    # Get deal details
    # Send WhatsApp message

    return {"status": "completed"}
```

### Success Criteria
- [ ] WhatsApp Business account active
- [ ] API credentials configured
- [ ] Webhook endpoint verified
- [ ] Test message successfully sent

---

## 🎯 TASK 6: Microsoft 365 Calendar Sync (MEDIUM PRIORITY)

### Objective
Synchroniseer CRM deals met Microsoft 365 calendar voor event planning.

### Implementation Steps

**6.1 Register Azure AD Application**
- Go to https://portal.azure.com
- Register new app
- Add Microsoft Graph API permissions: `Calendars.ReadWrite`
- Generate client secret

**6.2 Add credentials to .env**
```bash
MS365_CLIENT_ID=<your-client-id>
MS365_CLIENT_SECRET=<your-client-secret>
MS365_TENANT_ID=<your-tenant-id>
MS365_REDIRECT_URI=https://sevensa.rentguy.nl/api/v1/auth/ms365/callback
```

**6.3 Create MS365 service**
```python
# File: /srv/apps/RentGuy-v1/backend/app/integrations/ms365_service.py

import httpx
import os
from datetime import datetime

class MS365Service:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.graph_url = 'https://graph.microsoft.com/v1.0'

    async def create_calendar_event(self, event_data: dict):
        """Create calendar event"""

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'subject': event_data['title'],
            'start': {
                'dateTime': event_data['start_time'],
                'timeZone': 'Europe/Amsterdam'
            },
            'end': {
                'dateTime': event_data['end_time'],
                'timeZone': 'Europe/Amsterdam'
            },
            'location': {
                'displayName': event_data.get('location', '')
            },
            'body': {
                'contentType': 'HTML',
                'content': event_data.get('description', '')
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{self.graph_url}/me/events',
                headers=headers,
                json=payload
            )
            return response.json()
```

**6.4 Add OAuth endpoints**
```python
# Add to routes.py

@router.get("/auth/ms365/login")
async def ms365_login():
    """Redirect to Microsoft 365 login"""
    auth_url = (
        f"https://login.microsoftonline.com/{os.getenv('MS365_TENANT_ID')}/oauth2/v2.0/authorize"
        f"?client_id={os.getenv('MS365_CLIENT_ID')}"
        f"&response_type=code"
        f"&redirect_uri={os.getenv('MS365_REDIRECT_URI')}"
        f"&scope=Calendars.ReadWrite offline_access"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/ms365/callback")
async def ms365_callback(code: str):
    """Handle OAuth callback and get access token"""
    # Exchange code for access token
    # Store token in database
    pass
```

**6.5 Add sync task**
```python
@celery_app.task(name='app.automation.tasks.sync_deal_to_calendar')
def sync_deal_to_calendar(deal_id: int, tenant_id: str):
    """Sync deal event to MS365 calendar"""
    from app.integrations.ms365_service import MS365Service

    # Get deal details
    # Get user's MS365 token
    # Create calendar event

    return {"status": "completed"}
```

### Success Criteria
- [ ] Azure AD app registered
- [ ] OAuth flow working
- [ ] Calendar event created from deal
- [ ] Two-way sync functional

---

## 🎯 TASK 7: Metabase Dashboards (LOW PRIORITY)

### Objective
Setup Metabase container en create CRM analytics dashboards.

### Implementation Steps

**7.1 Add Metabase to docker-compose**
```yaml
  metabase:
    image: metabase/metabase:latest
    container_name: rentguy-metabase
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MB_DB_TYPE=postgres
      - MB_DB_DBNAME=rentguy_production
      - MB_DB_PORT=5432
      - MB_DB_USER=${POSTGRES_USER}
      - MB_DB_PASS=${POSTGRES_PASSWORD}
      - MB_DB_HOST=rentguy-db
    networks:
      - rentguy-internal
      - sevensa-edge
    depends_on:
      - rentguy-db
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.metabase.rule=Host(`analytics.rentguy.nl`)"
      - "traefik.http.services.metabase.loadbalancer.server.port=3000"
```

**7.2 Deploy Metabase**
```bash
docker-compose -f docker-compose.production.yml up -d metabase
```

**7.3 Create dashboards**
- Login to http://analytics.rentguy.nl
- Connect to PostgreSQL database
- Create dashboards:
  1. Pipeline Velocity
  2. Revenue by Package
  3. Lead Source Performance
  4. Deal Conversion Rates
  5. Activity Timeline

**7.4 Export dashboard configs**
```bash
# Save dashboard JSON for version control
curl http://analytics.rentguy.nl/api/dashboard/1 > /srv/apps/RentGuy-v1/dashboards/pipeline_velocity.json
```

### Success Criteria
- [ ] Metabase running and accessible
- [ ] Connected to RentGuy database
- [ ] 5 CRM dashboards created
- [ ] Dashboards accessible to team

---

## 🎯 TASK 8: Sentry Error Tracking (LOW PRIORITY)

### Objective
Setup Sentry for error tracking en monitoring.

### Implementation Steps

**8.1 Create Sentry project**
- Go to https://sentry.io
- Create new project for RentGuy
- Get DSN

**8.2 Add Sentry to backend**
```python
# File: /srv/apps/RentGuy-v1/backend/app/main.py

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
    environment='production'
)
```

**8.3 Add Sentry to frontend**
```javascript
// File: /srv/apps/RentGuy-v1/src/main.tsx

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: 'production'
});
```

**8.4 Update .env**
```bash
SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Success Criteria
- [ ] Sentry project created
- [ ] Backend errors tracked
- [ ] Frontend errors tracked
- [ ] Alerts configured

---

## 📊 EXECUTION PLAN

### Phase 1: Parallel Execution (Start Immediately)
Run these tasks simultaneously:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Task 1    │  │   Task 2    │  │   Task 5    │
│  ContactForm│  │   Worker    │  │  WhatsApp   │
│ Integration │  │   Setup     │  │     API     │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Task 6    │  │   Task 7    │  │   Task 8    │
│  MS365 Sync │  │  Metabase   │  │   Sentry    │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Phase 2: Sequential Dependencies
Run after Phase 1 completes:
```
Task 2 Complete ──→ Task 3 (Email Templates)
Task 1 Complete ──→ Task 4 (reCAPTCHA)
```

### Estimated Timeline
```
T=0:    Start Phase 1 (6 tasks in parallel)
T+45:   Phase 1 complete
T+45:   Start Task 3 & Task 4
T+75:   All tasks complete
```

---

## ✅ SUCCESS VERIFICATION

After all tasks complete, run verification:

```bash
# Verify ContactForm
curl https://mr-dj.sevensa.nl | grep -i contact

# Verify Worker
docker ps | grep worker
docker logs rentguy-worker-prod

# Verify Email
docker exec rentguy-backend-prod python -c "from app.automation.email_service import EmailService; print('OK')"

# Verify WhatsApp
curl https://sevensa.rentguy.nl/api/v1/webhooks/whatsapp

# Verify MS365
curl https://sevensa.rentguy.nl/api/v1/auth/ms365/login

# Verify Metabase
curl https://analytics.rentguy.nl

# Verify Sentry
docker logs rentguy-backend-prod | grep -i sentry
```

---

## 📝 DELIVERABLES

Upon completion, you should have:

1. ✅ Integrated contact form on website
2. ✅ Running Celery worker + beat scheduler
3. ✅ Email templates and SMTP configured
4. ✅ reCAPTCHA protection active
5. ✅ WhatsApp Business API integrated
6. ✅ MS365 calendar sync operational
7. ✅ Metabase dashboards deployed
8. ✅ Sentry error tracking active

---

## 🚨 CRITICAL NOTES FOR OPENROUTER

1. **Environment Variables**: Many tasks require secrets. Use existing `.env` or create new ones.
2. **Docker Rebuild**: After backend changes, rebuild: `docker-compose build rentguy-backend`
3. **Git Commits**: Commit after each major task completion
4. **Testing**: Test each component after implementation
5. **Documentation**: Update README with new features

---

## 📞 SUPPORT

If any task fails:
1. Check logs: `docker logs <container-name>`
2. Verify environment variables
3. Check network connectivity
4. Validate credentials

---

**Ready for parallel execution by OpenRouter! 🚀**
