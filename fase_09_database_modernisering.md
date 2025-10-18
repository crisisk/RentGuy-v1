# Fase 9: Database Modernisering

## 1. Inleiding

De database is het hart van de Rentguy-applicatie. De betrouwbaarheid, performance en schaalbaarheid van de database zijn direct van invloed op de gebruikerservaring en de stabiliteit van het hele systeem. Deze fase beschrijft de stappen om de huidige PostgreSQL-database te moderniseren en voor te bereiden op de eisen van een enterprise-omgeving.

## 2. Huidige Situatie

De huidige opzet bestaat uit een enkele PostgreSQL-container die wordt beheerd door Docker Compose. Hoewel dit een prima startpunt is, heeft het een aantal inherente beperkingen:

-   **Single Point of Failure**: Als de container of de onderliggende host faalt, is de hele applicatie onbereikbaar.
-   **Beperkte Schaalbaarheid**: Alle database-queries (zowel lees- als schrijfoperaties) worden door dezelfde server afgehandeld, wat een bottleneck kan worden bij toenemende belasting.
-   **Geen Formeel Backup- en Herstelplan**: Er is geen geautomatiseerd proces voor het maken van backups en het testen van een disaster recovery-scenario.

## 3. Moderniseringsstrategie

We implementeren een drieledige strategie om de database te moderniseren:

### 3.1. Backup en Disaster Recovery

Een waterdicht backup- en herstelplan is niet onderhandelbaar.

-   **Geautomatiseerde Backups**: Er wordt een dagelijkse, geautomatiseerde backup-procedure opgezet. Dit wordt gerealiseerd door een apart script of een `cronjob` op de host die `pg_dump` gebruikt om een volledige logische backup van de database te maken.
-   **Off-site Opslag**: De backups worden versleuteld en opgeslagen in een veilige, externe locatie (bv. een S3-compatibele object store). Dit beschermt de data tegen verlies bij een volledige server-crash.
-   **Recovery Plan**: Er wordt een gedocumenteerd en getest herstelplan opgesteld. Dit plan beschrijft de stappen om de database vanuit een backup te herstellen en definieert de Recovery Time Objective (RTO) en Recovery Point Objective (RPO).

### 3.2. Performance Optimalisatie

Om de database snel en efficiënt te houden, implementeren we twee belangrijke verbeteringen:

-   **Connection Pooling**: We introduceren **PgBouncer** als een connection pooler. PgBouncer plaatst zichzelf tussen de applicatie en de PostgreSQL-database. Het beheert een pool van databaseverbindingen en deelt deze uit aan de applicatie wanneer nodig. Dit voorkomt dat de database wordt overbelast door een groot aantal gelijktijdige, kortlevende verbindingen, wat een veelvoorkomend probleem is bij webapplicaties.
-   **Indexering en Query-analyse**: Er wordt een proces ingericht voor het periodiek analyseren van trage queries met behulp van `EXPLAIN ANALYZE`. Op basis van deze analyse worden waar nodig nieuwe indexes toegevoegd om de query-performance te verbeteren.

### 3.3. Schaalbaarheid: Read Replicas

Om de lees-performance te schalen, wordt een **read replica** geïntroduceerd.

-   **Concept**: Een read replica is een tweede PostgreSQL-server die een continue, read-only kopie van de primaire database onderhoudt via streaming replication.
-   **Implementatie**: Er wordt een tweede PostgreSQL-container opgezet die is geconfigureerd als replica van de primaire database. De applicatie wordt vervolgens aangepast om alle schrijfoperaties (`INSERT`, `UPDATE`, `DELETE`) naar de primaire database te sturen en een significant deel van de leesoperaties (`SELECT`) naar de read replica. Dit vereist een aanpassing in de database-connectielogica van de applicatie, waarbij twee verschillende database-URL's worden beheerd.

## 4. Conclusie

De modernisering van de database is een cruciale stap. De implementatie van geautomatiseerde backups en een herstelplan verhoogt de betrouwbaarheid en data-veiligheid. Het gebruik van een connection pooler en een strategie voor query-optimalisatie zorgt voor een blijvend performante database. Tot slot biedt de introductie van een read replica een concrete oplossing voor het schalen van de applicatie bij een toenemend aantal gebruikers. Samen transformeren deze maatregelen de database van een potentieel knelpunt naar een robuust en schaalbaar fundament voor de Rentguy-applicatie.
