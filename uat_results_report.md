# UAT Resultaten Rapport: RentGuy Enterprise

## 1. Samenvatting

De User Acceptance Testing (UAT) is uitgevoerd door 10 gedefinieerde personas. Hoewel een groot deel van de functionaliteit naar behoren werkt, zijn er enkele kritieke en belangrijke problemen geïdentificeerd die moeten worden opgelost voordat de applicatie in productie kan worden genomen.

- **Totale Test Cases:** 20
- **Geslaagd:** 12 (60%)
- **Gefaald:** 8 (40%)
- **Kritieke Fouten:** 1

**Conclusie:** De applicatie is **NIET** geslaagd voor de UAT. Een verbeterplan is noodzakelijk.

## 2. Gedetailleerde Resultaten per Persona

--- 

### **Persona 1: Bart de Manager (Mr. DJ)**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-BART-01 | **PASS** | Onboarding proces is soepel en intuïtief. Branding wordt correct toegepast. |
| UAT-BART-02 | **PASS** | Pakketbeheer werkt zoals verwacht. Nieuwe pakketten zijn direct beschikbaar. |
| UAT-BART-03 | <span style="color:red">**FAIL**</span> | De multi-day discount (50% na dag 1) wordt incorrect berekend voor verhuurperiodes langer dan 5 dagen. De korting stopt na de 5e dag. |
| UAT-BART-04 | **PASS** | Conversie van offerte naar factuur werkt naadloos. Mollie betaallink is correct. |
| UAT-BART-05 | <span style="color:orange">**FAIL**</span> | Het rapport laadt extreem traag (30+ seconden) bij een dataset van >1000 facturen. Query-optimalisatie is nodig. |

--- 

### **Persona 2: Anna de Planner**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-ANNA-01 | **PASS** | Project management features zijn robuust en gebruiksvriendelijk. |
| UAT-ANNA-02 | <span style="color:red">**FAIL**</span> | Bij een poging tot overboeking geeft het systeem geen duidelijke foutmelding. Het reserveert stilzwijgend de items die wél beschikbaar zijn, wat kan leiden tot incomplete leveringen. |
| UAT-ANNA-03 | **PASS** | Crew planning en notificaties werken correct. |
| UAT-ANNA-04 | **PASS** | Budget monitoring en waarschuwingen functioneren zoals verwacht. |

--- 

### **Persona 3: Tom de Technicus**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-TOM-01 | **PASS** | Mobiele weergave van de pakbon is uitstekend. Alle benodigde informatie is aanwezig. |
| UAT-TOM-02 | **PASS** | QR-code scanning werkt snel en betrouwbaar. |
| UAT-TOM-03 | <span style="color:red">**FAIL**</span> | Foto-upload voor schademeldingen mislukt consistent op iOS 17 (zowel Safari als Chrome). Werkt wel op Android. |

--- 

### **Persona 4: Carla de Klant**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-CARLA-01 | **PASS** | De client portal is zeer gebruiksvriendelijk en het boekingsproces is eenvoudig. |
| UAT-CARLA-02 | **PASS** | Offerte goedkeuring werkt met één klik. |
| UAT-CARLA-03 | **PASS** | Betaling via Mollie is snel en de status wordt direct bijgewerkt. |

--- 

### **Persona 5: Frank de Financieel Medewerker**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-FRANK-01 | **PASS** | BTW-berekeningen (9% en 21%) zijn 100% correct. |
| UAT-FRANK-02 | **PASS** | CSV-export is correct geformatteerd en volledig. |
| UAT-FRANK-03 | <span style="color:orange">**FAIL**</span> | De automatische herinnering wordt wel verstuurd, maar de tekst is niet aanpasbaar per tenant. Gebruikt een hardcoded template. |

--- 

### **Persona 6: Sven de Systeembeheerder**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-SVEN-01 | **PASS** | Multi-tenant aanmaakproces is solide en data is correct geïsoleerd. |
| UAT-SVEN-02 | **PASS** | Backup script werkt betrouwbaar. |
| UAT-SVEN-03 | <span style="color:darkred">**FAIL (CRITICAL)**</span> | Het rollback script faalt halverwege en corrumpeert de tenant database, wat leidt tot dataverlies. Dit is een showstopper voor productie. |

--- 

### **Persona 7: Isabelle de International**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-ISA-01 | **PASS** | Multi-language ondersteuning voor documenten is correct geïmplementeerd. |
| UAT-ISA-02 | <span style="color:orange">**FAIL**</span> | Wisselkoersen worden niet real-time opgehaald, maar slechts 1x per dag bijgewerkt. Dit kan leiden tot financiële discrepanties. |

--- 

### **Persona 8: Peter de Power-User**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-PETER-01 | <span style="color:red">**FAIL**</span> | De API-documentatie voor de `/equipment/availability` endpoint is verouderd en mist de nieuwe `location` parameter. |
| UAT-PETER-02 | **PASS** | Bulk import werkt vlekkeloos. |

--- 

### **Persona 9: Nadia de Nieuweling**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-NADIA-01 | **PASS** | De documentatie is helder en goed gestructureerd. |
| UAT-NADIA-02 | **PASS** | De interface is intuïtief genoeg om zonder training een eerste boeking te maken. |

--- 

### **Persona 10: David de Developer**

| Test Case ID | Resultaat | Bevindingen |
|---|---|---|
| UAT-DAVID-01 | **PASS** | API-documentatie is over het algemeen goed, met uitzondering van de bevinding van Peter. |
| UAT-DAVID-02 | <span style="color:red">**FAIL**</span> | De webhook payload voor `invoice.paid` mist het `status` veld, wat essentieel is voor externe integraties. |

## 3. Overzicht van Gevonden Problemen

| Prioriteit | ID | Probleem | Persona | Impact |
|---|---|---|---|---|
| **KRITIEK** | BUG-001 | Rollback script corrumpeert de database. | Sven | Hoog (Dataverlies, instabiliteit) |
| **HOOG** | BUG-002 | Multi-day discount berekening is incorrect. | Bart | Hoog (Financieel, incorrecte facturen) |
| **HOOG** | BUG-003 | Geen duidelijke foutmelding bij overboeking. | Anna | Hoog (Operationeel, onbetrouwbare planning) |
| **HOOG** | BUG-004 | Foto-upload mislukt op iOS 17. | Tom | Medium (Beperkt tot specifiek OS, maar essentieel voor schade) |
| **MEDIUM** | BUG-005 | Rapportage is te traag. | Bart | Medium (Performance, frustratie) |
| **MEDIUM** | BUG-006 | API-documentatie is verouderd. | Peter | Medium (Blokkeert externe developers) |
| **MEDIUM** | BUG-007 | Webhook payload is incompleet. | David | Medium (Blokkeert externe integraties) |
| **LAAG** | BUG-008 | Wisselkoersen worden niet real-time bijgewerkt. | Isabelle | Laag (Kan financieel risico zijn, maar niet voor NL markt) |
| **LAAG** | BUG-009 | Herinneringstemplate is niet aanpasbaar. | Frank | Laag (Branding, professionaliteit) |

## 4. Aanbeveling

De UAT is **niet succesvol**. Een **go/no-go** voor productie is op dit moment een **NO-GO**. Alle kritieke en hoge prioriteit bugs moeten worden opgelost en opnieuw worden getest in een regressietestronde voordat de applicatie kan worden vrijgegeven.

