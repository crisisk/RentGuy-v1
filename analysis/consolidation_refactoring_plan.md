# Consolidatie- en Refactoringplan: RentGuy Enterprise

## 1. Inleiding

Dit document beschrijft het plan voor de consolidatie en refactoring van de RentGuy Enterprise codebase, gebaseerd op de analyse van dubbele functionaliteiten. Het doel is om een gestroomlijnde, efficiënte en onderhoudbare applicatie te creëren door redundantie te elimineren en de architectuur te optimaliseren.

## 2. Algemene Strategie

De algemene strategie is om de superieure en uitgebreidere functionaliteiten van de native geïntegreerde Invoice Ninja modules als de **enkele bron van waarheid** te gebruiken. De kernfunctionaliteiten van RentGuy die specifiek zijn voor de verhuurbranche zullen worden gemigreerd en geïntegreerd in deze nieuwe, geconsolideerde modules.

## 3. Gedetailleerd Refactoringplan

### Fase 1: Klantenbeheer Consolidatie

- **Doel:** Eén centraal systeem voor klantenbeheer.
- **Stappen:**
  1.  **Data Migratie:** Schrijf een migratiescript om alle records van de oude `rentguy.clients` tabel over te zetten naar de `invoiceninja.clients` tabel. Zorg voor correcte mapping van velden en het behoud van relaties.
  2.  **Code Refactoring:** Pas alle code in de RentGuy applicatie aan die verwijst naar het oude `Client` model. Vervang deze door verwijzingen naar het nieuwe, geconsolideerde `Client` model.
  3.  **Verwijdering:** Verwijder de oude `ClientController`, het `Client` model en de `clients` tabel uit de RentGuy codebase.
  4.  **Testen:** Schrijf unit- en integratietests om te verifiëren dat alle klantgerelateerde functionaliteiten correct werken met het nieuwe, geconsolideerde systeem.

### Fase 2: Facturatie & Betalingen Refactoring

- **Doel:** Eén geïntegreerd systeem voor facturatie en betalingen.
- **Stappen:**
  1.  **Data Migratie:** Schrijf migratiescripts om alle `invoices` en `payments` van RentGuy over te zetten naar de corresponderende tabellen van Invoice Ninja. Zorg voor het behoud van de relaties met klanten en producten.
  2.  **Code Refactoring:** Refactor alle facturatie- en betalingslogica in RentGuy om gebruik te maken van de Invoice Ninja API's en services. Dit omvat het aanmaken van offertes, het converteren van offertes naar facturen, het verwerken van betalingen en het versturen van herinneringen.
  3.  **Verwijdering:** Verwijder de oude `InvoiceController`, `PaymentController` en de bijbehorende modellen en tabellen.
  4.  **Testen:** Voer end-to-end tests uit om de volledige facturatie- en betalingsflow te valideren, van het aanmaken van een offerte tot de succesvolle verwerking van een betaling.

### Fase 3: Productbeheer Consolidatie & Specialisatie

- **Doel:** Eén uniform productbeheersysteem met ondersteuning voor zowel standaardproducten als verhuurapparatuur.
- **Stappen:**
  1.  **Model Aanpassing:** Breid het `Product` model van Invoice Ninja uit met de verhuurspecifieke velden van RentGuy (`rental_rate`, `availability_status`, `maintenance_schedule`, etc.). Voeg een `product_type` enum toe (`standard`, `rental`).
  2.  **Data Migratie:** Migreer alle producten van de oude `rentguy.products` tabel naar de nieuwe, geconsolideerde `products` tabel. Stel het `product_type` in op `rental` voor deze records.
  3.  **Code Refactoring:** Pas de productbeheerlogica aan om onderscheid te maken tussen de verschillende producttypes. Zorg ervoor dat de verhuurspecifieke functionaliteiten alleen van toepassing zijn op `rental` producten.
  4.  **Verwijdering:** Verwijder het oude `Product` model en de `products` tabel.
  5.  **Testen:** Test de productcatalogus, het aanmaken van nieuwe producten (zowel standaard als verhuur) en de correcte toepassing van de verhuurlogica.

### Fase 4: Rapportage Consolidatie & Uitbreiding

- **Doel:** Eén centraal rapportagesysteem met uitgebreide en verhuurspecifieke rapporten.
- **Stappen:**
  1.  **Code Refactoring:** Verplaats alle rapportagelogica van RentGuy naar de `ReportController` van Invoice Ninja.
  2.  **Uitbreiding:** Creëer nieuwe rapporten die specifiek zijn voor de verhuurbranche, zoals:
      -   **Bezettingsgraad per product/categorie**
      -   **Onderhoudsrapporten**
      -   **Schaderapporten**
      -   **Verwachte inkomsten uit verhuur**
  3.  **Frontend Integratie:** Integreer de nieuwe rapporten in de frontend van de applicatie, met duidelijke visualisaties en filteropties.
  4.  **Testen:** Valideer de correctheid van alle rapporten en de performance bij grote datasets.

### Fase 5: Instellingen Consolidatie

- **Doel:** Eén centrale plek voor alle applicatie- en tenant-instellingen.
- **Stappen:**
  1.  **Data Migratie:** Migreer alle instellingen van RentGuy naar de `settings` tabel van Invoice Ninja.
  2.  **Code Refactoring:** Pas alle code aan die verwijst naar de oude instellingen, en vervang deze door verwijzingen naar de nieuwe, geconsolideerde instellingen.
  3.  **Verwijdering:** Verwijder de oude `SettingsController` en de bijbehorende tabellen.
  4.  **Testen:** Test de correcte toepassing van alle instellingen in de gehele applicatie.

## 4. Planning en Tijdlijn

- **Sprint 1 (1 week):** Fase 1: Klantenbeheer Consolidatie
- **Sprint 2 (2 weken):** Fase 2: Facturatie & Betalingen Refactoring
- **Sprint 3 (1 week):** Fase 3: Productbeheer Consolidatie & Specialisatie
- **Sprint 4 (1 week):** Fase 4 & 5: Rapportage & Instellingen Consolidatie
- **Sprint 5 (1 week):** Volledige regressietest en bugfixing

**Totaal geschatte tijd:** 6 weken.

## 5. Risico's en Mitigatie

- **Risico:** Dataverlies tijdens migratie.
  - **Mitigatie:** Maak volledige backups voor elke migratie. Voer de migraties eerst uit op een staging-omgeving en valideer de data zorgvuldig.
- **Risico:** Introductie van regressies.
  - **Mitigatie:** Schrijf uitgebreide unit-, integratie- en end-to-end tests. Voer een volledige regressietest uit na elke fase.
- **Risico:** Performanceproblemen na refactoring.
  - **Mitigatie:** Voer performance- en loadtests uit na elke fase. Optimaliseer queries en code waar nodig.

## 6. Conclusie

Dit consolidatie- en refactoringplan zal resulteren in een aanzienlijk verbeterde codebase voor RentGuy Enterprise. De applicatie zal efficiënter, onderhoudbaarder en schaalbaarder zijn, en een betere gebruikerservaring bieden door een consistent en coherent systeem. Hoewel de refactoring een aanzienlijke inspanning vereist, zijn de voordelen op de lange termijn substantieel.

