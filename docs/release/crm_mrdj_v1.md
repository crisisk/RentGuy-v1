# Release Notes – CRM Mr. DJ v1.0

**Release datum:** 18 maart 2025  
**Status:** In UAT → Go-live na sign-off

## Hoogtepunten
- Nieuwe CRM module met leads, deals, activiteiten en automation logging.
- Workflow engine + workers geconfigureerd voor lead intake, proposal follow-up
  en post-event care.
- OAuth2 SSO flow marketing → platform gereed (`/api/v1/auth/sso/*`).
- Lead capture API (`/api/v1/public/leads`) met captcha + rate limiting live.
- CMS webhook synchroniseert contentblokken naar tenant templates (`cms/webhook_to_crm.py`).
- Metabase dashboards gedeeld met operations-team (`CRM/MrDJ`).
- Observability alerts op automation failure-rate (>2% in 10 minuten).

## Wijzigingen
### Backend
- FastAPI router `/api/v1/crm` voor leads, deals, activities.
- Publieke endpoint `/api/v1/public/leads` inclusief captcha controle en automation trigger.
- Alembic migratie `2025_03_01_add_crm_tables` met tabellen voor pipelines,
  stages, deals, activiteiten en automation runs.
- Integratie met automation engine bij stage-advancement (`crm_service`).
- OAuth2 SSO endpoints (`/api/v1/auth/sso/login`, `/api/v1/auth/sso/callback`).

### Automations
- YAML workflows aangemaakt (`lead_intake`, `proposal_followup`, `post_event_care`).
- Worker service (`apps/automation/workers.py`) beschikbaar voor systemd deployment.
- Template clone tool toegevoegd (`automation/tools/clone_templates.py`).
- CMS webhook levert content direct aan template library per tenant.

### Frontend
- Tenant-aware CRM store met caching en invalidatie per tenant.
- API client voor `/crm` endpoints met automatische header injectie.
- Vitest unit tests voor store logica (`crmStore.test.ts`).

### Enablement & Docs
- QA checklist voor automation templates (`docs/qa/automation_templates.md`).
- Tenant rollout checklist + training plan + support playbook.
- UAT draaiboek + sign-off sjabloon bijgewerkt.
- Release runbook bevat SSO troubleshooting + webhook validatie stappen.

## Bekende Issues
- Minor accessibility verbeteringen (3 items) gepland voor post-UAT sprint.
- Lead capture captcha service draait nog in sandbox; productie keys worden bij go-live geactiveerd.

## Post Go-live Acties
- Monitor `crm_automation_runs` in de eerste 72 uur; afwijkingen >5% escaleren.
- Verzamel feedback van sales/operations na 1 week en plan retro.
- Voeg nieuwe tenant aan provisioning kit zodra sign-off rond is.
