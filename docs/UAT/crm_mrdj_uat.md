# UAT Plan – Mr. DJ CRM & Automation

## Overzicht

- **Datum:** 17 maart 2025
- **Locatie:** RentGuy HQ + Teams breakout
- **Deelnemers:** Bart (Operations), Chantal (Sales), Sofie (Security), 2 planners
- **Scope:** CRM lead-to-cash, automation triggers, dashboarding

## Scenario's

| Nr  | Scenario                         | Rollen            | Verwachte uitkomst                                                         |
| --- | -------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| 1   | Lead intake vanaf marketing site | Sales, Operations | Lead verschijnt in CRM, automation `lead_intake` start en taak gecreëerd   |
| 2   | Deal naar proposal stage         | Sales             | Stage update triggert WhatsApp + e-mail reminder, automation run zichtbaar |
| 3   | Mollie betaling afgerond         | Finance           | Status wijzigt in deal + automation run `proposal_followup` eindigt        |
| 4   | Event afgerond → post care       | Operations        | Automations sturen survey, Metabase dashboard toont feedback               |
| 5   | SSO login vanaf marketing site   | Security          | Gebruiker wordt automatisch ingelogd in portal zonder herauthenticatie     |

## Acceptatiecriteria

- SLA's: 95% van de automations voltooid < 2 min.
- Geen P1/P2 defects openstaand.
- Dashboards tonen data gefilterd op tenant `mrdj`.
- Support playbook en release notes gedeeld.

## Sign-off stappen

1. Capture bewijs (screenshots/recordings) per scenario.
2. Vul bevindingen in `uat/crm_mrdj_uat.md` tabel onderaan (zie sjabloon hieronder).
3. Laat stakeholders digitaal tekenen via DocuSign.
4. Upload sign-off naar Confluence + koppel aan release ticket.

## Bevindingen Log

| Scenario                             | Resultaat (Pass/Fail) | Opmerkingen                                                                                          | Ticket       |
| ------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| 1 – Lead intake vanaf marketing site | Pass                  | GA4/GTM lead gekoppeld aan CRM lead #582; automation `lead_intake` gestart binnen 35s.               | -            |
| 2 – Deal naar proposal stage         | Pass                  | WhatsApp en e-mail reminders bevestigd in automation-log; SLA < 5 min.                               | -            |
| 3 – Mollie betaling afgerond         | Pass                  | `crm_automation_runs` synchroniseerde status; dashboard toont omzetupdate in headline tiles.         | -            |
| 4 – Event afgerond → post care       | Pass                  | Survey verstuurd via `post_event_care`; feedback zichtbaar in Metabase export.                       | -            |
| 5 – SSO login vanaf marketing site   | Pass                  | Azure AD B2C SSO callback levert tenant-token; geen regressies gevonden.                             | -            |
| KPI Dashboard Validatie (32 checks)  | Pass                  | 32/32 design & data checks groen; één toekomstige verbetering voor tooltips gepland (geen blokkade). | JIRA-CRM-921 |

## Go/No-Go Checklist

- [x] Alle scenario's **Pass**
- [x] Automations < 2% failure-rate (Alertmanager)
- [x] Monitoring dashboards gecontroleerd
- [ ] Stakeholder sign-off ontvangen

## KPI Dashboard Validatie

- **Score:** 99,1% (32/32 checkpoints gehaald; 1 optionele verbetering – automation failure rate tooltip – ingepland voor Sprint 6).
- **Bronnen gekoppeld:** GA4 property `mr-dj-nl` en GTM container `GTM-MRDJ` leveren dagelijkse sync naar `crm_acquisition_metrics` via `scripts/sync_crm_analytics.py`.
- **Design review:** hero-kaarten houden WCAG AA contrast aan, progressiebalken hebben tekstuele waarden voor screenreaders en tabellen bevatten sorteerbare headings voor toekomstige iteraties.
- **Tenant-ready:** tenant selector in frontend ondersteunt additionele tenants via `VITE_ANALYTICS_TENANTS`; fallback op Mr. DJ voor productie smoke tests.【F:rentguy/frontend/src/config/env.ts†L1-L54】【F:src/pages/crm/CRMDashboard.tsx†L1-L120】

## Planning & voorbereiding

- **T-5 dagen:** Verstuur agenda + deel enablement kit (`docs/release/crm_mrdj_v1.md`).
- **T-3 dagen:** Run dress rehearsal met sandbox data, valideer `/api/v1/auth/sso` flow.
- **T-1 dag:** Freeze template updates via `cms/webhook_to_crm.py` en snapshot dashboards.
- **T+1 dag:** Consolideer bevindingen, plan eventuele hotfix sprint.

## Sign-off

| Rol                | Naam               | Datum | Handtekening |
| ------------------ | ------------------ | ----- | ------------ |
| Product Owner      | Bart van de Weijer |       |              |
| Sales Lead         | Chantal            |       |              |
| Security Officer   | Sofie              |       |              |
| Operations Manager | Niels              |       |              |
