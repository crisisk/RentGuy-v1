# Fase 4: Fundamentele CI/CD Pijplijn Implementatie

## 1. Inleiding

Deze fase richt zich op de implementatie van een fundamentele Continuous Integration/Continuous Delivery (CI/CD) pijplijn voor de Rentguy-applicatie. Het doel is om het bouw-, test- en deploymentproces te automatiseren, wat leidt tot snellere feedback, hogere codekwaliteit en een betrouwbaarder releaseproces. We zullen de bestaande GitHub Actions workflow uitbreiden en aanpassen aan de enterprise-grade vereisten.

## 2. Uitbreiding van GitHub Actions Workflow

De bestaande `.github/workflows/ci.yml` zal worden uitgebreid om de volgende stappen te omvatten:

### 2.1. Code Checkout

De eerste stap blijft het uitchecken van de code uit de repository.

### 2.2. Installatie van Dependencies

De benodigde Python- en Node.js-dependencies worden geïnstalleerd. Voor Python wordt `pip install -r requirements.txt` gebruikt, en voor Node.js `npm install` in de frontend-mappen.

### 2.3. Code Kwaliteitscontroles (Linters en Formatters)

De in Fase 3 gedefinieerde linters (Flake8, ESLint) en formatters (Black, Prettier) worden uitgevoerd. Bij falen van deze checks wordt de build afgebroken, wat afdwingt dat code voldoet aan de gestelde standaarden.

**Voorbeeld GitHub Actions stap voor Python (backend):**

```yaml
- name: Run Black and Flake8
  run: |
    pip install black flake8
    black --check .
    flake8 .
```

**Voorbeeld GitHub Actions stap voor JavaScript (frontend):**

```yaml
- name: Run ESLint and Prettier
  working-directory: ./apps/web # of ./apps/pwa-scanner
  run: |
    npm install
    npm run lint
    npm run format -- --check
```

### 2.4. Unit en Integratietests

De unit- en integratietests (zoals gedefinieerd in Fase 5) worden uitgevoerd. Alleen als alle tests slagen, gaat de pijplijn verder.

**Voorbeeld GitHub Actions stap voor Python tests:**

```yaml
- name: Run Python Tests
  run: |
    pip install pytest
    pytest ./backend/tests
```

**Voorbeeld GitHub Actions stap voor JavaScript tests:**

```yaml
- name: Run Frontend Tests
  working-directory: ./apps/web
  run: |
    npm test
```

### 2.5. Docker Image Build

Na succesvolle codekwaliteitscontroles en tests worden de Docker-images voor de backend en frontend gebouwd. Deze images worden getagd met de Git commit SHA of een versienummer.

**Voorbeeld GitHub Actions stap voor Docker build:**

```yaml
- name: Build Docker Images
  run: |
    docker build -t rentguy-backend:$(git rev-parse HEAD) ./backend
    docker build -t rentguy-frontend:$(git rev-parse HEAD) ./apps/web
```

### 2.6. Docker Image Push (naar een Container Registry)

De gebouwde Docker-images worden gepusht naar een container registry (bv. Docker Hub, GitHub Container Registry, of een private registry). Dit maakt de images beschikbaar voor deployment naar verschillende omgevingen.

**Voorbeeld GitHub Actions stap voor Docker push:**

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v1
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

- name: Push Docker Images
  run: |
    docker push rentguy-backend:$(git rev-parse HEAD)
    docker push rentguy-frontend:$(git rev-parse HEAD)
```

## 3. Deployment naar Ontwikkelomgeving

Na een succesvolle build en push van de Docker-images, wordt de applicatie automatisch gedeployed naar een ontwikkelomgeving. Dit kan een eenvoudige `docker compose up` zijn op een development server, of een meer geavanceerde deployment naar een staging-omgeving (zie Fase 14).

**Voorbeeld GitHub Actions stap voor deployment (eenvoudig):**

```yaml
- name: Deploy to Development Environment
  env:
    SSH_PRIVATE_KEY: ${{ secrets.DEV_SSH_PRIVATE_KEY }}
    HOST: ${{ secrets.DEV_HOST }}
    USER: ${{ secrets.DEV_USER }}
  run: |
    echo "$SSH_PRIVATE_KEY" > deploy_key
    chmod 600 deploy_key
    ssh -i deploy_key -o StrictHostKeyChecking=no $USER@$HOST "cd /path/to/rentguy-dev && docker compose pull && docker compose up -d"
```

## 4. Conclusie

Deze fundamentele CI/CD pijplijn automatiseert de essentiële stappen van het ontwikkelproces. Het zorgt voor snelle feedback over codekwaliteit en functionaliteit, en bereidt de weg voor geavanceerdere deploymentstrategieën in latere fasen. De integratie van linters, tests en geautomatiseerde Docker builds en pushes vormt de ruggengraat van een enterprise-grade ontwikkelworkflow.
