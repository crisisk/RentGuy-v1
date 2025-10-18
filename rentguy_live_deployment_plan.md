# RentGuy Applicatie - Live Deployment Implementatieplan

**Auteur:** Manus AI  
**Datum:** 2025-09-30  
**Focus:** Onboarding functionaliteit live brengen

## 1. Overzicht

Dit document beschrijft de concrete stappen om de RentGuy applicatie met onboarding functionaliteit live te brengen op de VPS. De implementatie volgt de specificaties uit `pasted_content.txt` en gebruikt de `rentguyapp_onboarding_v0` versie als basis.

## 2. Huidige Status Analyse

### 2.1. Beschikbare Componenten

**Backend (FastAPI):**
- Database migratie `0007_onboarding.py` - definieert tabellen voor onboarding
- Onboarding module met complete API endpoints
- Seed data functionaliteit voor standaard stappen
- E-mail integratie via `mailer.py`

**Frontend (React/Vite):**
- `OnboardingOverlay.jsx` - interactieve overlay met voortgangsbalk
- `TipBanner.jsx` - contextuele tips per module
- `onbApi.js` - API communicatie helpers
- Integratie in `App.jsx` en `Planner.jsx`

**Database Schema:**
- `onb_steps` - onboarding stappen definitie
- `onb_progress` - gebruiker voortgang tracking
- `onb_tips` - contextuele tips per module

## 3. Implementatie Takenpakket

### 3.1. Database & Migraties

**Prioriteit: HOOG**

```bash
# 1. Draai Alembic migratie
cd backend
alembic upgrade head

# 2. Controleer tabellen
psql -d rentguy -c "\dt onb_*"

# 3. Verificeer seed data
python -c "from app.modules.onboarding.repo import OnboardingRepo; from app.core.db import get_db; repo = OnboardingRepo(next(get_db())); repo.ensure_seed()"
```

**Verwachte Output:**
- Tabellen `onb_steps`, `onb_progress`, `onb_tips` aangemaakt
- 7 standaard onboarding stappen geladen
- Tips uit `docs/onboarding_tips.json` geladen

### 3.2. Backend API Verificatie

**Prioriteit: HOOG**

```bash
# Test alle endpoints met seed user
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=rentguy@demo.local&password=rentguy"

# Gebruik JWT token voor verdere tests
TOKEN="<jwt_token_from_login>"

# Test onboarding endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/onboarding/steps
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/onboarding/progress?user_email=rentguy@demo.local"
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/onboarding/tips?module=projects"
```

**Verwachte Responses:**
- `/steps` - Array met 7 onboarding stappen
- `/progress` - Lege array (nieuwe gebruiker)
- `/tips` - Tips voor specifieke module

### 3.3. Frontend Integratie

**Prioriteit: HOOG**

```bash
# 1. Installeer dependencies
cd apps/web
npm install

# 2. Controleer component imports
grep -r "OnboardingOverlay\|TipBanner" src/

# 3. Verificeer API integratie
grep -r "onbApi" src/
```

**Te Controleren:**
- `App.jsx` mount OnboardingOverlay bij eerste login
- `Planner.jsx` toont TipBanner voor projects module
- Alle API calls gebruiken correcte endpoints

### 3.4. E-mail Configuratie

**Prioriteit: MEDIUM**

```bash
# Configureer SMTP in .env
echo "SMTP_HOST=smtp.gmail.com" >> .env
echo "SMTP_PORT=587" >> .env
echo "SMTP_USER=your-email@gmail.com" >> .env
echo "SMTP_PASSWORD=your-app-password" >> .env
```

**Test E-mail:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/onboarding/send-welcome?to_email=test@example.com"
```

## 4. User Acceptance Testing (UAT)

### 4.1. Test Scenario's

**Scenario 1: Eerste Login**
1. Login als `rentguy@demo.local` / `rentguy`
2. Controleer: OnboardingOverlay verschijnt automatisch
3. Controleer: 7 stappen zichtbaar met 0% voortgang
4. Controleer: "Sluiten" knop werkt

**Scenario 2: Stap Voltooien**
1. Klik "Markeer gereed" bij "welcome" stap
2. Controleer: Database update in `onb_progress`
3. Controleer: Voortgangsbalk toont ~14% (1/7)
4. Controleer: Stap toont "✅ Gereed"

**Scenario 3: Contextuele Tips**
1. Navigeer naar Planner module
2. Controleer: TipBanner verschijnt bovenaan
3. Controleer: Tip tekst: "Sleep projecten in de kalender..."
4. Controleer: CTA knop "Open Planner" zichtbaar

**Scenario 4: E-mail Functionaliteit**
1. Trigger welkomstmail via API
2. Controleer: E-mail ontvangen met juiste inhoud
3. Test booking-mail vanuit crew module
4. Controleer: ICS bijlage aanwezig

### 4.2. Validatie Criteria

| Component | Criterium | Status |
|-----------|-----------|---------|
| Database | Migratie succesvol, seed data geladen | ⏳ |
| Backend API | Alle endpoints 200 response | ⏳ |
| Frontend | Overlay en tips tonen correct | ⏳ |
| E-mail | Welkomstmail verzonden en ontvangen | ⏳ |
| Integratie | Volledige flow werkt end-to-end | ⏳ |

## 5. Deployment Checklist

### 5.1. Pre-Deployment

- [ ] Database backup gemaakt
- [ ] Migratie getest op staging
- [ ] Frontend build succesvol
- [ ] SMTP configuratie gevalideerd
- [ ] Health checks gedefinieerd

### 5.2. Deployment Steps

```bash
# 1. Stop applicatie
docker-compose down

# 2. Pull nieuwe code
git pull origin main

# 3. Run migraties
docker-compose run backend alembic upgrade head

# 4. Build en start services
docker-compose up --build -d

# 5. Verificeer health
curl http://localhost:8000/health
curl http://localhost:3000
```

### 5.3. Post-Deployment

- [ ] Health checks groen
- [ ] Database tabellen aanwezig
- [ ] Seed data geladen
- [ ] Frontend toegankelijk
- [ ] API endpoints functioneel
- [ ] E-mail configuratie werkend

## 6. Rollback Plan

**Bij problemen:**

```bash
# 1. Stop nieuwe versie
docker-compose down

# 2. Restore database backup
pg_restore -d rentguy backup_pre_onboarding.sql

# 3. Checkout vorige versie
git checkout <previous_commit>

# 4. Start oude versie
docker-compose up -d
```

## 7. Monitoring & Logging

**Te monitoren:**
- API response times onboarding endpoints
- Database query performance
- Frontend JavaScript errors
- E-mail delivery success rate
- User onboarding completion rates

**Log locaties:**
- Backend: `logs/fastapi.log`
- Database: PostgreSQL logs
- Frontend: Browser console
- E-mail: SMTP server logs

## 8. Documentatie Updates

**Na succesvolle deployment:**

1. Update `README.md` met onboarding sectie
2. Documenteer API endpoints in `docs/api.md`
3. Maak `docs/UAT/fase-onboarding.md` met testcases
4. Update gebruikershandleiding voor Bart (Mr. DJ)

## 9. Success Criteria

**Deployment is succesvol wanneer:**
- Alle UAT scenario's slagen
- Demo account `rentguy@demo.local` kan volledige onboarding doorlopen
- Welkomstmail wordt verzonden en ontvangen
- Contextuele tips verschijnen in relevante modules
- Voortgangsbalk toont correcte percentages
- Geen regressies in bestaande functionaliteit

**Eindresultaat:** Een volledig werkende onboarding flow die nieuwe gebruikers begeleidt door de RentGuy applicatie met interactieve stappen, contextuele tips en e-mail notificaties.

## 10. Technische Implementatie Details

### 10.1. Frontend Integratie Status

**Huidige Implementatie (Geanalyseerd):**

**App.jsx:**
```javascript
// Onboarding overlay wordt getoond als 'onb_seen' niet in localStorage staat
{(!localStorage.getItem('onb_seen')) && 
  <OnboardingOverlay 
    email={'rentguy@demo.local'} 
    onClose={()=>{localStorage.setItem('onb_seen','1'); location.reload()}} 
  />
}
```

**Planner.jsx:**
```javascript
// TipBanner wordt getoond voor 'projects' module
<TipBanner module={'projects'} />
```

**Dependencies (package.json):**
- React 18.3.1 met Vite build system
- FullCalendar voor kalender functionaliteit
- Axios voor API communicatie

### 10.2. Backend API Endpoints Status

**Beschikbare Endpoints:**
- `GET /api/v1/onboarding/steps` - Haalt onboarding stappen op
- `GET /api/v1/onboarding/progress?user_email=` - Haalt gebruiker voortgang op
- `POST /api/v1/onboarding/complete` - Markeert stap als voltooid
- `GET /api/v1/onboarding/tips?module=` - Haalt contextuele tips op
- `POST /api/v1/onboarding/send-welcome?to_email=` - Verstuurt welkomstmail

**Authenticatie:** Alle endpoints vereisen Bearer token behalve send-welcome (admin/planner rol)

### 10.3. Database Seed Data

**Standaard Onboarding Stappen:**
1. `welcome` - "Welkom bij Rentguy"
2. `project` - "Maak je eerste project"
3. `crew` - "Voeg je eerste crewlid toe"
4. `booking` - "Maak een crewbooking"
5. `scan` - "Scan een item"
6. `transport` - "Genereer een transportbrief"
7. `invoice` - "Maak een factuur"

**Contextuele Tips (onboarding_tips.json):**
- **projects:** "Sleep projecten in de kalender om snel te herplannen."
- **inventory:** "Maak een bundel (DJ-set) zodat accessories automatisch meeliften."
- **warehouse:** "Scan een item met de PWA om uitgifte te boeken."
- **billing:** "Maak een factuur vanuit je projectregels en exporteer CSV."

### 10.4. Kritieke Configuratie

**Environment Variables (.env):**
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_DB=rentguy
POSTGRES_USER=rentguy
POSTGRES_PASSWORD=<secure_password>

# JWT
JWT_SECRET=<secure_jwt_secret>

# SMTP (voor welkomstmails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app_password>
```

**Docker Compose Profiles:**
- `core` - Basis services (database, backend)
- `web` - Frontend applicaties
- `monitoring` - Optioneel voor logging/metrics

### 10.5. Potentiële Issues & Oplossingen

**Issue 1: E-mail Configuratie**
- **Probleem:** SMTP credentials niet geconfigureerd
- **Oplossing:** Configureer Gmail App Password of gebruik alternatieve SMTP provider
- **Test:** `curl -X POST "http://localhost:8000/api/v1/onboarding/send-welcome?to_email=test@example.com"`

**Issue 2: Frontend Build Errors**
- **Probleem:** FullCalendar dependencies ontbreken
- **Oplossing:** `npm install` in `apps/web` directory
- **Test:** `npm run build` moet succesvol zijn

**Issue 3: Database Migratie Conflicts**
- **Probleem:** Bestaande data conflicteert met nieuwe schema
- **Oplossing:** Backup database voor migratie, test op staging eerst
- **Test:** `alembic upgrade head` moet zonder errors draaien

**Issue 4: API Authenticatie**
- **Probleem:** JWT token expiry of invalid credentials
- **Oplossing:** Controleer JWT_SECRET configuratie en token validity
- **Test:** Login flow moet werkende token genereren

### 10.6. Performance Overwegingen

**Database Indexing:**
- `onb_progress.user_email` - geïndexeerd voor snelle lookups
- `onb_steps.code` - unique index voor stap identificatie
- `onb_tips.module` - index voor module-specifieke tips

**Frontend Optimalisatie:**
- OnboardingOverlay laadt alleen bij eerste login
- TipBanner cached tips per module
- API calls gebruiken axios interceptors voor error handling

**Caching Strategie:**
- Onboarding stappen zijn statisch, kunnen gecached worden
- User progress wordt real-time bijgewerkt
- Tips kunnen per sessie gecached worden

## 11. Go-Live Checklist

### 11.1. Pre-Go-Live (T-1 dag)

- [ ] **Database Backup:** Volledige backup van productie database
- [ ] **Staging Test:** Volledige UAT op staging environment
- [ ] **Dependencies:** Alle npm packages geïnstalleerd en getest
- [ ] **Environment:** Alle environment variables geconfigureerd
- [ ] **SMTP:** E-mail configuratie getest met test account
- [ ] **Monitoring:** Health check endpoints gedefinieerd
- [ ] **Rollback:** Rollback procedure gedocumenteerd en getest

### 11.2. Go-Live (T-0)

**Maintenance Window: 30 minuten**

```bash
# 1. Activeer maintenance mode
echo "Maintenance in progress..." > /var/www/html/maintenance.html

# 2. Stop applicatie services
docker-compose down

# 3. Database migratie
docker-compose run backend alembic upgrade head

# 4. Deploy nieuwe versie
git pull origin main
docker-compose up --build -d

# 5. Verificatie
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/onboarding/steps

# 6. Deactiveer maintenance mode
rm /var/www/html/maintenance.html
```

### 11.3. Post-Go-Live (T+1 uur)

- [ ] **Health Checks:** Alle services groen
- [ ] **Database:** Seed data correct geladen
- [ ] **Frontend:** Onboarding overlay functioneel
- [ ] **API:** Alle endpoints responderen correct
- [ ] **E-mail:** Welkomstmail test succesvol
- [ ] **User Test:** Demo account kan volledige flow doorlopen
- [ ] **Monitoring:** Geen errors in logs
- [ ] **Performance:** Response times binnen acceptabele grenzen

### 11.4. Success Metrics

**Technische Metrics:**
- API response time < 500ms voor onboarding endpoints
- Frontend load time < 2 seconden
- Database query performance < 100ms
- E-mail delivery success rate > 95%

**Business Metrics:**
- Onboarding completion rate > 80%
- User engagement met tips > 60%
- Support tickets gerelateerd aan onboarding < 5%

**Eindresultaat:** Een volledig geïntegreerde onboarding ervaring die nieuwe gebruikers effectief begeleidt door de RentGuy applicatie, met meetbare verbetering in user adoption en engagement.
