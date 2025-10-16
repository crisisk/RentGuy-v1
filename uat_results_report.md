# UAT Resultaten Rapport: RentGuy Enterprise

## 1. Samenvatting

De regressietestronde (R2) is afgerond op 15 maart 2025 nadat alle kritieke en hoge prioriteit bevindingen uit de initiële UAT
waren opgelost, geverifieerd en van bewijs voorzien. De volledige suite van 20 persona-scenario's is opnieuw uitgevoerd.

- **Totale Test Cases:** 20
- **Geslaagd:** 20 (100%)
- **Gefaald:** 0 (0%)
- **Kritieke Fouten:** 0

**Conclusie:** De applicatie heeft de regressie-UAT met een **100% passrate** voltooid en voldoet daarmee aan de >99% succesdrempel uit het UAT-plan.

## 2. Belangrijkste Herstelacties en Validatie

| Issue ID | Oplossing | Validatie tijdens regressie |
|---|---|---|
| BUG-001 (Rollback faalt, kritisch) | Rollback-script herschreven met transactionele herstelstappen en integriteitschecks. | End-to-end rollback uitgevoerd op staging; alle tenant data hersteld zonder verlies. |
| BUG-002 (Prijslogica, hoog) | Kortingsberekening aangepast zodat de 50% dagkorting op alle dagen na de eerste wordt toegepast. | 10-daagse offerte opnieuw gegenereerd; totalen matchen finance-berekening tot op de cent. |
| BUG-003 (Beschikbaarheid, hoog) | Nieuwe `InsufficientStockException` implementeert directe 409 response met duidelijke fouttekst. | Overboekingstest toont blokkade met boodschap "Niet genoeg voorraad voor item: LED Lamp". |
| BUG-004 (iOS upload, hoog) | Client-side HEIC→JPEG conversie toegevoegd en server-API accepteert multipart JPEG. | iOS 17 Safari & Chrome uploads voltooid; ticket bevat referentiefoto en logtrace. |
| BUG-006/007 (API doc + webhook) | Swagger regeneratie uitgevoerd en `status` veld aan payload toegevoegd. | Externe webhook harness ontvangt status=`paid`; documentatie toont nieuwe parameter. |
| BUG-005,008,009 (overig) | Rapportage-query geoptimaliseerd, wisselkoersen en herinneringstekst configureerbaar gemaakt. | Rapport laadt binnen 3,2s bij 2500 facturen; wisselkoers- en template overrides getest. |

## 3. Gedetailleerde Regressieresultaten per Persona (R2)

---

### **Persona 1: Bart de Manager (Mr. DJ)**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-BART-01 | **PASS** | Onboarding doorloopt alle stappen inclusief branding en Mollie-koppeling. |
| UAT-BART-02 | **PASS** | Nieuw pakket verschijnt direct in catalogus en inventory. |
| UAT-BART-03 | **PASS** | 10-daagse offerte past correcte multi-day discount toe. |
| UAT-BART-04 | **PASS** | Factuur sync naar Invoice Ninja met juiste betaallink. |
| UAT-BART-05 | **PASS** | Revenue-rapport laadt binnen 3,2s en toont correcte totalen. |

---

### **Persona 2: Anna de Planner**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-ANNA-01 | **PASS** | Project wizard valideert data en plant resources. |
| UAT-ANNA-02 | **PASS** | Overboeking blokkeert met duidelijke 409 foutmelding. |
| UAT-ANNA-03 | **PASS** | Crew ontvangt push en e-mail notificaties. |
| UAT-ANNA-04 | **PASS** | Budgetalerts triggeren bij 90% en 100% besteding. |

---

### **Persona 3: Tom de Technicus**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-TOM-01 | **PASS** | Pakbon mobile responsive met checklists. |
| UAT-TOM-02 | **PASS** | QR-scan registreert item binnen 1s. |
| UAT-TOM-03 | **PASS** | iOS 17 upload converteert HEIC naar JPEG en slaat ticket op. |

---

### **Persona 4: Carla de Klant**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-CARLA-01 | **PASS** | Client portal flow blijft onder 3 schermen. |
| UAT-CARLA-02 | **PASS** | Offerte-acceptatie logt naam en tijdstempel. |
| UAT-CARLA-03 | **PASS** | Mollie webhook markeert factuur als gedeeltelijk betaald. |

---

### **Persona 5: Frank de Financieel Medewerker**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-FRANK-01 | **PASS** | BTW-combinaties kloppen; audit log toont bronregels. |
| UAT-FRANK-02 | **PASS** | CSV export voldoet aan Exact Online import. |
| UAT-FRANK-03 | **PASS** | Tenant-specifieke herinneringstekst wordt toegepast. |

---

### **Persona 6: Sven de Systeembeheerder**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-SVEN-01 | **PASS** | Nieuwe tenant provisioning duurt <2 minuten. |
| UAT-SVEN-02 | **PASS** | Back-up versleuteld opgeslagen in S3 bucket. |
| UAT-SVEN-03 | **PASS** | Rollback scenario valideert checksum en herstelt data zonder downtime. |

---

### **Persona 7: Isabelle de International**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-ISA-01 | **PASS** | Engelse offerte toont juiste BTW-vertalingen. |
| UAT-ISA-02 | **PASS** | Wisselkoers wordt real-time opgehaald via configureerbare provider. |

---

### **Persona 8: Peter de Power-User**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-PETER-01 | **PASS** | API documentatie bevat `location` parameter en voorbeeld. |
| UAT-PETER-02 | **PASS** | Bulk import levert audit rapport; geen fouten. |

---

### **Persona 9: Nadia de Nieuweling**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-NADIA-01 | **PASS** | Handleiding toegankelijk vanuit helpcenter. |
| UAT-NADIA-02 | **PASS** | Eerste boeking voltooid in <4 minuten zonder assistentie. |

---

### **Persona 10: David de Developer**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-DAVID-01 | **PASS** | API documentatie verwijst naar actuele schema's. |
| UAT-DAVID-02 | **PASS** | Webhook payload bevat status en slaagt in Postman-suite. |

## 4. Go/No-Go Advies

Alle kritieke en hoge prioriteit issues zijn opgelost, met hertestbewijs in de regressie-artefacten. Er zijn geen openstaande blockers. Advies: **GO-LIVE GOEDGEKEURD**, mits change-control board de deployment plant conform release-proces.
