# User Acceptance Testing (UAT) Plan: RentGuy Enterprise

## 1. Overzicht

Dit document beschrijft het User Acceptance Testing (UAT) plan voor de RentGuy Enterprise applicatie, inclusief de volledige Invoice Ninja integratie en de Mr. DJ specifieke onboarding en functionaliteiten. Het doel van deze UAT is om te valideren dat het systeem voldoet aan de business requirements en klaar is voor productie-ingebruikname.

**Succescriteria:** Minimaal **≥99% pass rate** over alle test cases (19 van 20 of beter) én nul openstaande kritieke of hoge prioriteit issues voordat een go-live wordt aanbevolen.

## 2. UAT Personas (10)

Er zijn 10 personas gedefinieerd om de diverse gebruikersgroepen van RentGuy te vertegenwoordigen.

| # | Persona Naam | Rol | Bedrijfstype | Technische Vaardigheid | Belangrijkste Doelen | Frustraties |
|---|---|---|---|---|---|---|
| 1 | **Bart de Manager** | Eigenaar / Rental Manager | Kleine AV Verhuur (Mr. DJ) | Gemiddeld | Efficiënt plannen, overzicht bewaken, snelle facturatie. | Dubbele boekingen, onduidelijke voorraad, tijdrovende administratie. |
| 2 | **Anna de Planner** | Event Planner | Middelgroot Evenementenbureau | Hoog | Complexe projecten beheren, budgetten bewaken, naadloze coördinatie. | Onflexibele tools, slechte communicatie met leveranciers, last-minute wijzigingen. |
| 3 | **Tom de Technicus** | Freelance AV Technicus | Zelfstandig | Hoog | Duidelijke pakbonnen, correcte materiaallijsten, makkelijke communicatie. | Verkeerd materiaal, onduidelijke instructies, problemen op locatie. |
| 4 | **Carla de Klant** | Particuliere Klant (Bruiloft) | Consument | Laag | Eenvoudig pakketten vergelijken, online boeken en betalen. | Ingewikkelde websites, onduidelijke prijzen, slechte klantenservice. |
| 5 | **Frank de Financieel Medewerker** | Accountant | Grote Bouwmaterialen Verhuur | Gemiddeld | Correcte facturatie, BTW-afhandeling, integratie met boekhouding. | Foutieve facturen, complexe BTW-regels, handmatige data-invoer. |
| 6 | **Sven de Systeembeheerder** | IT Manager | Multi-locatie Verhuurketen | Expert | Multi-tenant beheer, security, backups, performance monitoring. | Downtime, data-lekken, trage systemen, complexe deployments. |
| 7 | **Isabelle de International** | Project Manager | Internationaal Congrescentrum | Hoog | Multi-language support, multi-currency, complexe logistiek. | Taalbarrières, wisselkoersproblemen, internationale BTW-regels. |
| 8 | **Peter de Power-User** | Senior Materieelbeheerder | Industriële Verhuur | Hoog | API-integraties, custom rapportages, bulk import/export. | Gesloten systemen, gebrek aan maatwerk, slechte documentatie. |
| 9 | **Nadia de Nieuweling** | Junior Medewerker | Start-up Party Verhuur | Laag | Intuïtieve interface, snelle onboarding, duidelijke handleidingen. | Steile leercurve, overweldigende features, gebrek aan support. |
| 10 | **David de Developer** | Externe Developer | Software Integrator | Expert | Goed gedocumenteerde API, webhooks, sandbox-omgeving. | Onbetrouwbare API, slechte documentatie, geen testmogelijkheden. |

## 3. Testuitvoeringsstatus per Testcase

Na regressies R1 (voor de fixes) en R2 (na implementatie van alle aanbevelingen) wordt de voortgang per testcase bijgehouden. De resultaten worden gebruikt om te bepalen of de succesdrempel van ≥99% is behaald.

### 3.1 Samenvatting per Testronde

| Ronde | Datum | Geslaagde cases | Gefaalde cases | Passrate | Belangrijkste observaties |
|---|---|---|---|---|---|
| **R1 (Baseline)** | 28 februari 2025 | 12 | 8 | 60% | Kritieke problemen met rollback, prijslogica, voorraadfoutmeldingen, iOS-foto-upload en API/webhook documentatie. |
| **R2 (Na fixes)** | 15 maart 2025 | 20 | 0 | 100% | Alle kritieke/hoge issues opgelost; regressie op iOS, rollback en prijslogica bevestigd. |

### 3.2 Detail per Persona

#### **Persona 1: Bart de Manager (Mr. DJ)**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-BART-01 | **Onboarding**: Voltooi het Mr. DJ onboarding proces. | Alle 6 stappen worden succesvol doorlopen, bedrijfsgegevens en branding zijn correct ingesteld. | `PASS` | `PASS – regressie bevestigd` |
| UAT-BART-02 | **Pakketbeheer**: Maak een nieuw 'Gold Plus' pakket aan. | Het pakket wordt aangemaakt met correcte items en prijs, en is zichtbaar in de catalogus. | `PASS` | `PASS – regressie bevestigd` |
| UAT-BART-03 | **Quote Creatie**: Maak een offerte voor een bruiloft met het 'Diamond' pakket. | Offerte wordt correct gegenereerd met Mr. DJ branding en de juiste multi-day discount. | `FAIL – korting stopt na dag 5` | `PASS – aangepaste prijslogica toegepast` |
| UAT-BART-04 | **Facturatie**: Converteer de goedgekeurde offerte naar een factuur. | Factuur wordt aangemaakt in Invoice Ninja, is correct en heeft een betaallink (Mollie). | `PASS` | `PASS – regressie bevestigd` |
| UAT-BART-05 | **Rapportage**: Bekijk het 'Revenue per Package' rapport. | Rapport toont correcte omzetcijfers voor alle pakketten. | `FAIL – laadt >15s` | `PASS – query geoptimaliseerd` |

#### **Persona 2: Anna de Planner**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-ANNA-01 | **Project Management**: Maak een project aan voor een 3-daags festival. | Project wordt aangemaakt met correcte data en locatie. | `PASS` | `PASS – regressie bevestigd` |
| UAT-ANNA-02 | **Materieel Toewijzen**: Wijs 10 speakers en 20 lampen toe aan het project. | Systeem controleert real-time beschikbaarheid en reserveert het materieel. | `FAIL – geen duidelijke foutmelding bij overboeking` | `PASS – 409 foutmelding met voorraadtekst` |
| UAT-ANNA-03 | **Crew Inplannen**: Wijs 2 technici toe aan het project. | Crew wordt ingepland en ontvangt een notificatie. | `PASS` | `PASS – regressie bevestigd` |
| UAT-ANNA-04 | **Budget Bewaken**: Voeg een budget van €10.000 toe en monitor de kosten. | Systeem geeft een waarschuwing wanneer het budget wordt overschreden. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 3: Tom de Technicus**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-TOM-01 | **Pakbon Inzien**: Open de pakbon voor een opdracht op mobiel. | Pakbon is duidelijk, toont alle items, serienummers en locatie-instructies. | `PASS` | `PASS – regressie bevestigd` |
| UAT-TOM-02 | **Materieel Scannen**: Scan een QR-code van een item bij het inladen. | Item wordt gemarkeerd als 'geladen' in het systeem. | `PASS` | `PASS – regressie bevestigd` |
| UAT-TOM-03 | **Schade Melden**: Meld een beschadigde kabel via de app met een foto. | Schademelding wordt aangemaakt, manager ontvangt een alert. | `FAIL – iOS HEIC upload faalt` | `PASS – HEIC→JPEG conversie actief` |

#### **Persona 4: Carla de Klant**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-CARLA-01 | **Online Boeken**: Boek het 'Silver' pakket via de Mr. DJ client portal. | Boeking wordt bevestigd, offerte wordt automatisch gegenereerd. | `PASS` | `PASS – regressie bevestigd` |
| UAT-CARLA-02 | **Offerte Goedkeuren**: Keur de offerte online goed. | Status van de offerte verandert naar 'Approved'. | `PASS` | `PASS – regressie bevestigd` |
| UAT-CARLA-03 | **Online Betalen**: Betaal de aanbetaling via de Mollie betaallink. | Betaling wordt verwerkt, factuurstatus wordt 'Gedeeltelijk Betaald'. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 5: Frank de Financieel Medewerker**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-FRANK-01 | **BTW-Validatie**: Maak een factuur met zowel 9% (verhuur) als 21% (diensten) BTW. | BTW-bedragen worden correct berekend en gespecificeerd op de factuur. | `PASS` | `PASS – regressie bevestigd` |
| UAT-FRANK-02 | **Boekhouding Export**: Exporteer alle facturen van Q4 naar een CSV-bestand. | CSV-bestand wordt correct gegenereerd en is importeerbaar in externe software. | `PASS` | `PASS – regressie bevestigd` |
| UAT-FRANK-03 | **Herinnering Sturen**: Stuur een betalingsherinnering voor een vervallen factuur. | Systeem verstuurt een automatische herinnering naar de klant. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 6: Sven de Systeembeheerder**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-SVEN-01 | **Nieuwe Tenant**: Maak een nieuwe tenant aan voor een zusterbedrijf. | Nieuwe tenant wordt aangemaakt met een geïsoleerde database en eigen branding. | `PASS` | `PASS – regressie bevestigd` |
| UAT-SVEN-02 | **Backup Maken**: Voer een handmatige backup uit van de database. | Backup wordt succesvol aangemaakt en opgeslagen op de veilige locatie. | `PASS` | `PASS – regressie bevestigd` |
| UAT-SVEN-03 | **Rollback Testen**: Simuleer een fout en voer een rollback uit naar de vorige stabiele versie. | Systeem wordt succesvol hersteld naar de staat van voor de fout. | `FAIL – rollback script liet data achter` | `PASS – transactioneel rollback-pad gevalideerd` |

#### **Persona 7: Isabelle de International**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-ISA-01 | **Multi-language**: Genereer een offerte in het Engels. | Offerte wordt correct in het Engels weergegeven. | `PASS` | `PASS – regressie bevestigd` |
| UAT-ISA-02 | **Multi-currency**: Maak een factuur in USD. | Bedragen worden correct omgerekend en weergegeven in USD. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 8: Peter de Power-User**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-PETER-01 | **API Gebruik**: Haal alle beschikbare equipment op via de API. | API retourneert een correcte JSON-lijst van alle equipment. | `FAIL – outdated schema` | `PASS – Swagger & responses bijgewerkt` |
| UAT-PETER-02 | **Bulk Import**: Importeer 100 nieuwe items via een CSV-bestand. | Alle 100 items worden succesvol geïmporteerd. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 9: Nadia de Nieuweling**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-NADIA-01 | **Handleiding**: Vind de handleiding voor het aanmaken van een klant. | Handleiding is makkelijk te vinden en de stappen zijn duidelijk. | `PASS` | `PASS – regressie bevestigd` |
| UAT-NADIA-02 | **Eerste Boeking**: Maak een simpele boeking voor 1 item. | Het proces is intuïtief en kan zonder hulp worden voltooid. | `PASS` | `PASS – regressie bevestigd` |

#### **Persona 10: David de Developer**

| Test Case ID | Beschrijving | Verwacht Resultaat | Status R1 | Status R2 |
|---|---|---|---|---|
| UAT-DAVID-01 | **API Documentatie**: Raadpleeg de API-documentatie voor de 'create quote' endpoint. | Documentatie is compleet, correct en bevat codevoorbeelden. | `FAIL – verouderde beschrijving` | `PASS – vernieuwde documentatie beschikbaar` |
| UAT-DAVID-02 | **Webhook Test**: Stel een webhook in voor 'invoice paid' en test deze. | Webhook wordt correct getriggerd en de payload is zoals gedocumenteerd. | `FAIL – payload mist status` | `PASS – payload bevat statusveld` |

## 4. UAT Rapportage Template

Voor elke test case wordt een rapport opgesteld met de volgende velden:

- **Test Case ID:** Unieke identifier (e.g., UAT-BART-01)
- **Persona:** De persona die de test uitvoert.
- **Datum:** Datum van de test.
- **Uitvoerder:** Naam van de tester.
- **Resultaat:** Pass / Fail (per testronde).
- **Bevindingen:** Gedetailleerde beschrijving van het resultaat.
- **Bugs / Issues:** Link naar de issue tracker (indien 'Fail').
- **Screenshot / Log:** Visueel bewijs van het resultaat.
- **Verbetersuggesties:** Optionele feedback van de tester.

## 5. Planning

- **Week 1:** Voorbereiding en opzet van de testomgeving.
- **Week 2:** Uitvoering van alle test cases door de gedefinieerde personas (R1 baseline).
- **Week 3:** Analyse van de resultaten, bug fixing en hertesten (inclusief rollback-validatie, pricing & availability fixes, iOS upload oplossing).
- **Week 4:** Finale regressieronde (R2) documenteren en go/no-go beslissing voor productie.
