# Mr. DJ CRM KPI Dashboard Plan

## 1. Module Scan

- **Backend data sources**
  - `crm_leads`, `crm_deals`, `crm_pipeline_stages`, `crm_activities`, en `crm_automation_runs` worden ontsloten via de FastAPI CRM-module en bevatten tenant-id, waardes, probabiliteit en timestamps voor lifecycle-analyse.【F:backend/app/modules/crm/models.py†L1-L115】
  - Het nieuwe aggregatie-endpoint `GET /api/v1/crm/analytics/dashboard` levert geconsolideerde headline-, funnel-, pipeline- en automation-metrics voor de Mr. DJ tenant.【F:backend/app/modules/crm/routes.py†L73-L94】
  - `crm_acquisition_metrics` slaat GA4/GTM sessies, gebruikers, conversies en omzet per tenant/kanaal op; de pipeline `scripts/sync_crm_analytics.py` houdt deze data up-to-date.【F:backend/app/modules/crm/models.py†L152-L190】【F:scripts/sync_crm_analytics.py†L1-L12】
- **Automatisering**
  - Workflowruns worden gelogd met status, trigger en `completed_at`, waarmee SLA- en failure-rate berekeningen kunnen worden gemaakt.【F:backend/app/modules/crm/models.py†L117-L150】
- **Frontend**
  - De CRM-store gebruikt reeds caching voor leads/deals en kan het dashboard-endpoint consumeren voor widgets (geen extra auth vereist buiten `X-Tenant-ID`).【F:rentguy/frontend/src/stores/crmStore.ts†L1-L120】

## 2. KPI-selectie voor één dashboard

1. **Lead funnel**
   - Totaal aantal leads, leads laatste 30 dagen, unieke leads met deals, conversieratio (leads → opportunity).
2. **Pipeline performance**
   - Totale en gewogen pipeline-waarde per stage, deal-count en gemiddelde leeftijd (dagen) per stage.
3. **Sales velocity & bookings**
   - Open deals, gewonnen deals 30 dagen, verliespercentages, gemiddelde dealwaarde, pipeline velocity (omzet/dag) en forecast voor komende 30 dagen.【F:backend/app/modules/crm/service.py†L236-L282】
4. **Marketing acquisition (GA4/GTM)**
   - GA4 sessies, nieuwe gebruikers, engagement, conversies/omzet, GTM-conversies en blended conversion rate + actieve connectors.【F:backend/app/modules/crm/service.py†L284-L323】
5. **Automation health**
   - Runs per workflow, failure-rate, gemiddelde afhandeltijd, SLA-breaches (>10 min) en actieve workflows.
6. **Operational watchlist** (uit te breiden)
   - Activiteiten per kanaal (WhatsApp, e-mail), open taken ouder dan SLA, escalaties uit automation context.

## 3. Dashboard lay-out

1. **Hero tiles (bovenaan)**
   - Weighted pipeline value, won value 30d, conversion rate, automation failure rate.
2. **Lead funnel visual (links)**
   - Trechter met stappen: Leads → Deals → Won (gebaseerd op aggregaat).
3. **Pipeline board (midden)**
   - Stage tabel/heatmap met deal-count, waarde, gemiddelde leeftijd en waarschuwing bij >14 dagen.
4. **Automation monitor (rechts)**
   - Tabellen voor workflow-runs en SLA-breaches, plus sparkline met gemiddelde doorlooptijd.
5. **Operational backlog (onder)**
   - Top 10 deals zonder activiteit >7 dagen en automation runs met status `failed`.

## 4. Implementatiestappen

1. **Backend**
   - [x] Dashboard endpoint implementeren met headline-, funnel-, pipeline-, sales- en acquisition-berekeningen.【F:backend/app/modules/crm/service.py†L214-L333】
   - [x] GA4/GTM ingestiescript `scripts/sync_crm_analytics.py` toevoegen zodat blended metrics periodiek geladen worden.【F:scripts/sync_crm_analytics.py†L1-L12】
   - [ ] Voeg optionele filters toe (`?pipeline_id=`, `?stage=`, `?date_from=`) voor segmentatie zodra marketing meerdere pakketten draait.
2. **Data modellering**
   - [x] Tabel `crm_acquisition_metrics` opnemen in Alembic-migratie voor opslag van GA4/GTM statistieken per tenant/kanaal.【F:backend/alembic/versions/2025_03_01_add_crm_tables.py†L71-L109】
   - [ ] Creëer SQL-view `crm_pipeline_velocity` (PostgreSQL) die per stage de gemiddelde leeftijd en doorlooptijd registreert voor Metabase adhoc-queries.
   - [ ] Voeg materialized view `crm_automation_sla` toe met SLA breaches per dag voor Alertmanager integratie.
3. **Metabase**
   - [ ] Maak dashboard "MrDJ CRM KPI" met tiles:
     - Custom question: `headline.total_pipeline_value` & `headline.weighted_pipeline_value`.
     - Funnel visual uit endpoint data of via view `crm_pipeline_velocity`.
     - Table card voor automation workflows (gesorteerd op failure rate >0).
   - [ ] Configureer refresh 5 minuten via Metabase pulse + Slack-alert bij failure-rate > 0.3.
4. **Frontend**
   - [x] Voeg dashboard-widget toe in CRM-overzichtspagina die data haalt via nieuwe endpoint en hero tiles + charts rendert.【F:rentguy/frontend/src/pages/CRMDashboard.tsx†L1-L301】
   - [x] Hergebruik bestaande Zustand store (`crmStore.ts`) om dashboard-data te cachen met TTL 60s.【F:rentguy/frontend/src/stores/crmStore.ts†L1-L214】
5. **Operations & Governance**
   - [ ] Werk `docs/operations/crm_support_playbook.md` bij met procedure voor escalaties wanneer automation failure rate >30% of SLA-breach trend stijgt.
   - [x] Voeg KPI-paragraaf toe aan `docs/UAT/crm_mrdj_uat.md` zodat UAT-sessie dashboards controleert.【F:docs/UAT/crm_mrdj_uat.md†L41-L80】
   - [x] Documenteer GA4/GTM connectorconfiguratie en fallback-strategie (dit document + `.env` guidance).

## 6. Design review & UAT-resultaat

- De front-end dashboards zijn herschreven met toegankelijke hero-kaarten, lead-funnel progressiebalken, sales velocity kaarten en marketing-sourcen tabellen die de volledige backend KPI-set weerspiegelen. Kleuren en contrast sluiten aan bij de RentGuy design tokens en voldoen aan WCAG AA voor de belangrijkste teksten.【F:rentguy/frontend/src/pages/CRMDashboard.tsx†L65-L297】
- Tijdens de UAT dry-run (11 maart) door Bart en Chantal scoorden de nieuwe widgets 32 van de 32 controlepunten (100%) op de dashboard-sectie; de volledige Mr. DJ UAT-checklist haalde 99,1% doordat één minor verbeterpunt (tooltips voor automation failure rate) gepland staat voor de volgende sprint.【F:docs/UAT/crm_mrdj_uat.md†L81-L118】

## 5. Volgende acties

- Plan Metabase implementatie met data-team (Bart/BI) en koppel dashboard aan service account.
- Automatiseer wekelijkse export van dashboard-snapshots naar Confluence voor managementrapportage.
- Evalueer binnen 2 weken of extra KPI's (churn, NPS) nodig zijn voor multi-tenant rollout en breid endpoint uit.
- Vul `CRM_ANALYTICS_SOURCES` aan voor komende tenants (wedding, corporate) en koppel hun GA4/GTM credentials aan de pipeline.

## 7. Sales readiness uitvoering

- Het CRM-dashboard bevat nu een "Plan & uitvoering"-paneel dat de vijf sales enablement-stappen toont met actuele statusbadges, voortgangspercentage en concreet bewijs per stap zodat het team weet wat nog gepland, bezig of afgerond is.【F:src/pages/crm/CRMDashboard.tsx†L288-L327】
- De guidance-card onder "Sales momentum" is herzien zodat accountmanagers direct een follow-upactie krijgen na het voltooien van de CRM-sync, passend bij de 100% sales ready-doelstelling.【F:src/pages/crm/CRMDashboard.tsx†L399-L452】
