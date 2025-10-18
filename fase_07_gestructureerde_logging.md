# Fase 7: Gestructureerde Logging

## 1. Inleiding

Effectieve logging is onmisbaar voor het monitoren, debuggen en beveiligen van een applicatie. In een gedistribueerd systeem, zelfs een relatief eenvoudige opzet met een paar Docker-containers, is het onpraktisch om logs handmatig per container te bekijken. Deze fase beschrijft de overstap van ongestructureerde, losse logs naar een gecentraliseerd en gestructureerd loggingsysteem.

## 2. Van Ongestructureerd naar Gestructureerd

**Huidige situatie:** De applicatie schrijft logs naar `stdout`, die door Docker worden opgevangen. Deze logs zijn vaak ongestructureerde tekst, wat machinale analyse moeilijk maakt.

**Doel:** Alle logs worden in een gestructureerd formaat (JSON) geschreven. Elke log-entry bevat naast de boodschap ook een set van gestandaardiseerde velden:

-   `timestamp`: Tijdstip van de log-entry (in UTC).
-   `level`: Log-niveau (bv. `INFO`, `WARNING`, `ERROR`).
-   `service`: Naam van de service (bv. `backend`, `frontend`).
-   `request_id`: Een unieke identifier om alle logs van één specifieke API-request te kunnen traceren.
-   `user_id`: (Indien van toepassing) De ID van de ingelogde gebruiker.

## 3. Implementatie in de Applicatie

### Backend (FastAPI)

We gebruiken de `structlog` library in Python. `structlog` is een krachtige library die het eenvoudig maakt om gestructureerde logs te produceren.

1.  **Installatie**: `pip install structlog`
2.  **Configuratie**: `structlog` wordt geconfigureerd in de `main.py` van de FastAPI-applicatie om de standaard `uvicorn` logger te vervangen. Er wordt een middleware toegevoegd die aan elke request een unieke `request_id` toekent en deze toevoegt aan de log-context.

### Frontend (React)

Voor de frontend is uitgebreide logging minder gebruikelijk, maar het is wel nuttig om kritieke fouten te loggen. We kunnen een eenvoudige logging-wrapper maken die fouten naar een API-endpoint op de backend stuurt, die ze vervolgens opneemt in de centrale log-stream.

## 4. Centrale Log Aggregatie: De ELK Stack

Om de gestructureerde logs van alle containers te verzamelen, te doorzoeken en te visualiseren, wordt de **ELK Stack** (Elasticsearch, Logstash, Kibana) opgezet.

-   **Elasticsearch**: Een krachtige zoekmachine en database, geoptimaliseerd voor het opslaan en doorzoeken van grote hoeveelheden logdata.
-   **Logstash**: Een data-processing pipeline die logs van verschillende bronnen ontvangt, transformeert en doorstuurt naar Elasticsearch. (In een Docker-omgeving wordt vaak **Fluentd** of **Filebeat** als een lichter alternatief gebruikt).
-   **Kibana**: Een web-interface voor het doorzoeken, analyseren en visualiseren van de data in Elasticsearch.

#### Docker Integratie

1.  **Logging Driver**: De Docker daemon wordt geconfigureerd om de `fluentd` logging driver te gebruiken. Dit zorgt ervoor dat alle `stdout` van de containers automatisch wordt doorgestuurd naar een Fluentd-container.
2.  **Fluentd/Filebeat**: Een Fluentd- of Filebeat-container wordt opgezet. Deze ontvangt de logs van de Docker-containers, parseert de JSON-structuur en stuurt ze door naar Elasticsearch.
3.  **ELK Stack Deployment**: De ELK Stack zelf wordt ook als een set van Docker-containers gedeployed, beheerd via een aparte `docker-compose.yml`.

## 5. Voordelen van deze Aanpak

-   **Gecentraliseerd Overzicht**: Alle logs van alle services op één plek.
-   **Krachtige Zoekmogelijkheden**: Snel zoeken en filteren op basis van velden als `level`, `service`, `request_id` of `user_id`.
-   **Proactieve Monitoring**: Mogelijkheid om dashboards en alerts te creëren in Kibana (bv. een alert als het aantal `ERROR`-logs een bepaalde drempel overschrijdt).
-   **Snellere Troubleshooting**: Het traceren van een probleem over meerdere services heen wordt aanzienlijk eenvoudiger dankzij de `request_id`.

## 6. Conclusie

De implementatie van gestructureerde en gecentraliseerde logging is een fundamentele stap richting een professionele, enterprise-grade applicatie. Het biedt de noodzakelijke *observability* om de applicatie effectief te kunnen beheren, problemen snel op te lossen en de algehele betrouwbaarheid te verhogen.
