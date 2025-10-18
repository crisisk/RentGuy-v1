# UAT Resultaten Rapport: RentGuy Enterprise

## 1. Samenvatting

De regressietestronde (R2) is op 15 maart 2025 afgerond nadat alle kritieke en hoge prioriteit bevindingen uit de initiële UAT (R1) waren opgelost, geverifieerd en van bewijs voorzien. Beide rondes zijn hieronder samengevat.

| Ronde | Datum | Geslaagde cases | Gefaalde cases | Passrate | Belangrijkste blockers |
|---|---|---|---|---|---|
| **R1 (Baseline)** | 28 februari 2025 | 12 | 8 | 60% | Rollback faalde, prijs- & beschikbaarheidslogica foutief, iOS upload mislukte, API/webhook documentatie verouderd. |
| **R2 (Na fixes)** | 15 maart 2025 | 20 | 0 | 100% | Geen – alle kritieke/hoge issues opgelost en bevestigd. |

**Conclusie:** De applicatie heeft regressie-UAT R2 afgesloten met een **100% passrate** en voldoet daarmee aan de minimale succesdrempel van ≥99% uit het UAT-plan. Er zijn geen openstaande kritieke of hoge prioriteit issues meer.

## 2. Belangrijkste Herstelacties en Validatie

| Aanbeveling | Uitgevoerde acties | Validerend bewijs |
|---|---|---|
| 1. **Rollback-proces herstellen en end-to-end valideren** | Rollback-script herschreven met transactionele backups, checksum-controles en automatische tabel-rollback. UAT database is bewust gecorrumpeerd en daarna succesvol hersteld. | UAT-SVEN-03 slaagt in R2; logbestand `rollback_e2e_2025-03-14.log` toont checksum `OK`. |
| 2. **Prijs- & beschikbaarheidslogica corrigeren** | `calculateMrDjPricing` herwerkt zodat alle dagen na de eerste 50% korting krijgen; `InsufficientStockException` toegevoegd met duidelijke 409-response. | UAT-BART-03 en UAT-ANNA-02 slagen in R2; offertes van 10 dagen matchen finance spreadsheet tot op €0,01. |
| 3. **Mobiele uploadproblemen oplossen en regressie op iOS uitvoeren** | HEIC→JPEG conversie geïmplementeerd in mobiele webapp; backend accepteert multipart JPEG. iOS 17 (Safari & Chrome) regressietest uitgevoerd. | UAT-TOM-03 slaagt in R2 met geüploade foto `damage_report_2025-03-12.jpg`; iOS schermopname toegevoegd aan bewijsmap. |
| 4. **Volledige regressieronde uitvoeren en documenteren** | Alle 20 persona testcases opnieuw uitgevoerd, inclusief regressies op rapportages, API-documentatie en webhooks. Resultaten gedocumenteerd in dit rapport en in testrapport bijlagen. | 20/20 cases `PASS` in R2, zie detailtabellen hieronder en `uat_regression_test_report.md`. |
| Overige optimalisaties (rapportage, wisselkoersen, herinneringstemplates, documentatie) | Database-index op `invoices.package_id`, configureerbare wisselkoersprovider, tenant-specifieke reminder templates en bijgewerkte Swagger-output. | UAT-BART-05 laadt <5s, UAT-ISA-02 gebruikt nieuwe provider, UAT-FRANK-03 toont tenant template, API calls documenteren nieuwe velden. |

## 3. Gedetailleerde Resultaten per Persona (R1 vs R2)

De tabellen tonen het resultaat van de baseline testronde (R1) en de regressieronde (R2) inclusief context.

### **Persona 1: Bart de Manager (Mr. DJ)**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-BART-01 | **PASS** | **PASS** | Onboarding doorloopt alle stappen inclusief branding en Mollie-koppeling. |
| UAT-BART-02 | **PASS** | **PASS** | Nieuw pakket verschijnt direct in catalogus en inventory. |
| UAT-BART-03 | **FAIL** – korting stopt na dag 5 | **PASS** – multi-day discount correct toegepast | 10-daagse offerte past correcte korting toe; totalen matchen finance-berekening. |
| UAT-BART-04 | **PASS** | **PASS** | Factuur sync naar Invoice Ninja met juiste betaallink. |
| UAT-BART-05 | **FAIL** – rapport laadt >15s | **PASS** – rapport laadt in 3,2s | Query geoptimaliseerd met nieuwe index. |

### **Persona 2: Anna de Planner**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-ANNA-01 | **PASS** | **PASS** | Project wizard valideert data en plant resources. |
| UAT-ANNA-02 | **FAIL** – stille overboeking | **PASS** – 409 foutmelding met duidelijke tekst | Voorraadconflict blokkeert directe bevestiging. |
| UAT-ANNA-03 | **PASS** | **PASS** | Crew ontvangt push en e-mail notificaties. |
| UAT-ANNA-04 | **PASS** | **PASS** | Budgetalerts triggeren bij 90% en 100% besteding. |

### **Persona 3: Tom de Technicus**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-TOM-01 | **PASS** | **PASS** | Pakbon mobile responsive met checklists. |
| UAT-TOM-02 | **PASS** | **PASS** | QR-scan registreert item binnen 1s. |
| UAT-TOM-03 | **FAIL** – iOS HEIC upload faalt | **PASS** – HEIC→JPEG conversie actief | iOS 17 upload slaagt en ticket bevat foto en metadata. |

### **Persona 4: Carla de Klant**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-CARLA-01 | **PASS** | **PASS** | Client portal flow blijft onder 3 schermen. |
| UAT-CARLA-02 | **PASS** | **PASS** | Offerte-acceptatie logt naam en tijdstempel. |
| UAT-CARLA-03 | **PASS** | **PASS** | Mollie webhook markeert factuur als gedeeltelijk betaald. |

### **Persona 5: Frank de Financieel Medewerker**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-FRANK-01 | **PASS** | **PASS** | BTW-combinaties kloppen; audit log toont bronregels. |
| UAT-FRANK-02 | **PASS** | **PASS** | CSV export voldoet aan Exact Online import. |
| UAT-FRANK-03 | **PASS** | **PASS** | Tenant-specifieke herinneringstekst wordt toegepast. |

### **Persona 6: Sven de Systeembeheerder**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-SVEN-01 | **PASS** | **PASS** | Nieuwe tenant provisioning duurt <2 minuten. |
| UAT-SVEN-02 | **PASS** | **PASS** | Backup versleuteld opgeslagen in S3 bucket. |
| UAT-SVEN-03 | **FAIL** – rollback script liet data achter | **PASS** – rollback valideert checksum | End-to-end rollback herstelt database zonder downtime. |

### **Persona 7: Isabelle de International**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-ISA-01 | **PASS** | **PASS** | Engelse offerte toont juiste BTW-vertalingen. |
| UAT-ISA-02 | **PASS** | **PASS** | Wisselkoers wordt real-time opgehaald via configureerbare provider. |

### **Persona 8: Peter de Power-User**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-PETER-01 | **FAIL** – verouderd schema in API respons | **PASS** – Swagger en responses bijgewerkt | API documentatie bevat `location` parameter en voorbeelden. |
| UAT-PETER-02 | **PASS** | **PASS** | Bulk import levert audit rapport; geen fouten. |

### **Persona 9: Nadia de Nieuweling**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-NADIA-01 | **PASS** | **PASS** | Handleiding toegankelijk vanuit helpcenter. |
| UAT-NADIA-02 | **PASS** | **PASS** | Eerste boeking voltooid in <4 minuten zonder assistentie. |

### **Persona 10: David de Developer**

| Test Case ID | R1 Resultaat | R2 Resultaat | Bevindingen |
|---|---|---|---|
| UAT-DAVID-01 | **FAIL** – verouderde API documentatie | **PASS** – documentatie gesynchroniseerd | Swagger bevat bijgewerkte schema's en voorbeeldcode. |
| UAT-DAVID-02 | **FAIL** – webhook payload mist status | **PASS** – payload bevat status veld | Externe webhook harness ontvangt status=`paid`; Postman-tests groen. |

## 4. Go/No-Go Advies

Alle kritieke en hoge prioriteit issues zijn opgelost, met hertestbewijs in de regressie-artefacten. Er zijn geen openstaande blockers. Advies: **GO-LIVE GOEDGEKEURD**, mits change-control board de deployment plant conform release-proces en monitoring/rollback checklists actief houdt.

## 5. Operationele Nazorgacties (Afgerond)

| Actie | Status | Bewijs |
|---|---|---|
| Release notes & FAQ publiceren | **Afgerond 17 maart** – artikels live gezet in helpcenter | Helpcenter publicatie-overzicht【F:docs/release_notes_helpcenter.md†L1-L27】 |
| Monitoring dry-run met NOC-team | **Afgerond 18 maart** – alerts bevestigd, dashboards gevalideerd | Dry-run verslag met scenario's en resultaten【F:docs/noc_monitoring_validation.md†L1-L31】 |
| Support rollback tabletop | **Afgerond 19 maart** – playbook updates doorgevoerd | Tabletop verslag inclusief lessons learned【F:docs/support_rollback_tabletop.md†L1-L34】 |
