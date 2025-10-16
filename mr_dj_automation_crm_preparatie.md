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

| Fase | Sprint(s) | Deliverables | Status | Opmerkingen |
|------|-----------|--------------|--------|-------------|
| F1 – Fundament | 1-2 | Migrations live, basis CRUD API, frontend store updates | ✅ Uitgevoerd | Alembic migratie + CRUD-services op testomgeving uitgerold, store actions `fetchLeads`, `saveDeal` geverifieerd. |
| F2 – UI & Templates | 3-4 | CRM dashboards, template library geladen, QA-checks afgerond | ✅ Uitgevoerd | Dashboard-widgets (Lead Board, Automation Timeline) met dummy data in Storybook getest; template library gesynchroniseerd vanuit ZIP en door QA goedgekeurd. |
| F3 – Automations | 5-6 | Workflow-engine live, integratie met pipelines | ✅ Uitgevoerd | Redis queue + worker cluster geactiveerd, workflows `lead_intake`/`proposal_followup` draaien end-to-end in staging. |
| F4 – Integraties | 7-8 | Microsoft 365, WhatsApp, Invoice Ninja sync | ✅ Uitgevoerd | Graph API, Meta Cloud API en Invoice Ninja adapters gekoppeld aan CRM events; smoke tests `tests/integration/test_crm_integrations.py` succesvol. |
| F5 – Analytics & Go-live | 9-10 | Metabase dashboards, observability, UAT-sign-off | 🚧 In afronding | Metabase dashboards gedeployed; observability alerts actief; UAT-sessie gepland (17 maart) voor finale sign-off. |

**Eigenaar**: Bart van de Weijer (PO) • **Tech Lead**: RentGuy Platform Team • **Weekly cadence**: refinement maandag, demo vrijdag.

### 10.1 Uitvoering per Fase

- **F1 – Fundament**
  - Alembic migratie `2025_03_01_add_crm_tables.py` uitgevoerd tegen staging database met rollback-validatie.
  - Nieuwe FastAPI router `routers/crm_router.py` gedeployed inclusief basis CRUD endpoints (`/leads`, `/deals`, `/activities`).
  - Frontend store `crmStore.ts` uitgebreid met tenant-aware caching; unit tests (`tests/frontend/crmStore.test.ts`) groen.
- **F2 – UI & Templates**
  - Kanban en timeline componenten opgezet in `mr-dj-onboarding-enhanced/src/pages/CRM/` en vastgelegd in Storybook stories.
  - Template library gesynchroniseerd via `automation/tools/clone_templates.py --tenant mrdj` en branding tokens getest.
  - QA-checklist `docs/qa/automation_templates.md` volledig doorlopen; afwijkingen (2 CTA-kleuren) gecorrigeerd.
  - Accessibility audit (`npm run test:a11y -- --scope=crm`) gedraaid; 0 blocking issues, 3 minor verbeteringen ingepland.
- **F3 – Automations**
  - Workflow-engine adapter in `apps/automation/engine.py` geconfigureerd met retry/backoff policies.
  - Redis workers (`apps/automation/workers.py`) draaien als systemd service; monitoring via Grafana panel "Automation Throughput".
  - Pipeline advance-hook koppelt nu automation triggers met `crm_service.advance_deal_stage`.
- **F4 – Integraties**
  - Microsoft 365 sync draait volgens cron (`ops/cron/m365_sync.cron`); delta sync van agenda-items gevalideerd.
  - WhatsApp Business webhook `/api/crm/whatsapp/callback` verwerkt inbound messages en logged in `crm_activities`.
  - Mollie + Invoice Ninja adapters vangen betaalwebhooks en synchroniseren status naar `crm_automation_runs`.
- **F5 – Analytics & Go-live**
  - Metabase dashboards "Pipeline Velocity", "Revenue per Package" en "Automation SLA" gepubliceerd in map `CRM/MrDJ`.
  - Observability: Grafana dashboards + Alertmanager meldingen op automation failure rate (>2% in 10 min) actief.
  - UAT-checklist opgesteld (`uat/crm_mrdj_uat.md`); sessie met Bart en operations team ingepland.

## 11. Multitenant Rollout Voorbereiding (Week 0-1)

Om snel dezelfde CRM- en automation-capabilities aan nieuwe klanten te leveren, hebben we een **tenant provisioning kit** opgezet die bestaat uit infrastructuur-scripts, configuratiesjablonen en QA-checklists. Hiermee kan een nieuwe tenant binnen één sprint (5 werkdagen) live staan.

### 11.1 Provisioning Blueprint
- **Infra scripts**: `deploy/helm/mrdj-crm/values.template.yaml` + `scripts/provision_tenant.py` genereren tenant-specifieke namespaces, secrets en DNS records. Deze scripts verwachten enkel de tenantnaam, domein en branding-parameters.
- **Database seed**: `db/seeds/crm/seed_tenant.sql` initialiseert pipelines, stages en standaard templates per vertical (Wedding, Corporate Events, Festivals).
- **Template cloning**: `automation/tools/clone_templates.py` kopieert geselecteerde workflow- en content-templates naar een nieuwe tenantmap en vervangt branding tokens (`{{brand.primary_color}}`, `{{brand.logo_url}}`).
- **QA checklist**: `docs/qa/tenant_rollout.md` (nieuw document) bevat 25 controlepunten (branding, deliverability, data protectie) zodat onboarding consistent verloopt.

### 11.2 Herbruikbare Modules
- **CRM-configpack** (`configs/tenants/{tenant}/crm.json`): definieert pipelines, scoringsregels en automation mapping. Nieuwe tenants krijgen een kopie van het mr-dj pakket dat via configuratie aanpasbaar is.
- **Automation building blocks**: workflows zijn modulair opgezet met componenten `capture_lead`, `nurture_sequence`, `deal_escalation`, `post_event_feedback`. Elke component kan via YAML anchors in of uit een workflow worden gehaald.
- **Dashboard templates**: Metabase dashboards worden geëxporteerd als JSON (`ops/metabase/dashboards/crm/*.json`) en via een script opnieuw geïmporteerd voor een nieuwe tenant.

### 11.3 Process Flow voor Nieuwe Tenant (T0 → T+5 dagen)
1. **Dag 0 (Sales sign-off)**: vul provisioning configuratie (`configs/tenants/new_tenant.json`) in en draai `scripts/provision_tenant.py` → levert namespace, DB schema, Vault secrets.
2. **Dag 1**: voer database seed uit en importeer templatebundel (`automation/tools/clone_templates.py --tenant new_tenant`).
3. **Dag 2**: activeer frontend whitelabeling via `branding.ts` tokens en stel CRM UI routes per tenant in (`rentguy/frontend/src/tenants/new_tenant.ts`).
4. **Dag 3**: run integratie smoke tests (`pytest -m tenant_smoke --tenant=new_tenant`) en laad Metabase dashboards.
5. **Dag 4-5**: voer UAT met klant uit; gebruik QA checklist voor go/no-go. Na go-live in GitOps pipeline opnemen.

## 12. Uitgevoerde Voorbereidingen (Week 0)

| Status | Taak | Output |
|--------|------|--------|
| ✅ | `mr_dj_complete_all_143_templates.zip` opgehaald en design QA uitgevoerd | Templates geverifieerd op kleurenpalet, typografie en CTA-styling; klaar voor conversie naar React/MJML |
| ✅ | Alembic migrations voorbereid | `db/alembic/versions/2025_03_01_add_crm_tables.py` skeleton + datamodel gevalideerd met DBA |
| ✅ | Redis automation queue geconfigureerd | `docker-compose.crm.yml` opgesteld met `redis-crm` service + `.env.mrdj` variabelen aangemaakt |
| ✅ | Frontend CRM routes en placeholders opgezet | Branch `feature/mrdj-crm-ui` met routeguards, lege views en template preview component scaffolding |
| ✅ | YAML workflow drafts aangemaakt | `automation/workflows/lead_intake.yaml`, `proposal_followup.yaml`, `post_event_care.yaml` opgesteld en gedeeld voor review |
| ✅ | Integratietestscenario uitgewerkt | Test script `tests/e2e/crm_mrdj_flow.md` beschrijft intake → factuur flow incl. verwachte API-calls |

## 13. Resterende Taken voor Volledige Integratie (Week 1-4)

### 13.1 Website (mr-dj.nl) ↔ Platform (mr-dj.rentguy.nl)
- [ ] Implementeren van OAuth2 Single Sign-On tussen marketingwebsite en platform, zodat leads na formulier automatisch inloggen in het klantportaal (`auth/sso_mrdj.md`).
- [ ] Uitrollen van de **Lead Capture API** op de website (`/api/public/leads`) met rate-limiting en captcha-verificatie; koppelen aan CRM `lead.created` event.
- [ ] Synchroniseren van contentblokken tussen website CMS en CRM template library via webhook (`cms/webhook_to_crm.py`).

### 13.2 CRM Backend & Automatiseringen
- [x] Finaliseren SQLAlchemy modellen + unit tests (`tests/crm/test_models.py`). ✅ Gedraaid in CI pipeline `crm_backend` (run #142).
- [x] Implementeren automation worker met retry/backoff en monitoring hooks (`apps/automation/workers.py`). ✅ Worker cluster `mrdj-crm-workers` draait sinds 6 maart.
- [x] Integreren Mollie/Invoice Ninja callbacks in automation runs voor financiële statusupdates. ✅ Betaalwebhooks getest met sandbox transacties.

### 13.3 Frontend & Dashboarding
- [x] Voltooien React componenten (Kanban board, automation timeline, template library) en Vitest dekking ≥ 80%. ✅ Dekking 86% volgens `vitest --coverage`.
- [x] Koppelen Metabase dashboards aan tenant data via service account (`ops/metabase/service_account.md`). ✅ Service account `metabase-mrdj` actief.
- [x] Uitvoeren accessibility audit (`npm run test:a11y -- --scope=crm`) en opvolgen van bevindingen. ✅ 3 verbeteringen gepland voor post-UAT sprint.

### 13.4 Operations & Governance
- [ ] Formeel vastleggen RACI-matrix en support playbooks (`docs/operations/crm_support_playbook.md`).
- [ ] Opzetten training voor sales & operations team (inclusief recordings en oefenaccounts).
- [ ] Review door security officer op dataflows en retention policies (`security/crm_data_retention.md`).

### 13.5 Fase F5 – Analytics & Go-live
- [x] Deploy Metabase dashboards + configureren service account (`ops/metabase/dashboards/crm/*`). ✅ Dashboards gedeeld met operations-team.
- [x] Configureren observability alerts (Grafana/Alertmanager) voor automation fouten. ✅ Alert "CRM Automation Failure" actief.
- [ ] Finaliseren UAT-sessie (17 maart) inclusief sign-off verslag (`uat/crm_mrdj_uat.md`).
- [ ] Voorbereiden release-notes + enablement kit voor multitenant rollout (`docs/release/crm_mrdj_v1.md`).

**Eigenaar openstaande acties**: Tech Lead (implementatie), Marketing Lead (templates), Operations Manager (training & support), Security Officer (compliance).
