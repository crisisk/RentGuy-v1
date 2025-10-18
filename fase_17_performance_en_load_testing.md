# Fase 17: Performance, Load Testing en Caching Strategie

## 1. Inleiding

Een applicatie die functioneel correct is, maar traag of onstabiel onder belasting, zal geen goede gebruikerservaring bieden. Performance is een feature. Deze fase beschrijft de strategie voor het systematisch testen en waarborgen van de performance en schaalbaarheid van de Rentguy-applicatie. We introduceren geautomatiseerde load tests om te valideren hoe het systeem zich gedraagt onder realistische en extreme belasting, en we definiëren een cachingstrategie om de performance proactief te verbeteren.

## 2. Soorten Performance Tests

We onderscheiden verschillende soorten tests om een compleet beeld te krijgen van de performance-karakteristieken:

-   **Load Test**: Simuleert een verwachte, realistische hoeveelheid gebruikersverkeer. Het doel is om te verifiëren dat de applicatie voldoet aan de gestelde performance-eisen (bv. responstijden) onder normale omstandigheden.
-   **Stress Test**: Verhoogt de belasting progressief tot voorbij de verwachte piekbelasting. Het doel is om het "breekpunt" van het systeem te vinden en te observeren hoe het systeem degradeert en herstelt.
-   **Soak Test (Endurance Test)**: Onderwerpt het systeem aan een aanhoudende, normale belasting gedurende een langere periode (bv. meerdere uren). Het doel is om problemen zoals memory leaks, uitputting van databaseverbindingen of andere degradatie-effecten over tijd te ontdekken.

## 3. Gekozen Tooling: k6

Voor het uitvoeren van deze tests kiezen we voor **k6**. k6 is een moderne, open-source load testing tool die zeer populair is vanwege zijn developer-vriendelijke aanpak.

**Waarom k6?**

-   **Tests als Code**: Testscenario's worden geschreven in **JavaScript**, waardoor ze eenvoudig te begrijpen, te versioneren in Git en te onderhouden zijn door ontwikkelaars.
-   **High-Performance**: k6 is geschreven in Go en kan een zeer hoge load genereren vanaf een enkele machine.
-   **Goal-Oriented Testing**: k6 maakt het eenvoudig om duidelijke `thresholds` (drempelwaarden) te definiëren. De test kan slagen of falen op basis van deze Service Level Objectives (SLOs), bv. "95% van de requests moet binnen 200ms worden afgehandeld".

## 4. Teststrategie en Scenario's

1.  **Testscripts in Code**: De k6-scripts worden opgeslagen in een `tests/load/` directory in de repository.
2.  **Realistische User Journeys**: De scripts simuleren realistische gebruikerspaden, zoals:
    -   Een gebruiker logt in, haalt een lijst van projecten op, en bekijkt de details van één project.
    -   Een planner maakt een nieuw project aan en wijst er teamleden aan toe.
3.  **Definitie van SLOs**: In de scripts worden `thresholds` gedefinieerd. Voorbeeld:

    ```javascript
    export const options = {
      thresholds: {
        'http_req_duration': ['p(95)<200'], // 95% of requests must complete below 200ms
        'http_req_failed': ['rate<0.01'],   // http errors should be less than 1%
      },
    };
    ```

4.  **Integratie in CI/CD**: De load tests worden als een geautomatiseerde stap in de CI/CD-pijplijn opgenomen. Na een succesvolle deployment naar de **staging-omgeving**, wordt een k6-load-test gedraaid. Als de gedefinieerde `thresholds` niet worden gehaald, faalt de build, wat een release naar productie voorkomt.

## 5. Caching Strategie

Load testing zal ongetwijfeld bottlenecks aan het licht brengen. Een van de meest effectieve manieren om performance te verbeteren is door een slimme cachingstrategie te implementeren.

-   **Database Caching (met Redis)**: Voor veelgebruikte, maar niet frequent veranderende data (bv. gebruikersprofielen, projectdetails) kan een in-memory cache zoals **Redis** worden geïntroduceerd. Wanneer de data wordt opgevraagd, wordt eerst in Redis gekeken. Alleen als de data daar niet (meer) aanwezig is, wordt een query op de database uitgevoerd. Dit ontlast de database aanzienlijk.
-   **API Caching**: Voor GET-requests die publieke of niet-gepersonaliseerde data retourneren, kunnen standaard HTTP `Cache-Control` headers worden gebruikt. Dit stelt tussenliggende proxies en de browser van de gebruiker in staat om de response te cachen.
-   **Frontend Asset Caching (CDN)**: Statische frontend-assets (JavaScript, CSS, afbeeldingen, fonts) worden geserveerd via een **Content Delivery Network (CDN)**. Een CDN distribueert deze bestanden over servers wereldwijd, waardoor ze met zeer lage latentie kunnen worden geladen door gebruikers, waar ze zich ook bevinden.

## 6. Conclusie

Door performance en load testing een integraal en geautomatiseerd onderdeel van de ontwikkelcyclus te maken, verschuiven we van een reactieve naar een proactieve benadering van performance. We wachten niet tot gebruikers klagen over traagheid, maar valideren continu dat de applicatie voldoet aan de gestelde performance-eisen. Gecombineerd met een doordachte cachingstrategie, zorgt dit ervoor dat de Rentguy-applicatie snel, betrouwbaar en schaalbaar blijft, zelfs bij een sterk groeiend aantal gebruikers.
