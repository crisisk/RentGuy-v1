# RentGuy Go-Live Runbook

This runbook describes the exact steps required to take the RentGuy platform live with every feature enabled. It covers the FastAPI backend, the React/Vite frontend, supporting infrastructure, smoke tests, and end-user validation. Follow every section in order; the deployment is only complete when all acceptance checks succeed. Combine it with the operational checklist in [`docs/GO_LIVE_CHECKLIST.md`](./GO_LIVE_CHECKLIST.md) to log each debug enabler and stakeholder sign-off.

---

## 1. Preparation

### 1.1 Repository Checkout
```bash
sudo mkdir -p /opt/rentguy
sudo chown $USER:$USER /opt/rentguy
cd /opt/rentguy
git clone <repository-url> .
```

Ensure the workspace is clean before building:
```bash
git fetch origin
git checkout main
git pull --ff-only
npm ci
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 1.2 Required Services
- **PostgreSQL 15+** reachable on the private network.
- **Redis (optional)** only if real-time websockets are enabled.
- **SMTP relay** with credentials for transactional onboarding emails.
- **Docker Engine 20.10+ and Docker Compose 2.0+** on the host if running containers.

### 1.3 Environment Variables
Create `/opt/rentguy/.env` with production values:
```env
# Database
POSTGRES_HOST=localhost
POSTGRES_DB=rentguy
POSTGRES_USER=rentguy
POSTGRES_PASSWORD=<secure-password>

# JWT / Security
JWT_SECRET=<generated-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=60

# SMTP for onboarding emails
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-app-password>
SMTP_FROM_EMAIL=rentguy@your-domain.com

# Frontend build options
VITE_API_URL=https://api.your-domain.com
# Options: planner (default), scanner, marketing
VITE_APP_MODE=planner
```

Check the configuration with:
```bash
set -a
source .env
set +a
```

### 1.4 Secrets synchroniseren via het dashboard

- Meld aan op [`https://rentguy.sevensa.nl/dashboard`](https://rentguy.sevensa.nl/dashboard) met een administrator-account.
- Vul ontbrekende waarden in voor database, JWT, e-mail, betalingen en observability.
- Gebruik de knop **Secrets synchroniseren** om de versleutelde waarden naar `.env.secrets` te schrijven. Dit bestand wordt tijdens
  de volgende containerdeploy automatisch ingelezen.
- Controleer de e-maildiagnosekaart; de status moet `OK` tonen voordat Express/React-mailflows actief worden.
- Indien het dashboard aangeeft dat een herstart nodig is, herstart de FastAPI-service na het synchroniseren zodat alle
  configuratie opnieuw wordt ingeladen.

---

## 2. Database Migration & Seeding

1. **Backup existing data**
   ```bash
   pg_dump -Fc -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB \
     > /opt/rentguy/backups/pre_onboarding_$(date +%Y%m%d%H%M).dump
   ```
2. **Apply migrations**
   ```bash
   cd /opt/rentguy/backend
   source .venv/bin/activate
   alembic upgrade head
   ```
3. **Seed onboarding steps and tips**
   ```bash
   python - <<'PY'
   from app.core.db import SessionLocal
   from app.modules.onboarding.repo import OnboardingRepo

   db = SessionLocal()
   try:
       repo = OnboardingRepo(db)
       repo.ensure_seed()
       db.commit()
   finally:
       db.close()
   PY
   ```
4. **Verify schema**
   ```bash
   psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST/$POSTGRES_DB \
     -c "\dt onb_*"
   ```
   Expect the tables `onb_steps`, `onb_progress`, and `onb_tips`.

---

## 3. Backend Verification

Run automated checks:
```bash
cd /opt/rentguy/backend
pytest
``` 

Manual smoke tests (after `uvicorn app.main:app --host 0.0.0.0 --port 8000`):
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=rentguy@demo.local&password=rentguy" | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/onboarding/steps
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/onboarding/progress?user_email=rentguy@demo.local"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/onboarding/tips?module=projects"
```
Ensure each command returns HTTP 200 with populated JSON.

---

## 4. Frontend Build & Tests

1. **Install dependencies**
   ```bash
   cd /opt/rentguy
   npm ci
   ```
2. **Static analysis**
   ```bash
   npm run lint
   npm run typecheck
   ```
3. **Unit & component tests**
   ```bash
   npm run test
   ```
4. **Production build**
   ```bash
   npm run build
   ```
   The compiled assets are written to `dist/` and `manifest.json` contains the resolved environment.

---

## 5. Container Deployment (Production)

Compose file `docker-compose.production.yml` already maps the backend, frontend, and postgres services. Deploy using:
```bash
cd /opt/rentguy
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Confirm health checks:
```bash
curl -f http://localhost:8000/health
curl -f http://localhost:5175/healthz || curl -f http://localhost:80/healthz
```
Expose the web container via Nginx or Traefik with TLS termination.

---

## 6. Post-Deployment Validation

### 6.1 Functional walkthrough
1. Login to the planner UI at `https://app.your-domain.com` using the seeded demo account.
2. Ensure the **OnboardingOverlay** appears with all seven steps and can be closed.
3. Complete a step and confirm the progress bar updates (~14%).
4. Navigate through core modules: Projects, Inventory, Crew, Transport, Billing, Warehouse.
5. Use the scanner view by appending `?mode=scanner` (or set `VITE_APP_MODE=scanner`) and complete a mock scan. Preview the marketing landing by visiting the frontend with `?mode=marketing` when you need to demo the public experience locally.
6. Trigger `Send welcome email` via the admin panel or `POST /api/v1/onboarding/send-welcome`.

### 6.2 Observability
- Inspect backend logs at `/opt/rentguy/logs/fastapi.log`.
- Check browser console for frontend errors.
- Review SMTP delivery reports.

---

## 7. Rollback Procedure
1. `docker compose down`
2. Restore the database backup:
   ```bash
   pg_restore -c -d $POSTGRES_DB -h $POSTGRES_HOST -U $POSTGRES_USER \
     /opt/rentguy/backups/pre_onboarding_<timestamp>.dump
   ```
3. Checkout the previous git tag:
   ```bash
   git checkout <previous-release-tag>
   docker compose -f docker-compose.production.yml up -d
   ```

---

## 8. Operational Handover
- Update the status board in `artifacts/debug/triage-plan.md` to reflect deployment.
- File runbook notes in the incident response system.
- Notify stakeholders that onboarding is available and provide the new user guide in `docs/USER_MANUAL.md`.
