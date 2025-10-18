# Fase 5: Teststrategie en Implementatie van Unit & Integratietests

## 1. Inleiding

Een robuuste teststrategie is de hoeksteen van softwarekwaliteit. Het stelt ons in staat om met vertrouwen nieuwe features te ontwikkelen en te releasen, wetende dat de bestaande functionaliteit niet onbedoeld wordt gebroken. Deze fase beschrijft de teststrategie voor Rentguy en de implementatie van de eerste lagen van de testpiramide: unit- en integratietests.

## 2. De Teststrategie: De Testpiramide

We adopteren het model van de testpiramide. Dit model pleit voor een grote basis van snelle, goedkope unit tests, een kleinere laag van integratietests, en een nog kleinere toplaag van langzame, dure end-to-end (E2E) tests.

-   **Unit Tests (70%)**: Testen de kleinste, geïsoleerde eenheden van code (bv. een enkele functie of een React-component). Ze zijn snel, stabiel en geven precieze feedback.
-   **Integratietests (20%)**: Testen de interactie tussen meerdere componenten (bv. een API-endpoint dat een service aanroept die met de database praat). Ze zijn iets langzamer maar valideren belangrijke samenwerkingen in het systeem.
-   **End-to-End Tests (10%)**: Simuleren een volledige gebruikersflow door de applicatie (bv. inloggen, een item boeken, uitloggen). Ze zijn het meest waardevol in het valideren van de gebruikerservaring, maar ook het traagst en meest broos.

In deze fase focussen we op het opzetten van de fundering: de unit- en integratietests.

## 3. Testframeworks en Tooling

### Backend (Python/FastAPI)

-   **Testrunner**: **PyTest** wordt gekozen vanwege zijn eenvoudige syntax, krachtige features (zoals fixtures) en uitgebreide ecosysteem van plugins.
-   **Mocking**: De ingebouwde `unittest.mock` library wordt gebruikt om externe afhankelijkheden (zoals andere API's of de database in unit tests) te mocken.
-   **Testdatabase**: Voor integratietests wordt een aparte testdatabase opgezet (bv. een aparte Docker-container) die voor elke test-run wordt gereset naar een schone staat.

### Frontend (JavaScript/React)

-   **Testrunner**: **Jest** is de de-facto standaard voor het testen van React-applicaties en wordt geleverd met een ingebouwde assertion library en mocking-functionaliteit.
-   **Component Testing**: **React Testing Library** wordt gebruikt om React-componenten te testen op een manier die de daadwerkelijke gebruikersinteractie simuleert, in plaats van te focussen op implementatiedetails.

## 4. Implementatie

### Structuur van de Tests

-   **Backend**: De tests worden geplaatst in de `backend/tests/` directory, met een onderverdeling in `unit/` en `integration/`. De bestandsnamen van de tests volgen het patroon `test_*.py`.
-   **Frontend**: Tests worden naast de componenten geplaatst die ze testen, met de extensie `.test.jsx` (bv. `Login.jsx` en `Login.test.jsx`).

### Schrijven van de Eerste Tests

Als onderdeel van deze fase worden de eerste, fundamentele tests geschreven:

-   **Backend Unit Tests**: Tests voor de businesslogica in de `usecases` en `services`.
-   **Backend Integratietests**: Tests voor de belangrijkste API-endpoints, zoals `/api/v1/auth/login` en de CRUD-operaties voor `inventory`.
-   **Frontend Unit Tests**: Tests voor individuele, simpele componenten (bv. knoppen, input-velden).
-   **Frontend Integratietests**: Tests voor formulieren (bv. het login-formulier) om de interactie tussen verschillende componenten te valideren.

### Uitvoeren van de Tests

De tests worden geïntegreerd in de CI/CD-pijplijn (zoals beschreven in Fase 4). Een `npm test` en `pytest` commando zullen worden toegevoegd aan de workflow. Een falende test zal de build en deployment blokkeren.

## 5. Conclusie

Het opzetten van een solide teststrategie en de implementatie van de eerste unit- en integratietests is een investering die zich snel terugbetaalt in de vorm van hogere codekwaliteit, minder regressiebugs en meer vertrouwen bij het doorvoeren van wijzigingen. Dit fundament is essentieel voor de verdere uitbouw van de applicatie en de implementatie van meer complexe features in latere fasen.
