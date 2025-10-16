# NOC Monitoring Validatie – Dry-Run Resultaten

- **Datum:** 18 maart 2025
- **Deelnemers:** NOC Lead (Marieke Vos), Operations Engineer (Jasper K.), SRE (Levi D.)
- **Scope:** Validatie van dashboards, alerting en SLA-checks voor RentGuy Enterprise go-live

## Testscenario's
| Scenario | Trigger | Verwacht Gedrag | Resultaat |
|---|---|---|---|
| 1. Database CPU spike | Gesimuleerde load test via k6 | Alert `DB_CPU_HIGH` binnen 2 min in PagerDuty | PASS – alert verstuurd en bevestigd |
| 2. Stripe webhook failure | 500-response geforceerd | Alert `BILLING_WEBHOOK_ERRORS` naar Slack `#noc-alerts` | PASS – Slack melding + ticket aangemaakt |
| 3. Inventory sync vertraging | Cronjob vertraagd met 15 min | Dashboard toont rode status, alert naar Operations | PASS – dashboard en e-mail naar operations |

## Validatiepunten
- Dashboards tonen real-time data met <10s refresh.
- Alert routing naar PagerDuty en Slack bevestigd.
- SLA rapportage export getest en gedeeld met management.

## Acties na dry-run
- [x] PagerDuty runbook gelinkt vanuit alertbeschrijvingen.
- [x] Slack-notificaties verrijkt met directe runbook link.
- [x] Incident response oefening gepland voor Q2 (informatief).

## Bewijs
- Screenshots opgeslagen in `artifacts/noc_dry_run_2025-03-18/`
- PagerDuty incident log referentie: `INC-2025-03-18-01`
