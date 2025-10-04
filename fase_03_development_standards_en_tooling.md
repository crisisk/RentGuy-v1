# Fase 3: Development Standards en Tooling

## 1. Inleiding

Om de kwaliteit, consistentie en onderhoudbaarheid van de Rentguy-codebase te verhogen, is het essentieel om een set van development standards en geautomatiseerde tooling te implementeren. Deze fase beschrijft de implementatie van codeerstandaarden, de configuratie van linters en formatters, en de definitie van een Git-branchingstrategie.

## 2. Codeerstandaarden en Tooling

Er worden specifieke tools ingezet om de codekwaliteit automatisch te bewaken en af te dwingen. Dit vermindert de kans op fouten, verbetert de leesbaarheid en zorgt voor een uniforme stijl over het hele project.

### Backend (Python/FastAPI)

-   **Formatter: Black**
    -   **Doel**: Zorgt voor een eenduidige, niet-onderhandelbare code-opmaak. Dit elimineert discussies over stijl en maakt de code voorspelbaar.
    -   **Configuratie**: Er wordt een `pyproject.toml`-bestand geconfigureerd om de standaardinstellingen van Black te specificeren.
-   **Linter: Flake8**
    -   **Doel**: Detecteert fouten in de code, zoals ongebruikte variabelen, en controleert op de naleving van de PEP 8-stijlgids.
    -   **Configuratie**: Een `.flake8`-bestand wordt toegevoegd om de linter-regels te configureren, inclusief de maximale regellengte die wordt afgestemd op Black.

### Frontend (JavaScript/React)

-   **Formatter: Prettier**
    -   **Doel**: Net als Black voor Python, zorgt Prettier voor een consistente code-opmaak voor JavaScript, JSX, en CSS.
    -   **Configuratie**: Een `.prettierrc`-bestand definieert de stijlregels.
-   **Linter: ESLint**
    -   **Doel**: Analyseert de JavaScript-code om problemen te vinden, met een focus op codekwaliteit en potentiële bugs.
    -   **Configuratie**: Een `.eslintrc.js`-bestand wordt geconfigureerd met aanbevolen regels voor React-applicaties.

## 3. Git-Branchingstrategie: GitFlow

Er wordt gekozen voor de **GitFlow**-branchingstrategie. Dit model is robuust en zeer geschikt voor projecten met geplande releases. Het biedt een strikte scheiding tussen de ontwikkel-, release- en productiestadia.

De belangrijkste branches zijn:

-   `main`: Bevat de stabiele, productieklare code. Hier wordt alleen vanaf `release`-branches naar gemerged.
-   `develop`: De hoofd-ontwikkelbranch. Alle nieuwe features worden hierin geïntegreerd.
-   `feature/*`: Voor elke nieuwe feature wordt een aparte branch gemaakt vanuit `develop`. Na voltooiing wordt deze teruggemerged naar `develop`.
-   `release/*`: Wanneer `develop` klaar is voor een nieuwe release, wordt een `release`-branch gemaakt. Hierin vinden alleen bugfixes en de laatste voorbereidingen plaats.
-   `hotfix/*`: Voor urgente fixes in productie wordt een `hotfix`-branch gemaakt vanuit `main`. Deze wordt na het oplossen zowel naar `main` als `develop` gemerged.

Deze strategie wordt gedocumenteerd in een `CONTRIBUTING.md`-bestand in de root van de repository om alle ontwikkelaars te instrueren over de te volgen procedure.

## 4. Centrale Package Repository

Voor een enterprise-omgeving is het cruciaal om controle te hebben over de gebruikte software-dependencies. Een centrale package repository (zoals **Nexus Repository** of **JFrog Artifactory**) fungeert als een proxy en cache voor publieke repositories (PyPI, npm) en als een private repository voor eigen ontwikkelde packages.

**Voordelen:**

-   **Betrouwbaarheid**: Garandeert de beschikbaarheid van dependencies, zelfs als de publieke repository offline is.
-   **Beveiliging**: Maakt het mogelijk om dependencies te scannen op kwetsbaarheden voordat ze worden gebruikt.
-   **Snelheid**: Snellere builds door het cachen van packages in het lokale netwerk.

**Implementatie**: Hoewel de daadwerkelijke opzet van een Nexus/Artifactory-server buiten de scope van deze fase valt, wordt de configuratie van de package managers (`pip`, `npm`) voorbereid om naar deze interne repository te wijzen zodra deze beschikbaar is.

## 5. Conclusie

De implementatie van deze standaarden en tools vormt een cruciale stap in de professionalisering van het ontwikkelproces. Het zorgt voor een hogere en consistentere codekwaliteit, een gestructureerd release-proces en een betere controle over de software-supply-chain. Dit legt de basis voor een efficiëntere en minder foutgevoelige ontwikkeling in de volgende fasen.
