# Voorbereidingsplan: Automation & CRM voor mr-dj.rentguy.nl

## 1. Doelstelling en Scope
- **Doel**: mr-dj.rentguy.nl gereedmaken als automation- en CRM-hub bovenop de bestaande RentGuy basis.
- **Scope**: lead capture, CRM-configuratie, workflow-automatisering, data synchronisatie, en go-live governance voor de Mr. DJ tenant.
- **Randvoorwaarden**: hergebruik van het onboarding portal (`mr-dj-onboarding/`), aansluiting op de RentGuy backend (inventory, projecten, crew, facturatie) en ondersteuning van multi-tenant branding.

## 2. Architectuuroverzicht
1. **Frontend-laag** (mr-dj-onboarding + toekomstige CRM UI):
   - Uitbreiding van de React/Vite frontend met CRM dashboards (leads, deals, communicatiestreams).
   - Integratie met Mr. DJ brandingcomponenten (`branding.ts`, `TipBanner.tsx`, `RoleSelection.tsx`).
2. **Backend-laag**:
   - API-services voor leads, contactpersonen, pipelines, en automatiseringsregels.
   - Webhook-ingangen voor e-mail, WhatsApp Business, website formulieren en Mollie betalingen.
3. **Automations-laag**:
   - Event bus (bijv. via Redis/Queue) om triggers door te geven aan workflow-engine.
   - Workflow-engine (n8n/Temporal/Django Q) voor sequenties zoals intake → offerte → contract → project → factuur.
4. **Data & Rapportage**:
   - Unified datamodel dat leads, klanten, projecten, crew, facturen koppelt.
   - Power BI/Metabase dashboards voor conversieratio, omzet per pipeline, resourcebelasting.

## 3. CRM Fundering
### 3.1 Datamodel & API
- Maak `crm_leads`, `crm_contacts`, `crm_deals`, `crm_activities` tabellen met multi-tenant velden.
- API endpoints (`/api/crm/leads`, `/api/crm/deals`) met OAuth/tenant-isolatie.
- Synchroniseer bestaande Mr. DJ contactgegevens uit onboarding naar CRM via achtergrondtaak.

### 3.2 Pipeline Configuratie
- Definieer pipeline-stadia: **Nieuwe Lead → Kwalificatie → Offerte → Aanbetaling → Project Gereed → Evaluatie**.
- Voorzie mogelijkheden voor meerdere pipelines (bijv. Bruiloften, Zakelijk, Equipment-only).
- Voeg SLA-regels toe (max. responstijd 2 uur voor nieuwe leads, 24 uur voor offertes).

### 3.3 Communicatiestroom
- Koppel Microsoft 365/Exchange mailbox voor automatische e-mail logging.
- Implementeer WhatsApp Business API connector (scherm `apps/communication/whatsapp` uitbreiden).
- Centraliseer notities en taken in `crm_activities` met mentions voor crewleden.

## 4. Automatiseringstrajecten
### 4.1 Lead Intake → CRM
1. Websiteformulier op mr-dj.nl stuurt POST naar webhook.
2. Workflow-engine creëert lead + contact, stuurt geautomatiseerde bevestigingsmail met brochure.
3. Automatische taak voor sales (Bart) in CRM en notificatie in Microsoft Teams.

### 4.2 Offerte & Contract
1. Na kwalificatie start automatisering voor offerte op basis van pakkettemplates (Silver/Gold/Diamond/Platinum).
2. Documentgeneratie in Mr. DJ branding via PDF-service.
3. Bij acceptatie: Mollie betaalverzoek voor aanbetaling, deal-status naar *Aanbetaling*.

### 4.3 Project & Crew Planning
1. Na aanbetaling maakt workflow automatisch project in RentGuy backend (`0003_projects.py`).
2. Inventory check (uit `0002_inventory.py`) + crewmatching (Crew API) → notificaties naar crewportal.
3. Synchronisatie met Microsoft 365 agenda + ICS-bestanden naar klant.

### 4.4 Event Execution & Nazorg
1. 24u voor evenement: automatische checklistmail + SMS-reminder.
2. Na event: taak voor evaluatie, verstuur reviewverzoek en upsell-automatisering.
3. Factuurfinalisatie, boekhouding update en rapportage naar dashboard.

## 5. Technische Voorbereiding
- **Domain & SSL**: Configureer `mr-dj.rentguy.nl` in DNS + Let's Encrypt automatisering via Traefik (`docker-compose.rentguy.yml`).
- **Tenant Config**: Voeg Mr. DJ tenantconfig toe (`config.py` multi-tenant settings, themavariabelen, toegangsrollen).
- **CI/CD**: Update pipelines om mr-dj tenant-specifieke environment vars te deployen.
- **Monitoring**: Zet tracing/logging op (OpenTelemetry) voor CRM en workflow-events.
- **Security**: Implementeer RBAC voor sales/marketing/operations, 2FA via bestaande auth.

## 6. Data Migratie & Integraties
- Migreer historische leads/klanten vanuit huidige CRM (CSV import tool).
- Koppel bestaande facturatie (Invoice Ninja) via API voor volledige 360° klantbeeld.
- Zet connectoren op voor boekhouding (Exact Online) en marketing automation (Mailchimp/ActiveCampaign).

## 7. Test- & Acceptatieplan
1. **Unit & API Tests**: CRUD-tests voor CRM endpoints, workflow-trigger tests.
2. **Integratietests**: E2E-simulaties vanaf leadintake tot factuur.
3. **User Acceptance**: Scenario's met Bart (bruiloft lead, zakelijke lead, equipment-only aanvraag).
4. **Load & Failover**: Test 100 gelijktijdige leads + queue failover.

## 8. Roadmap & Planning
| Fase | Duur | Deliverables |
|------|------|--------------|
| Fase 1 – Foundation | Week 1-2 | Datamodel, API, tenantconfig, DNS/SSL |
| Fase 2 – CRM UI & Pipelines | Week 3-4 | CRM dashboards, pipeline configuratie, communicatiekoppelingen |
| Fase 3 – Automations | Week 5-7 | Workflow-engine, offerte/contract automatisering, crew sync |
| Fase 4 – Integraties & Rapportage | Week 8-9 | Invoice Ninja sync, dashboards, marketing connector |
| Fase 5 – UAT & Go-live | Week 10 | UAT-scripts, trainingsmateriaal, go-live checklist |

## 9. Governance & KPI's
- **Eigenaar**: Bart van de Weijer (Product Owner Mr. DJ), ondersteund door RentGuy Enterprise team.
- **KPI's**: lead-responstijd < 15 min, conversie van lead → project ≥ 35%, 90% automatisering van standaard taken, NPS ≥ 8.
- **Reviewmomenten**: Wekelijkse stand-ups, maandelijkse executive review, post-go-live evaluatie na 30 dagen.

## 10. Next Actions
1. Bevestig keuze workflow-engine en CRM UI requirements met Bart.
2. Start tenantconfig + DNS setup in sprint board.
3. Plan gezamenlijke workshop om automatiseringsflows te valideren.
4. Verzamel historische CRM-data en definieer importformaten.
