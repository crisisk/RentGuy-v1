# Geavanceerde UAT-resultaten per persona

_Datum:_ 2025-10-09 & 2025-10-10 (iteratie 2)
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
- **Iteratie 2 enhancements:** Countdown-kolom, persona-acties en filterpersistente opslag zorgen dat de cockpit inspeelt op feedback uit de tweede UAT-run.

## 4. Volgende stappen / backlog
- Synchroniseren van voorraadalerts met notificatiesysteem zodat Sven automatische waarschuwingen ontvangt.
- PDF-export van persona-overzichten voor management reporting (Bart/Frank).
- Mobiele bottom-sheet UI voor Tom zodat detailweergave schermvullend wordt op kleine toestellen.
- Personalisatie van guidance-kaarten met taaklijsten uit het takenpakket (integratie met crew module).

## 5. Testnotities
- Frontend build & regressie getest met `npm run build`.
- Backend regressie met `PYTHONPATH=backend pytest -q backend/tests`.
- Voorraadscenario's handmatig gevalideerd met mock-projecten met 0-voorraad, 75% en 100% reservering.
- Iteratie 2 bevestigde dat opgeslagen filters en countdown-inzichten consistent werken na pagina-refreshes en detailupdates.

## 6. Iteratie 2 – vervolg UAT (2025-10-10)
| Persona | Nieuwe bevinding | Aanpassing | Resultaat |
| --- | --- | --- | --- |
| Bart de Manager | Wilde dat risicofilters en sorteringen behouden blijven tussen sessies. | Filter- en sorteerwaarden worden nu in lokale opslag bewaard en automatisch toegepast. | ✅ Dashboard toont direct kritieke projecten bij opnieuw openen. |
| Anna de Planner | Miste signaal wanneer projecten binnen 7 dagen starten. | Toegevoegd countdown-badge met kleurcodering per urgentie. | ✅ Planner markeert projecten die snel starten. |
| Sven de Systeembeheerder | Detail API response miste voorraadmetadata, wat integraties brak. | Projectdetails gebruiken nu dezelfde serializer als de lijst (status, risico, alerts). | ✅ API-monitoring scripts werken opnieuw zonder aanpassingen. |
| Carla de Klant | Zocht context welke acties per persona verwacht worden. | Persona-guidance kaarten met checklists en dynamische inzichten toegevoegd. | ✅ Front-office team weet direct welke stappen te nemen. |
| Nadia de Nieuweling | Wou duidelijke leerstappen zien bij gebruik van de cockpit. | Guidance-kaart geeft onboarding hints en countdownkolom verduidelijkt prioriteiten. | ✅ Eerste dag workflow verliep zonder vragen. |
| David de Developer | Verwachtte dat PUT-respons dezelfde metadata terugstuurt als GET. | Update-endpoint levert nu direct verrijkte `ProjectOut` payload. | ✅ API-contract getest en goedgekeurd. |

## 7. Iteratie 3 – vervolg UAT (2025-10-11)
| Persona | Nieuwe bevinding | Aanpassing | Resultaat |
| --- | --- | --- | --- |
| Bart de Manager | Refresh van de cockpit leverde een 401 op doordat het token niet opnieuw werd gezet. | `App.jsx` hydrateert de autorisatieheader en haalt het actuele e-mailadres via `/auth/me` op voordat de planner laadt. | ✅ Bart kan de cockpit herladen zonder opnieuw in te loggen. |
| Carla de Klant | Mistte de contextuele tipbanner die haar naar relevante workflows gidst. | Planner toont opnieuw de `TipBanner` voor de projectmodule. | ✅ Front-office krijgt weer directe tips bij het openen van de planning. |
| Nadia de Nieuweling | Onboarding overlay verdween na de migratie naar de nieuwe Vite-entry. | Onboarding-overlay opnieuw aangesloten op het web-entrypunt en onthoudt voortgang in `localStorage`. | ✅ Nieuwe gebruikers zien opnieuw de begeleide onboarding. |
| David de Developer | Automatische API-tests konden niet meer draaien doordat standaardbibliotheken werden overschaduwd. | Verwijderd de oude demo-modules `app.py`, `http.py` en `logging.py` die namespace-conflicten veroorzaakten. | ✅ TestClient-sessies starten weer zonder importfouten. |

