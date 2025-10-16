# RentGuy Go-Live Checklist

Deze checklist bundelt alle technische en functionele stappen die nodig zijn om RentGuy live te zetten met alle modules volledig functioneel en gedebugd. De lijst is chronologisch opgebouwd zodat teams de release gecontroleerd kunnen doorlopen.

---

## 1. Pre-flight validatie
1. **Repository synchroniseren**
   ```bash
   git fetch origin
   git checkout main
   git pull --ff-only
   ```
2. **Dependencies voorbereiden**
   ```bash
   npm ci
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Debug- en kwaliteitsrun uitvoeren**
   ```bash
   cd /opt/rentguy
   npm run debug:prepare
   npm run debug:scan
   npm run debug:run
   npm run typecheck
   npm run test
   ```
   - Controleer `artifacts/debug/triage-plan.md` en `artifacts/debug/baseline-findings.json`. Alle items moeten groen zijn voordat je verdergaat.
   - In `backend/` voer je `pytest` en `alembic upgrade head` uit op de stagingdatabase om migratie-issues te detecteren.

---

## 2. Omgevingsconfiguratie
1. **Productie `.env` vullen** met geldige waarden voor database, JWT, SMTP en front-end variabelen. Zie `docs/DEPLOYMENT.md` voor het volledige voorbeeld.
2. **Geheime waarden testen** via `set -a && source .env && set +a`. Foutmeldingen corrigeren voordat je doorgaat.
3. **Netwerk & infrastructuur**
   - PostgreSQL 15+, Redis (optioneel) en SMTP moeten bereikbaar zijn.
   - Docker Engine 20.10+ en Compose 2.x geïnstalleerd.
   - Ingress (Nginx/Traefik) voorbereid met TLS-certificaten.
4. **Secrets-dashboard gebruiken**
   - Log in op [`https://rentguy.sevensa.nl/dashboard`](https://rentguy.sevensa.nl/dashboard) met een admin-account.
   - Vul ontbrekende `.env`-sleutels in, controleer de e-maildiagnose en synchroniseer naar `.env.secrets`.
   - Bevestig dat eventuele “herstart vereist”-meldingen zijn opgevolgd voordat je verdergaat.

---

## 3. Database & data-integriteit
1. Maak een backup van de productiedatabase (`pg_dump -Fc ...`).
2. Voer `alembic upgrade head` uit binnen de backend-venv.
3. Draai het onboarding seed-script (zie `docs/DEPLOYMENT.md`, sectie 2).
4. Controleer tabellen (`\dt onb_*`) en steekproefsgewijs data-integriteit (bijv. projecten, inventory-items, crewleden).

---

## 4. Backend release
1. Bouw en start de backend:
   ```bash
   cd /opt/rentguy
   docker compose -f docker-compose.production.yml build backend
   docker compose -f docker-compose.production.yml up -d backend
   ```
2. Valideer healthchecks en kernroutes:
   ```bash
   curl -f http://localhost:8000/health
   pytest --maxfail=1 --disable-warnings backend/tests/smoke
   ```
3. Controleer logs (`docker compose logs backend`) op errors of tracebacks.

---

## 5. Frontend release
1. Bouw de frontend-assets en image:
   ```bash
   npm run build
   docker build -f Dockerfile.frontend -t rentguy-frontend:prod .
   docker compose -f docker-compose.production.yml up -d frontend
   ```
2. Healthcheck en statische validatie:
   ```bash
   curl -f http://localhost:5175/healthz || curl -f http://localhost/healthz
   ```
3. Inspecteer browserconsole en netwerk-tab in een incognito sessie voor warnings/errors.

---

## 6. Functionele end-to-end validatie
1. **Authenticatie & onboarding**
   - Log in met een demogebruiker en controleer dat de OnboardingOverlay 7 stappen toont.
   - Voltooi minstens één stap; status moet in backend (`/api/v1/onboarding/progress`) wijzigen.
2. **Projecten & planning**
   - Maak een project aan, plan crew en voeg materiaal toe.
   - Controleer agendaweergave in de planner (FullCalendar).
3. **Magazijnscanner**
   - Start `https://app.your-domain.com?mode=scanner`, scan een testbarcode of voer handmatig een item in.
   - Bevestig dat updates in voorraadmodule verschijnen.
4. **Transport & logistiek**
   - Genereer een transportorder en download de PDF of check routekaart.
5. **Facturatie**
   - Maak een conceptfactuur, voer export (CSV/UBL) uit en test Mollie-webhook (stub) indien beschikbaar.
6. **Communicatie**
   - Trigger de welkomstmail en controleer levering via SMTP-logs.
7. **Observability**
   - Verifieer dat metrics/logs binnenkomen in monitoring (Prometheus/ELK) en dat geen errors achterblijven.

Alle issues die tijdens deze ronde gevonden worden moeten worden opgelost en opnieuw getest voordat je doorgaat.

---

## 7. Stakeholder goedkeuring
1. Laat operations, finance en warehouse leads de relevante modules valideren.
2. Documenteer akkoordmomenten in het projectmanagementsysteem.

---

## 8. Livegang & nazorg
1. Schakel DNS/ingress om naar de nieuwe release.
2. Voer rooktests opnieuw uit op productie-URL’s.
3. Houd logging en metrics de eerste 2 uur continu in de gaten.
4. Update statuspagina, stuur releasebericht naar klanten en verwijs naar `docs/USER_MANUAL.md`.
5. Archiveer de checklist in het release-dossier en noteer eventuele afwijkingen of follow-up taken.

Met deze checklist is de volledige scope – onboarding, planner, scanner, transport, facturatie en communicatie – gevalideerd voor livegang.
