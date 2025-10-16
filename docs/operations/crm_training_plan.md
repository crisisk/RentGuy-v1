# CRM Training Plan – Sales & Operations

## Doelgroep
- Sales team (5 personen)
- Operations planners (3 personen)
- Customer success (2 personen)

## Leerdoelen
1. Leads kunnen filteren, kwalificeren en omzetten naar deals.
2. Automations begrijpen en weten hoe status + logs te controleren.
3. Metabase dashboards interpreteren voor pipeline velocity en SLA.
4. Basis troubleshooting uitvoeren (leadcapture, WhatsApp, Mollie flows).

## Programma (2,5 uur)

| Tijd | Onderdeel | Inhoud | Materiaal |
|------|-----------|--------|-----------|
| 00:00 – 00:15 | Intro & doelstellingen | Overzicht CRM, tenants, rollen | Slides deck (link in Notion) |
| 00:15 – 00:45 | Lead Intake | Live demo, capture API, tenant switch | Demo tenant `mrdj-training` |
| 00:45 – 01:15 | Deal kanban & automation timeline | Stage advancement + trigger logs | Sandbox data set |
| 01:15 – 01:35 | Integraties | Mollie, WhatsApp, Microsoft 365 sync | Video walkthrough |
| 01:35 – 02:05 | Reporting | Metabase dashboards, export flows | Dashboard "CRM/MrDJ" |
| 02:05 – 02:30 | Hands-on oefeningen | Breakout rooms met checklist | `docs/qa/automation_templates.md` |

## Voorbereiding
- Maak oefenaccounts aan (`seed_bart_user.py` gebruiken voor basisdata).
- Zorg dat `uat/crm_mrdj_uat.md` scenario's in demo tenant geladen zijn.
- Verstuur agenda-invite + hand-out 2 dagen vooraf.
- Boek vergaderruimte + Teams meeting (host: operations lead).
- Neem sessie op en archiveer recording in SharePoint map `Training/MrDJ`.
- Stuur follow-up survey link binnen 1 uur na afronding.

## Evaluatie
- Verzamel feedback via Typeform (link in enablement kit).
- Review recordings en update FAQ in `OPERATIONS.md`.
- Plan refresh sessie na 30 dagen voor nieuwe medewerkers.
- Deel resultaten met Bart + CS lead tijdens wekelijkse sync.
