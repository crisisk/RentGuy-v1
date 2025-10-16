# Mr. DJ CRM & Automation Status – 10 maart 2025

## Backend & Automation
- Het CRM-servicelaag ondersteunt leads, deals, activities en automation-run logging per tenant, inclusief validaties op pipeline/stage-combinaties en optionele triggering van de workflow-engine wanneer een deal van stage wisselt.
- De interne workflow-engine laadt YAML-flows vanaf `automation/workflows`, registreert retry-policies en kan runs triggeren met JSON-serialiseerbare contexten.

## Frontend
- De Zustand-gebaseerde CRM-store implementeert tenant-aware caching (TTL 2 minuten) voor leads, deals en activities, biedt mutaties voor create/log/advance en ondersteunt handmatige invalidatie.
- De frontend-API-wrapper voorziet in CRUD-operaties, stage-advancement en automation-runoverzicht via `X-Tenant-ID` headers richting de backend.

## Actieve Automatiseringsflows
- Geconfigureerde workflows: `lead_intake`, `proposal_followup`, `post_event_care` – elk met beschrijvingen, triggers en retry-policy metadata klaar voor gebruik door de engine.

## Observability & Analytics
- Metabase dashboards en Alertmanager-monitoring voor automation-fouten zijn gedeployed; UAT draaiboek en enablement-kit staan nog op de planning voor afronding van fase F5.

## Openstaande Taken
- Website ↔ platform integraties: OAuth2 SSO, Lead Capture API en CMS → CRM webhooks.
- Operations & governance: RACI/support playbook, trainingstraject en security officer review.
- Fase F5 restpunten: UAT-sign-off en release-notes/enablement kit afronden.
- SSO-werkdocument vereist backend, marketing callback en smoke test voordat de taak kan worden afgevinkt.
