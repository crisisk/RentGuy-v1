# UAT Plan – Mr. DJ CRM & Automation

## Overzicht
- **Datum:** 17 maart 2025
- **Locatie:** RentGuy HQ + Teams breakout
- **Deelnemers:** Bart (Operations), Chantal (Sales), Sofie (Security), 2 planners
- **Scope:** CRM lead-to-cash, automation triggers, dashboarding

## Scenario's

| Nr | Scenario | Rollen | Verwachte uitkomst |
|----|----------|--------|--------------------|
| 1  | Lead intake vanaf marketing site | Sales, Operations | Lead verschijnt in CRM, automation `lead_intake` start en taak gecreëerd |
| 2  | Deal naar proposal stage | Sales | Stage update triggert WhatsApp + e-mail reminder, automation run zichtbaar |
| 3  | Mollie betaling afgerond | Finance | Status wijzigt in deal + automation run `proposal_followup` eindigt |
| 4  | Event afgerond → post care | Operations | Automations sturen survey, Metabase dashboard toont feedback |
| 5  | SSO login vanaf marketing site | Security | Gebruiker wordt automatisch ingelogd in portal zonder herauthenticatie |

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

| Scenario | Resultaat (Pass/Fail) | Opmerkingen | Ticket |
|----------|----------------------|-------------|--------|
|          |                      |             |        |
|          |                      |             |        |
|          |                      |             |        |

## Go/No-Go Checklist
- [ ] Alle scenario's **Pass**
- [ ] Automations < 2% failure-rate (Alertmanager)
- [ ] Monitoring dashboards gecontroleerd
- [ ] Stakeholder sign-off ontvangen

## Planning & voorbereiding
- **T-5 dagen:** Verstuur agenda + deel enablement kit (`docs/release/crm_mrdj_v1.md`).
- **T-3 dagen:** Run dress rehearsal met sandbox data, valideer `/api/v1/auth/sso` flow.
- **T-1 dag:** Freeze template updates via `cms/webhook_to_crm.py` en snapshot dashboards.
- **T+1 dag:** Consolideer bevindingen, plan eventuele hotfix sprint.

## Sign-off

| Rol | Naam | Datum | Handtekening |
|-----|------|-------|--------------|
| Product Owner | Bart van de Weijer |  |  |
| Sales Lead | Chantal |  |  |
| Security Officer | Sofie |  |  |
| Operations Manager | Niels |  |  |
