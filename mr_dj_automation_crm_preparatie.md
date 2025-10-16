# Implementatieplan: CRM & Automatiseringen voor mr-dj.rentguy.nl

Dit document beschrijft het **concrete implementatieplan** om de CRM- en automation-capabilities van de Mr. DJ tenant in de RentGuy
applicatie te activeren. De aanpak is gebaseerd op best practices uit de bestaande RentGuy codebase, de modules in
`mr-dj-onboarding-enhanced/` en de referentie-artefacten uit de `mr-djv1` repository (commit `01edec2625748b40de38921d16edfbd6aefc272a`).

## 1. Architectuuraanpassing op basis van mr-djv1

### 1.1 Frontend (React + Vite)
- `mr-dj-onboarding-enhanced/src/App.jsx` bevestigt het Vite/React fundament met route `/crm`; we hergebruiken deze structuur voor het
  CRM-dashboard.
- Navigatiecomponent `MainNavigation.tsx` bevat reeds een CRM entry – uitbreiden met subnavigatie voor **Leads**, **Pipelines**,
  **Automations**, **Rapportages**.
- UI-templates uit `mr_dj_complete_all_143_templates.zip` (map `templates/website/`) worden na validatie op Mr. DJ branding geladen in
  `mr-dj-onboarding-enhanced/public/templates/`. Stappen:
  1. Download ZIP uit `mr-djv1` repo en controleer Figma referenties op kleur (#111827, #F3F4F6, accent #EF4444).
  2. Bewaar componentvarianten (hero, testimonial, pricing) als React partials (`src/components/templates/`).
  3. Voeg QA-checklist toe in `testing/ui/regressions.md` om consistentie te borgen.

### 1.2 Backend Alignement
- De huidige RentGuy backend modules (`0001_baseline.py` t/m `0007_onboarding.py`) draaien als FastAPI-services. CRM-extensies komen in
  nieuwe module `0008_crm.py` met schema's, routers en services.
- Architecture blueprint uit mr-djv1 bevestigt een service-gedreven opzet met PostgreSQL + Redis. We houden deze stack aan:
  - **PostgreSQL** voor CRM-tabellen met tenant-scheiding.
  - **Redis** als event queue (`crm_automation_queue`).
- API Gateway (`routes.py`) krijgt een nieuwe router `crm_router` gekoppeld aan `/api/crm`.

### 1.3 Dashboarding
- Gebruik bestaande Metabase integratie (`ops/metabase/`) voor dashboards. Nieuwe dashboards: "Pipeline Velocity", "Revenue per
  Package", "Automation SLA".
- Frontend store `rentguy/frontend/src/stores/crmStore.ts` & logic `../logic/crmLogic.ts` blijven de single source of truth; breid types
  (`src/types/crmTypes.ts`) uit met `DealStage`, `AutomationRun`, `EngagementScore`.

## 2. CRM Datamodel & Migrations

| Tabel | Belangrijkste kolommen | Relaties | Bijzonderheden |
|-------|-----------------------|----------|----------------|
| `crm_leads` | `id`, `tenant_id`, `source`, `campaign`, `status`, `score`, `created_at` | FK → `crm_contacts` (optioneel) | Index `idx_leads_tenant_status` voor snelle filter op tenant/stage |
| `crm_contacts` | `id`, `tenant_id`, `first_name`, `last_name`, `email`, `phone`, `preferences`, `gdpr_opt_in` | 1:N `crm_deals`, 1:N `crm_activities` | Gebruik `citext` type voor case-insensitive mail |
| `crm_deals` | `id`, `tenant_id`, `contact_id`, `pipeline_id`, `stage`, `value`, `currency`, `expected_close`, `probability` | FK → `crm_contacts`, FK → `crm_pipelines` | Stage map naar automation triggers |
| `crm_pipelines` | `id`, `tenant_id`, `name`, `type`, `sla_response_hours`, `is_default` | 1:N `crm_deals`, 1:N `crm_stages` | Tenant kan meerdere pipelines bezitten |
| `crm_stages` | `id`, `pipeline_id`, `sequence`, `name`, `auto_progress_rule` | FK → `crm_pipelines` | JSONB `auto_progress_rule` voor automatisering |
| `crm_activities` | `id`, `tenant_id`, `deal_id`, `activity_type`, `payload`, `due_at`, `owner_id` | FK → `crm_deals`, FK → `users` | Gebruik `payload` JSONB voor omnichannel content |
| `crm_automation_runs` | `id`, `tenant_id`, `trigger`, `workflow_id`, `status`, `started_at`, `completed_at`, `context` | FK → `crm_deals` | Log voor audit & debugging |

**Migrations**: toevoegen aan `db/alembic/versions/` met naming `2025_XX_XX_add_crm_tables.py`. Zorg voor backward-compatible default waarden,
foreign key constraints met `ON DELETE CASCADE` (behalve `crm_contacts`).

## 3. API & Service Implementatie

1. **Schemas**: creëer Pydantic modellen in `schemas/crm.py` voor `LeadCreate`, `DealUpdate`, `AutomationRunRead`.
2. **CRUD Services**: in `services/crm_service.py` implementeren met SQLAlchemy models; hergebruik `BaseService` uit `0001_baseline.py`.
3. **Routers** (`routers/crm_router.py`):
   - `POST /leads` → maakt lead + optioneel contact; stuurt event `lead.created` naar Redis queue.
   - `GET /deals` → filter op `tenant_id`, `stage`, `pipeline_id`, met paginatie.
   - `POST /deals/{id}/advance` → valideert stage en triggert automation.
   - `POST /activities` → logt interactie + verstuurt Teams notificatie.
4. **Security**: gebruik `Depends(get_current_tenant)` en RBAC (`ROLE_SALES`, `ROLE_MARKETING`). Multi-tenant policies in `security.py`.
5. **Automations**: workflow-engine adapter in `apps/automation/engine.py` (wrapper om n8n/Temporal); events uit Redis consumeren en
   uitvoeren via `asyncio` workers (`apps/automation/workers.py`).

## 4. Integratie met Bestaande Modules

- **Onboarding → CRM**: `0007_onboarding.py` levert intake-data. Voeg background task toe die `OnboardingCompleted` events vertaalt naar
  `crm_leads` records en pipeline "Nieuwe Lead".
- **Inventory & Projects**: `0002_inventory.py` en `0003_projects.py` worden geraadpleegd wanneer een deal naar stage `Project Gereed`
  schuift. Implementatie in `crm_service.advance_deal_stage` met service calls naar `project_service.create_project_from_deal`.
- **Billing**: bij stage `Facturatie` trigger `0006_billing.py` Mollie integratie. Voeg idempotency keys toe (`automation_run_id`).
- **Dashboards**: exposeer REST endpoint `/api/crm/analytics/pipeline` dat data levert aan Metabase. Gebruik SQL views voor performance.

## 5. UI & UX Implementatie

1. **State Management**: breid `rentguy/frontend/src/stores/crmStore.ts` uit met actions `advanceDealStage`, `fetchAutomationRuns`.
2. **Types**: update `rentguy/frontend/src/types/crmTypes.ts` met `DealStage`, `AutomationRun`, `PipelineDefinition`.
3. **API Client**: voeg functies toe aan `rentguy/frontend/src/api/crm.ts` voor nieuwe endpoints (gebruik Axios instance met tenant header).
4. **CRMDashboard**: in `mr-dj-onboarding-enhanced/src/pages/CRM/` creëren:
   - **Lead Board** (kanban per stage) met drag & drop (react-beautiful-dnd).
   - **Automation Timeline** component met status-badges.
   - **Template Library** widget die entries uit `public/templates/` toont met preview.
5. **Branding**: importeer kleuren & fonts uit `branding.ts`, voeg theming tokens toe (`--mdj-primary`, `--mdj-accent`).
6. **Accessibility**: alle formulieren voorzien van labels, aria-attributes; test via `npm run lint:a11y`.

## 6. Automatiseringen & Templates

### 6.1 Workflowbibliotheek
- Maak map `automation/workflows/` met YAML-definities (`lead_intake.yaml`, `proposal_followup.yaml`, `post_event_care.yaml`).
- Templatebron: `mr_dj_complete_all_143_templates.zip` → converteer relevante e-mail/SMS-templates naar Markdown + MJML.
- Iedere workflow bevat metadata: `trigger`, `entry_stage`, `actions[]`, `sla_hours`, `fallback_owner`.

### 6.2 Triggers & Actions
- **Triggers**: `lead.created`, `deal.stage.changed`, `payment.received`, `event.completed`.
- **Acties**: e-mail (SendGrid), WhatsApp (Meta Cloud API), Teams webhook, task creatie.
- **Branching**: definieer condities (bijv. `if deal.value > 5000 → voeg director review toe`).

### 6.3 Kwaliteitsbewaking
- Voer linting uit met `automation/validate.py` om YAML-structuur te controleren.
- Template review checklist in `docs/qa/automation_templates.md` (brand check, CTA, tone-of-voice).

## 7. Data Synchronisatie & Integraties

- **Microsoft 365**: gebruik Graph API voor mail/calendar sync; credentials via Azure App Registration.
- **WhatsApp Business**: configureer webhook endpoint `/api/crm/whatsapp/callback` en koppeling met template ID's.
- **Invoice Ninja**: bestaande adapter (`invoice_ninja.py`) uitbreiden met `sync_deal_payments(deal_id)`.
- **Exact Online**: nightly sync job (`cronjob exact_sync`) voor financiële data.
- **Mailchimp/ActiveCampaign**: export segments via `crm_segments` view; push naar marketing automation.

## 8. Test- & Validatieplan

| Testtype | Acties | Tools |
|----------|--------|-------|
| Unit tests | `pytest tests/crm/test_services.py` voor services, `tests/frontend/crmStore.test.ts` voor store | Pytest, Vitest |
| Integratie | Mocked API + Redis queue (`docker-compose.crm.yml`) | Docker Compose |
| E2E | Cypress scenario `tests/e2e/crm.spec.ts` uitbreiden met intake → factuur flow | Cypress |
| Performance | Locust test `tests/perf/crm_locustfile.py` (100 gelijktijdige leads) | Locust |
| Accessibility | `npm run test:a11y -- --scope=crm` | Axe |

Release pas na groen resultaat + handtekening van product owner (Bart).

## 9. Deployment & Observability

- **CI/CD**: voeg pipeline-stappen toe in `deploy/github-actions/crm.yml`:
  1. Build CRM frontend (`pnpm build --filter crm`).
  2. Run backend tests + Alembic migrations.
  3. Deploy naar staging namespace `rg-mrdj-crm` met Helm chart.
- **Secrets**: beheer via HashiCorp Vault (`ops/vault/crm/`).
- **Monitoring**: configureer Grafana dashboards (`observability/crm.json`), alerts op SLA-violations.
- **Logging**: structurele logging (JSON) met `correlation_id` per automation run.

## 10. Roadmap & Governance

| Fase | Sprint(s) | Deliverables |
|------|-----------|--------------|
| F1 – Fundament | 1-2 | Migrations live, basis CRUD API, frontend store updates |
| F2 – UI & Templates | 3-4 | CRM dashboards, template library geladen, QA-checks afgerond |
| F3 – Automations | 5-6 | Workflow-engine live, integratie met pipelines |
| F4 – Integraties | 7-8 | Microsoft 365, WhatsApp, Invoice Ninja sync |
| F5 – Analytics & Go-live | 9-10 | Metabase dashboards, observability, UAT-sign-off |

**Eigenaar**: Bart van de Weijer (PO) • **Tech Lead**: RentGuy Platform Team • **Weekly cadence**: refinement maandag, demo vrijdag.

## 11. Volgende Acties (Week 0)

1. Haal `mr_dj_complete_all_143_templates.zip` op uit mr-djv1 repo en valideer branding → plan design QA sessie.
2. Maak Alembic migration branch `feature/mrdj-crm-migrations` en bouw `crm_leads` t/m `crm_automation_runs` tabellen.
3. Zet Redis instance (`redis-crm`) op via `docker-compose.crm.yml`; configureer env vars in `.env.mrdj`.
4. Maak front-end feature branch voor CRM dashboard, activeer nieuwe routes en bouw template previews.
5. Draft automation workflows in YAML, peer review met marketing & operations.
6. Plan integratietest-sessie met Bart (scenario: bruiloftlead → aanbetaling → project → evaluatie).
