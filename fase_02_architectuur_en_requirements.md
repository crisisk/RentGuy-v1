# Fase 2: Enterprise-Grade Architectuur en Requirements

## 1. Inleiding

Dit document definieert de doelarchitectuur en de non-functionele requirements voor de transformatie van de Rentguy-applicatie naar een enterprise-grade niveau. Het dient als de fundering voor alle volgende technische beslissingen en implementaties. De keuzes zijn gebaseerd op de analyse van de bestaande codebase en de doelstelling om een schaalbaar, betrouwbaar, veilig en onderhoudbaar platform te creëren.

## 2. Doelarchitectuur: Service-Oriented Architecture (SOA) op Docker

Voor de Rentguy-applicatie wordt gekozen voor een **Service-Oriented Architecture (SOA)**, geïmplementeerd op de bestaande Docker-infrastructuur. Deze keuze is een pragmatische evolutie van de huidige modulaire monolith. Een volledige overstap naar microservices wordt op dit moment als te complex en risicovol ingeschat, terwijl een SOA-aanpak de mogelijkheid biedt om de applicatie op te delen in logische, onafhankelijke services zonder de overhead van een complex microservices-ecosysteem.

De belangrijkste principes van de doelarchitectuur zijn:

- **Duidelijk gedefinieerde services**: De bestaande modules (bv. `inventory`, `projects`, `billing`) worden verder geformaliseerd als onafhankelijke services met strikt gedefinieerde API's.
- **Communicatie via API's**: Services communiceren uitsluitend via goed gedocumenteerde RESTful API's. Directe database-toegang tussen services is niet toegestaan.
- **Gedeelde infrastructuur, gescheiden logica**: De services draaien binnen dezelfde Docker-omgeving en kunnen resources delen, maar hun businesslogica en data-opslag zijn strikt gescheiden.

Deze aanpak biedt een goede balans tussen de huidige opzet en een toekomstvaste architectuur. Het stelt ons in staat om de applicatie stapsgewijs te moderniseren en de complexiteit beheersbaar te houden.

## 3. Non-Functionele Requirements

De volgende tabel definieert de belangrijkste non-functionele requirements (NFRs) en de bijbehorende Key Performance Indicators (KPI's) voor de enterprise-grade Rentguy-applicatie.

| Categorie | Requirement | KPI | Meetmethode |
| :--- | :--- | :--- | :--- |
| **Beschikbaarheid** | De applicatie moet hoog beschikbaar zijn. | 99.9% uptime (max. 8.76 uur downtime per jaar) | Externe monitoring service (bv. UptimeRobot, Pingdom) |
| **Performance** | API-responses moeten snel zijn. | 95% van alle API-calls < 200ms | APM-tool (bv. Prometheus, Datadog) |
| | Pagina laadtijden moeten acceptabel zijn. | Core Web Vitals: LCP < 2.5s | Real User Monitoring (RUM) |
| **Schaalbaarheid** | Het systeem moet automatisch kunnen schalen. | Horizontale schaling van containers binnen 5 minuten | Monitoring van container-replicas in Docker Swarm |
| **Beveiliging** | Alle data-overdracht moet versleuteld zijn. | 100% van de externe communicatie via HTTPS | SSL Labs test, periodieke scans |
| | Geen kritieke kwetsbaarheden in de code. | 0 kritieke kwetsbaarheden in SAST/DAST scans | Geautomatiseerde scans in CI/CD-pijplijn |
| **Onderhoudbaarheid** | Code moet voldoen aan standaarden. | 100% code coverage voor nieuwe features | Code quality gates in CI/CD (bv. SonarQube) |

## 4. Security en Compliance Framework

Het security- en compliance-framework is gebaseerd op de volgende pijlers:

- **GDPR-compliance**: Alle processen en data-opslag moeten voldoen aan de GDPR-richtlijnen. Dit omvat data-minimalisatie, het recht op vergetelheid en het documenteren van datastromen.
- **OWASP Top 10**: De applicatie wordt ontwikkeld en getest met de OWASP Top 10 als leidraad om de meest voorkomende webapplicatie-kwetsbaarheden te mitigeren.
- **Secret Management op de VPS**: In lijn met de opdracht worden secrets veilig opgeslagen op de Virtual Private Server (VPS). Dit wordt gerealiseerd door gebruik te maken van versleutelde bestanden (bv. met `ansible-vault` of een vergelijkbare tool) en strikte file permissions. De applicatie laadt de secrets bij het opstarten in het geheugen.

## 5. Conclusie

Dit document legt de architectonische en kwalitatieve basis voor de verdere ontwikkeling van de Rentguy-applicatie. De gekozen SOA-architectuur op Docker, in combinatie met de gedefinieerde non-functionele requirements en het security-framework, biedt een duidelijk pad naar een robuuste en toekomstbestendige enterprise-applicatie.
