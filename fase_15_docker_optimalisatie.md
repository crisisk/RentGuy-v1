# Fase 15: Docker Optimalisatie

## 1. Inleiding

Docker is de ruggengraat van onze deploymentstrategie. Hoewel de huidige Docker-setup functioneel is, zijn er significante optimalisaties mogelijk om onze images kleiner, sneller en veiliger te maken. Deze fase richt zich op het verfijnen van onze Dockerfiles en het toepassen van best practices voor het bouwen en draaien van containers. Aangezien we (voorlopig) bij Docker blijven en niet overstappen op Kubernetes, is het optimaliseren van onze Docker-native setup des te belangrijker.

## 2. Optimalisatiestrategieën

We passen een reeks bewezen technieken toe om onze Docker-images en -workflow te verbeteren.

### 2.1. Multi-Stage Builds

Dit is de meest impactvolle techniek om de grootte van de uiteindelijke image drastisch te verkleinen.

-   **Concept**: Een Dockerfile kan meerdere `FROM`-instructies bevatten. Elke `FROM` start een nieuwe "build stage". We gebruiken een eerste stage (de `builder`) om de applicatie te bouwen en afhankelijkheden te installeren. In een tweede, finale stage kopiëren we alleen de noodzakelijke build-artefacten (bv. de gecompileerde Python-code of de gebouwde React-app) naar een minimale basis-image.
-   **Voordeel**: De uiteindelijke image bevat geen build-dependencies (zoals compilers, development headers, of `node_modules`), wat resulteert in een veel kleinere, veiligere en sneller te deployen image.

**Voorbeeld (Backend Dockerfile):**

```dockerfile
# ---- Build Stage ----
FROM python:3.11-slim as builder

WORKDIR /app

# Installeer alleen de build-dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# ---- Final Stage ----
FROM python:3.11-slim

WORKDIR /app

# Kopieer de gecompileerde packages uit de builder stage
COPY --from=builder /app/wheels /app/wheels
RUN pip install --no-cache /app/wheels/*

# Kopieer de applicatiecode
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
```

### 2.2. Optimaliseren van Layer Caching

Docker bouwt images in lagen. Door de instructies in de Dockerfile slim te ordenen, kunnen we de build-tijd aanzienlijk versnellen.

-   **Strategie**: Plaats de instructies die het minst vaak veranderen bovenaan. De `COPY` van de `requirements.txt` en de `pip install` moeten vóór de `COPY` van de applicatiecode komen. Hierdoor hoeft Docker de dependencies alleen opnieuw te installeren als de `requirements.txt` daadwerkelijk is gewijzigd, en niet bij elke code-wijziging.

### 2.3. Gebruik van Specifieke en Minimale Basis-Images

-   **Specificiteit**: Gebruik altijd specifieke versietags (bv. `python:3.11.5-slim`) in plaats van vage tags zoals `latest` of `python:3`. Dit zorgt voor voorspelbare en reproduceerbare builds.
-   **Minimalisme**: Gebruik `slim`- of `alpine`-varianten van de basis-images. Deze zijn aanzienlijk kleiner dan de standaard-images omdat ze alleen de strikt noodzakelijke OS-packages bevatten.

### 2.4. Container Health Checks

Docker Compose biedt de mogelijkheid om `healthcheck`-instructies te definiëren. Docker kan deze checks periodiek uitvoeren om te bepalen of een container nog correct functioneert.

-   **Implementatie**: Voor de backend kan dit een simpel `curl`-commando zijn naar een nieuw `/health`-endpoint. Voor de database kan het een `pg_isready`-commando zijn.
-   **Voordeel**: Dit geeft ons betere controle en inzicht. Een container die wel draait maar niet meer reageert, wordt nu als `unhealthy` gemarkeerd en kan automatisch worden herstart.

### 2.5. Security: Draaien als Non-Root Gebruiker

Standaard draaien processen in een container als de `root`-gebruiker. Dit is een onnodig security-risico. We configureren onze images om de applicatie als een niet-geprivilegieerde gebruiker te draaien.

-   **Implementatie**: In de Dockerfile voegen we een `RUN groupadd ...` en `RUN useradd ...` instructie toe, gevolgd door een `USER`-instructie om over te schakelen naar de nieuw aangemaakte gebruiker voordat de applicatie wordt gestart.

## 3. Conclusie

Door het toepassen van deze optimalisaties – multi-stage builds, layer caching, minimale images, health checks en het draaien als non-root gebruiker – maken we onze Docker-setup aanzienlijk robuuster. De resulterende images zijn kleiner, bouwen sneller en zijn veiliger. Dit verbetert niet alleen de efficiëntie van de CI/CD-pijplijn, maar verhoogt ook de algehele stabiliteit en veiligheid van de productieomgeving.
