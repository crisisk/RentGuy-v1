# Tenant Rollout QA Checklist

Gebruik deze checklist tijdens week 0-1 van een nieuwe tenant onboarding. Het
is een uitbreiding op de algemene GO LIVE checklist en focust op multi-tenant
CRM & automation enablement.

## Voorbereiding (Dag 0)
- [ ] Provisioning configuratie ingevuld (`configs/tenants/<tenant>.json`).
- [ ] `scripts/provision_tenant.py` succesvol gedraaid; namespace + secrets
      aangemaakt.
- [ ] DNS-records gevalideerd (app + metabase subdomein) en TLS-certificaten
      aangevraagd.

## Data & CRM Setup (Dag 1)
- [ ] Database seed uitgevoerd (`db/seeds/crm/seed_tenant.sql`).
- [ ] CRM pipelines en stages gecontroleerd; automation_flow velden gevuld.
- [ ] `automation/tools/clone_templates.py --tenant <tenant>` gedraaid en output
      opgeslagen in Git.
- [ ] Tenantspecifieke branding tokens getest via Storybook of lokale UI.

## Frontend & Branding (Dag 2)
- [ ] Whitelabel branding tokens geconfigureerd (`rentguy/frontend/src/tenants`).
- [ ] CRM routes zichtbaar in portal; toegang gebaseerd op rollen.
- [ ] Accessibility smoke test (`npm run test:a11y -- --scope=crm`) zonder
      blocking issues.

## Integraties & QA (Dag 3)
- [ ] OAuth2/SAML SSO smoke test uitgevoerd (marketing site → platform).
- [ ] Lead capture API getest met rate-limit & captcha scenario.
- [ ] Integratie smoke tests (`pytest -m tenant_smoke --tenant=<tenant>`) groen.
- [ ] Metabase dashboards geladen met tenant filters.

## UAT & Go-live (Dag 4-5)
- [ ] UAT-sessie gepland en draaiboek gedeeld (`docs/UAT/crm_mrdj_uat.md`).
- [ ] Support playbook gedeeld met operations (`docs/operations/crm_support_playbook.md`).
- [ ] Trainingsmateriaal beschikbaar (video + oefenaccounts).
- [ ] Release notes gepubliceerd (`docs/release/crm_mrdj_v1.md`).
- [ ] Security officer review afgerond (`security/crm_data_retention.md`).

## Post Go-live
- [ ] Monitoring dashboards gecontroleerd (Grafana + Alertmanager).
- [ ] Automation throughput vergeleken met baseline; afwijkingen onderzocht.
- [ ] Retro gepland met sales/operations voor week +1.
