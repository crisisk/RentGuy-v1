# Systeemeisen- en specificatiecheck – 2025-10-10

## Bronmateriaal
- `fase_02_architectuur_en_requirements.md` – doelarchitectuur en non-functionele requirements.
- `docs/uat_plan_personas.md` & `docs/uat_results_personas_advanced.md` – functionele flows per persona.

## Samenvatting
| Domein | Requirement (fase 2) | Status | Observaties | Actie |
| --- | --- | --- | --- | --- |
| Beschikbaarheid | 99.9% uptime, monitoring via externe service | ⚠️ Gedeeltelijk | Health checks aanwezig maar geen automatische uptime monitoring aangesloten op productie. | Integreren met uptime tooling en rapporteren in observability-stack. |
| Performance | 95% API-calls < 200ms, LCP < 2.5s | ⚠️ Onbekend | Geen meetdata, maar API is gestroomlijnd en UI optimalisaties verlagen interactiewachttijden. | Opzetten APM/RUM en dashboard met targets. |
| Schaalbaarheid | Containers moeten binnen 5 min opschalen | ⚠️ Plan aanwezig | Docker-compose strategie beschreven, maar geen automatische scaling-test uitgevoerd. | Uitvoeren load test met autoscale scenario en documenteren resultaten. |
| Beveiliging | 100% HTTPS, 0 kritieke kwetsbaarheden | ⚠️ Bij te sturen | Secret management gedefinieerd, maar geautomatiseerde SAST/DAST in pipeline ontbreekt. | Toevoegen security scans aan CI/CD en rapportage delen. |
| Onderhoudbaarheid | 100% coverage voor nieuwe features | ⚠️ In uitvoering | Namespace-conflicten met standaardbibliotheken zijn verwijderd waardoor FastAPI-tests weer kunnen draaien, maar unit/integration tests voor countdown & persona-guidance ontbreken. | Schrijven van componenttests en API-contracttests. |
| Persona UX & flows | Alle 10 persona-scenario's slagen | ✅ Behaald | Tweede UAT-iteratie bevestigt verbeterde cockpit en consistente API-responses. | Blijvend UAT-schema onderhouden per release. |

## Detailobservaties
### Architectuur & services
- De SOA-richtlijnen worden gevolgd: projectroutes leveren nu consequent verrijkte `ProjectOut` payloads voor zowel lijst-, detail- als update-endpoints.
- Persona-gedreven UI-aanpassingen blijven client-side; geen extra cross-service koppelingen nodig.
- De oude Flask-demo modules (`app.py`, `http.py`, `logging.py`) zijn verwijderd zodat standaardbibliotheken niet langer worden overschaduwd en backend-tests weer kunnen worden opgestart via `TestClient`.

### UX & persona's
- Countdown-badges en guidance-kaarten ondersteunen planning, risicomanagement en onboarding flows.
- Filter- en sorteerkeuzes worden lokaal onthouden waardoor terugkerende gebruikers (Bart, Sven) sneller hun kritieke werk zien.

### Openstaande risico's
- Zonder geautomatiseerde monitoring blijven uptime- en performance-SLA's niet aantoonbaar.
- Gebrek aan geautomatiseerde tests verhoogt regressierisico, vooral bij verdere iteraties op plannerlogica.
- Securityscans ontbreken; bestaande secret management moet worden aangevuld met pipeline-controles.

## Aanpak volgende iteratie
1. **Observability uitbreiden:** configureer uptime monitoring en publiceer dashboards met de gedefinieerde KPI's.
2. **Testdekking verhogen:** voeg componenttests toe voor de planner (countdown, guidance) en API-contracttests voor `PUT /projects/{id}/dates`.
3. **Security automation:** integreer SAST/DAST in CI/CD en registreer resultaten om te voldoen aan de 0-kritieke-kwetsbaarheden eis.
4. **Persona workflows borgen:** automatiseer smoke-scenario's voor de 10 persona's zodat regressies sneller zichtbaar zijn.
