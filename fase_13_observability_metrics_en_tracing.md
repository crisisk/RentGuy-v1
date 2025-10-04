# Fase 13: Observability: Metrics en Tracing

## 1. Inleiding

Observability, of waarneembaarheid, is de mate waarin je de interne staat van een systeem kunt afleiden uit de externe output. In Fase 7 hebben we de eerste pijler van observability geïmplementeerd: logging. Deze fase introduceert de andere twee pijlers: **metrics** en **distributed tracing**. Samen bieden deze drie pijlers een compleet en diepgaand inzicht in de performance en het gedrag van de Rentguy-applicatie, wat essentieel is voor proactieve monitoring en snelle probleemoplossing.

## 2. Metrics: De Hartslag van het Systeem

Metrics zijn numerieke, tijdgebonden datapunten die de gezondheid en performance van het systeem weergeven. Denk aan het aantal requests per seconde, de gemiddelde API-responstijd, CPU-gebruik, of het aantal actieve databaseverbindingen.

### Gekozen Tooling: Prometheus & Grafana

-   **Prometheus**: Een toonaangevend open-source monitoring-systeem en time-series database. Prometheus werkt volgens een *pull-model*: het schraapt periodiek de metrics van de ` /metrics`-endpoints die door de applicaties worden aangeboden.
-   **Grafana**: Een krachtige visualisatietool waarmee we interactieve dashboards kunnen bouwen op basis van de data in Prometheus.

### Implementatie

1.  **Instrumentatie van de Backend (FastAPI)**: We gebruiken de `starlette-prometheus` library. Deze voegt automatisch een `/metrics`-endpoint toe aan de FastAPI-applicatie en exposeert standaard metrics zoals request-latency, -aantallen en -fouten (de zogenaamde RED-metrics: Rate, Errors, Duration).
2.  **Database Monitoring**: We zetten een `postgres_exporter`-container op. Dit is een gespecialiseerde service die de interne statistieken van PostgreSQL omzet naar een Prometheus-compatibel formaat, waardoor we inzicht krijgen in database-performance, actieve connecties, etc.
3.  **Deployment**: Prometheus en Grafana worden als nieuwe services toegevoegd aan de `docker-compose.yml`. Prometheus wordt geconfigureerd om de `/metrics`-endpoints van de backend en de `postgres_exporter` te scrapen.
4.  **Dashboards**: In Grafana worden dashboards geconfigureerd om de belangrijkste metrics te visualiseren. Er worden ook alerts ingesteld die het team via e-mail of Slack waarschuwen als bepaalde drempels worden overschreden (bv. als de API-error-rate boven de 1% komt).

## 3. Distributed Tracing: De Reis van een Request

In een gedistribueerd systeem wordt een enkele gebruikersactie vaak afgehandeld door meerdere services. Distributed tracing stelt ons in staat om de volledige levenscyclus van zo'n request te volgen, van de frontend-klik tot de database-query en terug. Elke stap in dit proces wordt een "span" genoemd, en de verzameling van spans voor één request is een "trace".

### Gekozen Tooling: OpenTelemetry & Jaeger

-   **OpenTelemetry (OTel)**: Een open-source, vendor-neutrale standaard en set van tools voor het instrumenteren van applicaties om traces, metrics en logs te genereren. Het is de opkomende industriestandaard.
-   **Jaeger**: Een populair open-source systeem, oorspronkelijk ontwikkeld door Uber, voor het opslaan, doorzoeken en visualiseren van de traces die door OpenTelemetry worden gegenereerd.

### Implementatie

1.  **Instrumentatie van de Backend (FastAPI)**: We gebruiken de `opentelemetry-instrumentation-fastapi` library. Deze "auto-instrumentatie" creëert automatisch spans voor elke inkomende request. We voegen ook instrumentatie toe voor `SQLAlchemy` (om database-queries te zien als spans) en `httpx` (om uitgaande API-calls te traceren).
2.  **Context Propagation**: OpenTelemetry zorgt automatisch voor "context propagation". Dit betekent dat de unieke `trace_id` wordt doorgegeven van de ene service naar de andere, waardoor de spans aan elkaar kunnen worden gekoppeld tot een volledige trace.
3.  **Deployment**: Jaeger wordt als een nieuwe service toegevoegd aan de `docker-compose.yml`. De OpenTelemetry SDK in de backend wordt geconfigureerd om de verzamelde traces te exporteren naar de Jaeger-collector.

## 4. Conclusie

Met de toevoeging van metrics en distributed tracing aan de bestaande logging, bereiken we een staat van volledige observability. We kunnen niet alleen zien *dat* er een probleem is (via alerts op metrics), maar ook *waar* het probleem zich voordoet (via logs) en *waarom* het gebeurt (door de volledige context van een request te analyseren met tracing). Dit stelt het DevOps-team in staat om van een reactieve naar een proactieve beheerstrategie te evolueren, de performance te optimaliseren en de algehele betrouwbaarheid van de Rentguy-applicatie drastisch te verhogen.
