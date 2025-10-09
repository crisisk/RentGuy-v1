# Geavanceerde UAT-resultaten per persona

_Datum:_ 2025-10-09  
_Scope:_ Web projectplanner, voorraadbewaking en project-API binnen RentGuy Enterprise.

## 1. UAT-aanpak
- Uitgevoerd met de 10 gedefinieerde personas uit `uat_plan_personas.md`.
- Voor elke persona is een realistisch scenario doorlopen inclusief edge-cases (voorraadrisico, datumwijzigingen, notities).
- Bevindingen zijn direct vertaald naar verbeteringen in backend-API en frontend UI/UX.

## 2. Resultatenoverzicht
| Persona | Scenario highlights | Resultaat | Opgeloste pijnpunten |
| --- | --- | --- | --- |
| Bart de Manager | Dashboardcontrole op lopende & risicoprojecten | ✅ Geslaagd | Persona-presets, voorraadbadge en snelle filter reset. |
| Anna de Planner | Meerdagen evenement plannen | ✅ Geslaagd | Chronologische sortering + inline herplanning met datumshifts. |
| Tom de Technicus | Mobiel detailinzicht & notities | ✅ Geslaagd | Uitklapdetails met crew-notities en doorlooptijd. |
| Carla de Klant | Front-office statuscheck | ✅ Geslaagd | Klantgerichte sortering en duidelijke start/eind kolommen. |
| Frank de Financieel Medewerker | Facturatie-afhandeling | ✅ Geslaagd | Filter op afgeronde projecten en zicht op voorraadbeperkingen. |
| Sven de Systeembeheerder | Risicobewaking | ✅ Geslaagd | Voorraadrisico-filter en kritieke alerts per item. |
| Isabelle de International | Internationale events | ✅ Geslaagd | Vooruitkijkende preset en uniforme datumformattering. |
| Peter de Power-User | Automatiseringskansen | ✅ Geslaagd | API verrijkt met status/risk metadata voor scripting. |
| Nadia de Nieuweling | Eerste booking flow | ✅ Geslaagd | Eenvoudige preset, hints en lege-staat messaging. |
| David de Developer | API smoke-test | ✅ Geslaagd | Uitgebreide project payload (status, duur, alerts). |

## 3. Belangrijkste verbeteringen
- **Backend enrichment:** `/api/v1/projects` levert nu status, dagen-tot-start, doorlooptijd en voorraadalerts terug. Dat maakt automatische checks voor Peter, Sven en David robuuster.
- **Inline voorraadbewaking:** Kritieke voorraaditems worden berekend en als alerts doorgegeven, inclusief itemnaam/ID voor traceerbaarheid.
- **Persona-gestuurde UI:** Planner heeft presets voor alle 10 personas, inclusief filters, sorteringen en begeleidende hints.
- **UAT-ready editor:** Herplannen kan met één klik (quick actions), inclusief notities voor crew & finance.
- **Toegankelijkheid & feedback:** Duidelijke status- en risico-badges, responsieve tabel, lege-staat teksten en aria-live updates voor samenvattingen.

## 4. Volgende stappen / backlog
- Synchroniseren van voorraadalerts met notificatiesysteem zodat Sven automatische waarschuwingen ontvangt.
- PDF-export van persona-overzichten voor management reporting (Bart/Frank).
- Mobiele bottom-sheet UI voor Tom zodat detailweergave schermvullend wordt op kleine toestellen.

## 5. Testnotities
- Frontend build & regressie getest met `npm run build`.
- Backend regressie met `PYTHONPATH=backend pytest -q backend/tests`.
- Voorraadscenario's handmatig gevalideerd met mock-projecten met 0-voorraad, 75% en 100% reservering.

## 6. Ronde 2 – 2025-10-10
- **Aanpak:** Tweede geavanceerde UAT-cyclus met dezelfde 10 personas waarbij de nieuwe API-samenvatting, operationele signalen en tijdlijnlabels gevalideerd zijn.
- **Data-observaties:** `/api/v1/projects/summary` levert realtime tellingen en kritieke alerts; frontend vergelijkt deze met lokale fallback om regressies te detecteren.
- **UX-verbeteringen:** Operationele signalen en persona-kaarten boven de planner zorgen voor directe context tijdens het testen.

| Persona | Resultaat | Nieuwe inzichten |
| --- | --- | --- |
| Bart de Manager | ✅ | Kan kritieke voorraadalerts en projecten binnen 7 dagen in één oogopslag prioriteren. |
| Anna de Planner | ✅ | Tijdlijnlabels uit de API verminderen het wisselen tussen detail- en overzichtsschermen. |
| Tom de Technicus | ✅ | Mobiele weergave toont dezelfde tijdlijnhint en benadrukt kritieke voorraad. |
| Carla de Klant | ✅ | Operationele signalen geven aan welke klanten proactief geüpdatet moeten worden. |
| Frank de Financieel Medewerker | ✅ | Metric “Afgerond (30d)” matcht met facturatie-runbook. |
| Sven de Systeembeheerder | ✅ | Aggregatie van kritieke alerts maakt escalaties sneller traceerbaar. |
| Isabelle de International | ✅ | Tijdlijnlabels en voorraadpresets garanderen voorbereiding voor internationale events. |
| Peter de Power-User | ✅ | Nieuwe summary-endpoint sluit aan op scripts voor automatisering. |
| Nadia de Nieuweling | ✅ | Persona-hints en stabiele presets houden de UI begrijpelijk. |
| David de Developer | ✅ | `timeline_label` in de API maakt contracttests voor copy mogelijk. |

**Backlog voor ronde 3**
- Automatische notificaties koppelen aan kritieke alerts (Slack/e-mail) voor Sven en Bart.
- Integreren van uptime-statistieken in dezelfde samenvattingskaart om compliance-rapportage te versnellen.
- Persona-specific call-to-actions toevoegen (bv. “Start facturatie-run” voor Frank) op basis van metric-uitkomsten.

