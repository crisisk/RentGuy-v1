# Fase 16: Geautomatiseerde Security Scanning (SAST/DAST)

## 1. Inleiding

In een moderne ontwikkelcyclus is security geen achterafje, maar een integraal onderdeel van het hele proces. Dit wordt het "Shift Left"-principe genoemd: het zo vroeg mogelijk in de development lifecycle opsporen en oplossen van security-kwetsbaarheden. Deze fase beschrijft de implementatie van een geautomatiseerde security-scanstrategie, bestaande uit SAST, DAST en SCA, om de Rentguy-applicatie continu te beschermen tegen bekende bedreigingen.

## 2. Drie Lagen van Geautomatiseerde Security

We implementeren een drielaagse aanpak om een brede dekking van potentiële kwetsbaarheden te garanderen.

### 2.1. SAST (Static Application Security Testing)

SAST-tools analyseren de broncode van de applicatie zonder deze uit te voeren. Ze zoeken naar patronen die kunnen wijzen op security-kwetsbaarheden.

-   **Concept**: De tool scant de codebase op basis van een set van regels die bekende anti-patterns identificeren, zoals het gebruik van onveilige functies, het ontbreken van input-validatie, of potentiële SQL-injection-kwetsbaarheden.
-   **Gekozen Tool**: Voor de Python-backend kiezen we voor **Bandit**. Bandit is een open-source tool die specifiek is ontworpen om veelvoorkomende security-issues in Python-code te vinden.
-   **Integratie**: Bandit wordt als een stap toegevoegd aan de CI/CD-pijplijn. Bij elke pull request wordt de code gescand. Als er kwetsbaarheden met een hoge of medium severity worden gevonden, faalt de build, waardoor de merge wordt geblokkeerd totdat de issues zijn opgelost.

### 2.2. DAST (Dynamic Application Security Testing)

DAST-tools benaderen de applicatie als een "black box". Ze testen de *draaiende* applicatie door deze aan te vallen met een breed scala aan bekende aanvalstechnieken.

-   **Concept**: De tool fungeert als een geautomatiseerde penetration tester. Het crawlt de applicatie om alle endpoints en invoervelden te ontdekken en probeert vervolgens kwetsbaarheden zoals Cross-Site Scripting (XSS), SQL Injection, en onveilige server-configuraties te exploiteren.
-   **Gekozen Tool**: We gebruiken **OWASP ZAP (Zed Attack Proxy)**. ZAP is een van de meest populaire en uitgebreide open-source DAST-tools.
-   **Integratie**: Een ZAP-scan wordt automatisch gestart in de CI/CD-pijplijn na elke succesvolle deployment naar de **staging-omgeving**. De scan wordt geconfigureerd om de applicatie agressief te scannen en een rapport te genereren. Een kritieke bevinding kan de pijplijn doen falen.

### 2.3. SCA (Software Composition Analysis)

Moderne applicaties bestaan voor een groot deel uit third-party libraries. SCA-tools scannen deze afhankelijkheden op bekende kwetsbaarheden (CVE's - Common Vulnerabilities and Exposures).

-   **Concept**: De tool analyseert de `requirements.txt` (Python) en `package.json` (JavaScript) bestanden en vergelijkt de gebruikte versies van de libraries met een database van bekende kwetsbaarheden.
-   **Gekozen Tool**: We gebruiken **Snyk Open Source** of het ingebouwde `npm audit` / `pip-audit`. Snyk biedt een uitstekende gratis tier die perfect is voor dit doel en integreert naadloos met GitHub.
-   **Integratie**: De SCA-scan wordt bij elke build uitgevoerd. Een nieuwe kwetsbaarheid in een dependency wordt direct zichtbaar in de pull request, inclusief informatie over de kwetsbaarheid en de aanbevolen upgrade-versie.

## 3. Conclusie

De combinatie van SAST, DAST en SCA creëert een robuust en geautomatiseerd vangnet voor security. Door deze scans te integreren in de CI/CD-pijplijn, wordt security een vanzelfsprekend onderdeel van de dagelijkse workflow van de ontwikkelaar. Kwetsbaarheden worden vroegtijdig ontdekt en opgelost, wat de kosten en risico's aanzienlijk verlaagt en de algehele veiligheid van de Rentguy-applicatie naar een enterprise-niveau tilt.
