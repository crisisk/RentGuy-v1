# Plan van aanpak – Iteratie 3 vervolg

_Datum:_ 2025-10-11  \
_Doel:_ voortbouwen op de derde geavanceerde UAT-run door resterende risico's versneld op te lossen en de applicatie voor te bereiden op productiecertificatie.

## 1. Samenvatting huidige status
- Persona-UAT is drie keer succesvol afgerond; de cockpit is stabiel in dagelijks gebruik.
- Backend namespace-conflicten zijn opgelost, waardoor geautomatiseerde tests weer kunnen draaien.
- Onboarding overlay en contextuele tips zijn opnieuw actief na de Vite-migratie.
- Observability, geautomatiseerde kwaliteitscontroles en performance-optimalisaties blijven openstaande thema's.

## 2. Prioriteiten & acties
| Prioriteit | Thema | Acties | Eigenaar | Gereed |
| --- | --- | --- | --- | --- |
| P1 | Observability & SLA's | Prometheus-metrics + `/metrics` endpoint + cockpitstatuspaneel live; volgende stap is UptimeRobot koppelen voor externe alerts en rapportage. | Platform team | Week 42 |
| P1 | Testdekking | Schrijven van componenttests voor countdown/guidance en API-contracttests voor `PUT /projects/{id}/dates`. Integreren in CI. | QA + Frontend | Week 42 |
| P1 | Security | Toevoegen van SAST (Bandit) en dependency scanning aan de pipeline; documenteer zero-critical policy. | Security | Week 43 |
| P2 | Performance | Introduceren van code-splitting/lazy loading voor zware plannerpanelen en instellen van bundelmonitoring. | Frontend | Week 43 |
| P2 | Persona automatisering | Definiëren van smoke-scripts per persona (Playwright) en plannen van nachtelijke runs. | QA | Week 44 |
| P3 | Kennisoverdracht | Updaten van runbooks en onboardingmateriaal voor supportteams inclusief nieuwe cockpitflows. | Enablement | Week 44 |

## 3. Risico's & mitigatie
- **Monitoring-gap:** zonder productie-uptime monitoring blijven SLA's niet aantoonbaar. _Mitigatie:_ prioriteit 1 en opnemen als Go/No-Go criterium.
- **Testschuld:** nieuwe plannerlogica blijft ongedekt en kan regressies introduceren. _Mitigatie:_ minimale testdekking verplicht voordat stories afgerond worden.
- **Performance-waarschuwing:** bundel >500 kB. _Mitigatie:_ code-splitting en bundelrapportage (zie prioriteit P2).
- **Security-automatisering:** zonder scans blijven kwetsbaarheden onopgemerkt. _Mitigatie:_ security-team koppelen aan pipeline update.

## 4. Volgende evaluatiemomenten
- **Week 42:** Review voortgang observability + testdekking, demo van componenttests.
- **Week 43:** Performance-check en security-scan rapportage.
- **Week 44:** Integrale go/no-go meeting met UAT-samenvatting en overdrachtschecklist.

## 5. Bijlagen
- `docs/system_requirements_compliance.md`
- `docs/uat_results_personas_advanced.md`
- `docs/uat_plan_personas.md`
