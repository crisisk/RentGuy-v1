# Status systeemeisen & specificaties

_Datum:_ 2025-10-10  
_Bronnen:_ `fase_02_architectuur_en_requirements.md`, `rentguy_enterprise_plan.md`, geavanceerde UAT-rerun.

## 1. Overzichtstabel
| Categorie | Doelstelling uit specificaties | Huidige status | Bewijs / recente verbetering | Volgende stap |
| --- | --- | --- | --- | --- |
| Beschikbaarheid | 99.9% uptime, centrale monitoring | ⚠️ In uitvoering | Compliance-checklist in planner visualiseert uptime-roadmap; alertdetails ondersteunen escalaties voor Bart & Sven. | Uptime-monitoring activeren in infrastructuurstack en automatiseren van escalaties. |
| Performance | 95% API-calls < 200ms, snelle UI | ✅ Op koers | Projects API retourneert compacte, uniforme payload met duur/dagen/alerts; frontend toont directe risico-outlook en zoekresultaten. | Toevoegen van RUM/metrics dashboard (fase 13) om real-user data te meten. |
| Beveiliging | OWASP Top 10 mitigaties, HTTPS-only | ⚠️ Verbeterd | Consistente validatie en foutafhandeling in project endpoints, uitgebreide inventory alerts voor audittrail-ready logging. | Security scans integreren in CI en secret management automatiseren. |
| Onderhoudbaarheid | Gestandaardiseerde code & testcoverage | ✅ Voldoet voor planner & projecten | Backend re-used `_compose_project_out` voor alle routes; clipboard export en doc updates documenteren UAT-scope. | Uitbreiden met automatische contracttests voor API-consumer scripts. |

## 2. Verdere observaties
- **Data consistentie:** `inventory_alerts_detailed` levert gestructureerde data voor logging en notificatie services, in lijn met SOA-principes.
- **Persona alignment:** Bewaarde presets en compliancecards sluiten aan bij businessdoelen uit `uat_plan_personas.md` en verminderen adoptiefrictie.
- **Documentatie:** Nieuwe UAT-rerunrapport en compliance-status houden stakeholders synchroon met roadmap uit `rentguy_enterprise_plan.md`.

## 3. Aanbevolen acties
1. Automatische uptime-monitoring inzetten (UptimeRobot/Grafana) en resultaten tonen in dezelfde cockpit.
2. CI uitbreiden met SAST/DAST zodat beveiligingsstatus naar ✅ kan verschuiven.
3. Opzetten van contracttests of schema validators voor externe API-consumenten (vooral voor Peter en David).
4. Mobiele optimalisaties (bottom-sheet) plannen voor Tom om performance & UX te borgen op kleinere schermen.
