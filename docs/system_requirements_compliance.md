# Systeemeisen & Specificaties – Compliance Update (2025-10-10)

## Scope
- Bron: `fase_02_architectuur_en_requirements.md` (SOA op Docker + non-functionele eisen) en eerdere enterprise-plannen.
- Toetsing: backend-projectenmodule, nieuwe `/api/v1/projects/summary` endpoint en planner-frontend na UAT ronde 2.

## Overzicht status
| Domein | Requirement | Status | Bewijs / toelichting |
| --- | --- | --- | --- |
| Beschikbaarheid | Planner moet realtime status bieden | ✅ | Nieuwe summary-endpoint exposeert actuele aantallen en kritieke alerts; UI toont bronvermelding en fallback zodat zichtbaarheid behouden blijft. |
| Performance | API responstijd <200ms (target) | ⚠️ | Endpoint optimaliseert payload en hergebruikt serialisatie, maar mist nog metrics/monitoring; vervolgstap is APM integratie. |
| Performance | Core Web Vitals LCP <2.5s | ⚠️ | UI reduceert clientberekeningen dankzij server-side timeline_label, maar metingen in productie ontbreken nog; actiepunt om RUM tooling te koppelen. |
| Schaalbaarheid | Services via duidelijke API's | ✅ | `/api/v1/projects/summary` scheidt aggregatielogica van frontend en ondersteunt persona automatiseringen. |
| Beveiliging | Alle communicatie via HTTPS | ⚠️ | Geen regressie; documentatie benadrukt noodzaak voor Traefik/SSL, maar testomgeving draait nog lokaal. |
| Beveiliging | 0 kritieke kwetsbaarheden (SAST/DAST) | ⚠️ | Geen SAST-run tijdens deze iteratie; backlog bevat taak om security scans aan CI te koppelen. |
| Onderhoudbaarheid | 100% coverage voor nieuwe features | ⚠️ | Nieuwe endpoint heeft nog geen tests, maar hergebruik van serialisatie beperkt risico; opvolging vereist pytest uitbreidingen. |
| UX/UAT | 10 personas slagen | ✅ | Zie `docs/uat_results_personas_advanced.md` sectie 6; alle personas kregen verbeterde flows. |

## Verbeteringen deze iteratie
1. **Consistency Layer:** Server-side `_serialize_project` levert identieke metadata voor lijst, detail en mutatie-endpoints inclusief `timeline_label`.
2. **Operationele monitoring:** Nieuwe summary-endpoint bundelt status-, risico- en tijdsindicatoren, rechtstreeks zichtbaar in de UI en bruikbaar voor scripts (Peter/Sven).
3. **UAT feedbackloop:** Operationele signalen en persona-kaarten boven de planner maken het eenvoudiger om eisen uit de documentatie te toetsen tijdens tests.

## Openstaande acties
- Toevoegen van pytest-cases voor `/projects/summary` en contracttests voor `timeline_label`.
- Integreren van SAST/DAST en uptime-monitoring in de CI/CD pijplijn (fase 16 & 17).
- Aanvullen van deployment-documentatie met HTTPS-configuratie en RUM-meting (fase 2 & 12). 
