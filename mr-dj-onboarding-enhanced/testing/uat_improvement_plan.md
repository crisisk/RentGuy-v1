# UAT Verbeterplan: Mr. DJ Onboarding Module

## 1. Inleiding

Dit document beschrijft het plan om de geïdentificeerde bugs en issues uit het UAT-resultatenrapport op te lossen. Het doel is om de Mr. DJ onboarding module te verbeteren en klaar te maken voor een tweede testronde.

## 2. Te Implementeren Verbeteringen

| Bug ID | Verbetering | Technische Implementatie | Prioriteit |
| :--- | :--- | :--- | :--- |
| **BUG-01** | **Zoekfunctie in apparatuur catalogus** | Voeg een zoekbalk toe bovenaan de apparatuurlijst die de items filtert op basis van de zoekterm. | Hoog |
| **BUG-02** | **Hoeveelheid per item aanpasbaar** | Voeg een `NumberInput` component toe naast elk geselecteerd item om de hoeveelheid aan te passen. | Hoog |
| **BUG-03** | **Directe navigatie** | Maak de stappen in de `OnboardingWizard` component klikbaar, zodat gebruikers direct naar een voltooide stap kunnen navigeren. | Gemiddeld |
| **BUG-04** | **Mobiele weergave navigatiebalk** | Maak de navigatiebalk op mobiele schermen inklapbaar met een "hamburger" menu icoon. | Gemiddeld |
| **BUG-05** | **Handmatige prijsaanpassing** | Voeg een "Handmatige modus" toe in de `PricingSetupStep` component, waarmee gebruikers de prijzen van pakketten en apparatuur kunnen overschrijven. | Gemiddeld |

## 3. Implementatieplan

De verbeteringen zullen worden geïmplementeerd in de volgende volgorde:

1.  **BUG-01 & BUG-02:** Deze twee hoge prioriteit bugs worden als eerste opgepakt en samen geïmplementeerd in de `EquipmentCatalogStep` component.
2.  **BUG-03:** De `OnboardingWizard` component wordt aangepast om directe navigatie mogelijk te maken.
3.  **BUG-04:** De `OnboardingWizard` component wordt aangepast met een responsive design voor de navigatiebalk.
4.  **BUG-05:** De `PricingSetupStep` component wordt uitgebreid met een handmatige prijsaanpassing modus.

## 4. Testen

Na de implementatie van de verbeteringen zal een volledige regressietest worden uitgevoerd om te verzekeren dat de nieuwe functionaliteiten correct werken en geen nieuwe bugs hebben geïntroduceerd. Vervolgens zal een tweede UAT-ronde worden uitgevoerd met dezelfde 10 personas.

## 5. Planning

-   **Start implementatie:** Oktober 2025
-   **Einde implementatie:** Oktober 2025
-   **Start tweede testronde:** Oktober 2025

