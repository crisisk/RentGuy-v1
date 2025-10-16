# CRM Automation Template QA Checklist

Deze checklist wordt gebruikt voordat workflow-templates naar een nieuwe tenant
gekopieerd worden. Alle items moeten op ✅ staan voordat de workflow beschikbaar
wordt gemaakt in productie.

## 1. Functionele Validatie

1. **Trigger mapping gecontroleerd** – alle `triggers` in het YAML-bestand zijn
   gedocumenteerd in het CRM event-model en bestaan in de event-bus.
2. **Fallback scenario's beschreven** – elke workflow heeft een fallback voor
   wanneer een koppeling (Mollie, WhatsApp, e-mail) niet bereikbaar is.
3. **Idempotency gewaarborgd** – workflows gebruiken een `run_id` of
   `automation_run_id` zodat dubbele triggers geen dubbele acties veroorzaken.
4. **SLA's afgestemd** – de `metadata.sla_minutes` sluit aan bij het support-
   en operations-playbook.
5. **Branding tokens aanwezig** – `{{brand.primary_color}}` en
   `{{brand.logo_url}}` komen minimaal één keer voor in de notificatie-templates.

## 2. Data & Security

6. **Tenant-scheiding** – alle API-calls bevatten `X-Tenant-ID` of draaien op
   tenant-specifieke queues.
7. **PII logging** – er wordt geen persoonlijk identificeerbare informatie
   gelogd buiten de secure logging bucket.
8. **Retention policy** – workflow output verwijst naar de bewaartermijnen uit
   `security/crm_data_retention.md`.
9. **Audittrail** – `crm_automation_runs` bevat voldoende context (trigger,
   workflow_id, status, timestamps) voor forensische analyse.
10. **Rate limits** – integraties hebben expliciete rate-limit guards zodat de
    workflow zichzelf pauzeert bij HTTP 429/503.

## 3. Notificaties & Communicatie

11. **Taalgebruik** – copy is gecontroleerd door marketing (NL + EN varianten).
12. **Fallback kanaal** – bij mislukte WhatsApp/e-mail notificaties wordt een
    taak aangemaakt in het CRM.
13. **Opt-out respecteren** – workflows checken de unsubscribe-status van de
    contactpersoon voordat er berichten verstuurd worden.
14. **Template versies** – het versienummer van e-mail/WhatsApp templates is
    vastgelegd in `metadata.template_version`.
15. **Monitoring hooks** – elk verstuurd bericht rapporteert naar de Grafana
    "Automation Throughput" dashboard.

## 4. Observability & Incident Response

16. **Alerting** – Alertmanager rules staan ingesteld op failure-rate > 2% in
    10 minuten voor alle actieve flows.
17. **Dashboards** – Metabase dashboard "Automation SLA" bevat visualisaties
    voor het aantal runs, gemiddelde doorlooptijd en error-rate per workflow.
18. **Runbook gelinkt** – voor elke workflow staat een link naar het runbook in
    `docs/operations/crm_support_playbook.md`.
19. **Chaos-test** – er is minimaal één negatieve test uitgevoerd (bijv. CRM API
    unavailable) en de workflow herstelt volgens het retry-beleid.
20. **Synthetic checks** – kritieke flows hebben een synthetic trigger in de
    staging-omgeving die dagelijks draait.

## 5. UAT & Stakeholder Sign-off

21. **Scenario testcases** – de UAT-sessie bevat minimaal één scenario per
    workflow met verwachte uitkomsten.
22. **Stakeholder akkoord** – marketing, operations en finance hebben het
    sign-off-formulier getekend (zie `docs/UAT/crm_mrdj_uat.md`).
23. **Documentatie up-to-date** – wijzigingen staan in `docs/release/crm_mrdj_v1.md`.
24. **Training materiaal** – er is een korte Loom of PowerPoint opgenomen voor
    het salesteam (zie `docs/operations/crm_training_plan.md`).
25. **Rollback-plan** – beschreven in `docs/operations/crm_support_playbook.md`
    inclusief stappen om automations tijdelijk te pauzeren.

> **Tip:** gebruik `automation/tools/clone_templates.py --dry-run` om vooraf te
> zien welke bestanden worden gekopieerd en welke tokens vervangen worden.
