# RentGuy - Volgende Configuratiestappen

## 📊 Huidige Status
✅ **Productie deployment succesvol**
- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- Database: PostgreSQL 15 + PostGIS (44+ tables)
- Redis Cache: Operationeel
- 13 Database migrations uitgevoerd

## 🔧 Verplichte Configuratiestappen

### 1. Admin Gebruiker Aanmaken
**Prioriteit: HOOG - Direct nodig**

De productie database is leeg. Je moet een admin gebruiker aanmaken:

```bash
# Optie A: Via backend container (Python script)
docker exec -it rentguy-backend-prod python -c "
from app.core.db import SessionLocal
from app.modules.auth.models import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

admin = User(
    email='admin@rentguy.nl',
    username='admin',
    hashed_password=pwd_context.hash('Admin123!'),
    is_superuser=True,
    is_active=True,
    role='admin',
    tenant_id=1
)

db.add(admin)
db.commit()
print(f'✓ Admin user created: {admin.email}')
db.close()
"

# Optie B: Maak een create_admin.py script
cat > create_admin.py << 'SCRIPT'
import sys
from app.core.db import SessionLocal
from app.modules.auth.models import User
from passlib.context import CryptContext

email = input("Admin email: ")
password = input("Admin password: ")

db = SessionLocal()
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

admin = User(
    email=email,
    username=email.split('@')[0],
    hashed_password=pwd_context.hash(password),
    is_superuser=True,
    is_active=True,
    role='admin',
    tenant_id=1
)

db.add(admin)
db.commit()
print(f'✓ Admin user created: {admin.email}')
db.close()
SCRIPT

docker cp create_admin.py rentguy-backend-prod:/app/
docker exec -it rentguy-backend-prod python /app/create_admin.py
```

**Login gegevens:**
- Email: admin@rentguy.nl
- Password: Admin123! (wijzig direct na eerste login!)
- URL: http://localhost:8080/login

### 2. Email Configuratie (SMTP)
**Prioriteit: MEDIUM - Voor notificaties**

Update `.env.production` met echte SMTP settings:

```bash
# Voor Gmail (app-specific password nodig):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jouw.email@gmail.com
SMTP_PASSWORD=app_specific_password
EMAIL_FROM=noreply@rentguy.nl

# Voor SendGrid:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@rentguy.nl

# Restart backend om changes te activeren
docker-compose -f docker-compose.production-standalone.yml restart rentguy-backend
```

### 3. Domain & SSL Certificaten
**Prioriteit: MEDIUM - Voor externe toegang**

**Optie A: Traefik gebruiken (aanbevolen)**
Je hebt al Traefik draaien op port 80/443. Voeg RentGuy toe aan Traefik:

```yaml
# Voeg toe aan docker-compose.production-standalone.yml
services:
  rentguy-frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rentguy.rule=Host(`rentguy.sevensa.nl`)"
      - "traefik.http.routers.rentguy.entrypoints=websecure"
      - "traefik.http.routers.rentguy.tls.certresolver=letsencrypt"
      - "traefik.http.services.rentguy.loadbalancer.server.port=80"
    networks:
      - web  # Traefik network
      - rentguy-production

networks:
  web:
    external: true
```

**Optie B: Standalone met eigen SSL**
Gebruik certbot voor Let's Encrypt certificaten:

```bash
# Installeer certbot
sudo apt-get update && sudo apt-get install certbot

# Genereer certificaat
sudo certbot certonly --standalone -d rentguy.sevensa.nl

# Certificaten komen in: /etc/letsencrypt/live/rentguy.sevensa.nl/
```

### 4. Backup Verificatie
**Prioriteit: HOOG - Voor data veiligheid**

```bash
# Check of backup service draait
docker logs rentguy-backup-prod

# Handmatige backup test
docker exec rentguy-backup-prod /backup.sh

# Check backup files
ls -lh /var/lib/docker/volumes/rentguy-analysis_rentguy-db-data/_data/

# Backup locatie aanpassen (optioneel)
# Edit docker-compose.production-standalone.yml:
# volumes:
#   - /root/backups/rentguy:/backups
```

### 5. Monitoring Setup
**Prioriteit: MEDIUM - Voor productie oversight**

```bash
# Check health endpoints
curl http://localhost:8000/healthz
curl http://localhost:8080/

# Check logs
docker-compose -f docker-compose.production-standalone.yml logs -f rentguy-backend

# Setup log rotation (optioneel)
cat > /etc/logrotate.d/rentguy << 'LOGROTATE'
/var/log/rentguy/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 root root
}
LOGROTATE
```

### 6. Firewall Configuratie
**Prioriteit: HOOG - Voor security**

```bash
# Check huidige firewall
sudo ufw status

# Open alleen noodzakelijke ports
sudo ufw allow 8080/tcp comment 'RentGuy Frontend'
sudo ufw allow 8000/tcp comment 'RentGuy Backend API'

# OF als je Traefik gebruikt, zijn ports al open
# Check met:
sudo netstat -tlnp | grep -E ':(80|443|8080|8000)'
```

### 7. Environment Variabelen Aanpassen
**Prioriteit: MEDIUM - Voor productie setup**

Edit `/tmp/rentguy-analysis/.env.production`:

```bash
# Update domain
DOMAIN=rentguy.sevensa.nl  # of jouw eigen domain

# Update customer portal URL
CUSTOMER_PORTAL_BASE_URL=https://rentguy.sevensa.nl/portal

# Update frontend API URL
# In docker-compose.production-standalone.yml onder rentguy-frontend:
environment:
  - VITE_API_URL=https://rentguy.sevensa.nl/api  # of http://localhost:8000

# Als je Mollie/payment provider gebruikt:
BOOKING_PAYMENT_PROVIDER=mollie  # ipv 'mock'
MOLLIE_API_KEY=live_xxxxxxxxxxxxx

# Enable Sentry voor error tracking (optioneel)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 📝 Aanbevolen Configuratie (Post-deployment)

### 8. Initial Data Setup
**Optioneel - Voor demo/test data**

```bash
# Maak basis categorieën en items aan via API
curl -X POST http://localhost:8000/api/inventory/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Audio Equipment", "description": "DJ and sound equipment"}'

# Of via admin interface na inloggen
```

### 9. WebSocket Configuration
**Voor real-time features**

Als je WebSockets extern wilt gebruiken:

```nginx
# In Nginx config (als je Nginx gebruikt)
location /ws/ {
    proxy_pass http://rentguy-backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 10. Database Optimalisatie
**Voor betere performance**

```bash
# Run VACUUM ANALYZE (reeds in config, maar handmatig mogelijk)
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "VACUUM ANALYZE;"

# Check database size
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
  LIMIT 10;
"
```

## 🚨 Troubleshooting

### Backend niet bereikbaar
```bash
# Check logs
docker logs rentguy-backend-prod --tail 50

# Check database connectie
docker exec rentguy-backend-prod pg_isready -h rentguy-db -U rentguy

# Restart backend
docker-compose -f docker-compose.production-standalone.yml restart rentguy-backend
```

### Frontend niet bereikbaar
```bash
# Check logs
docker logs rentguy-frontend-prod --tail 50

# Check Nginx config
docker exec rentguy-frontend-prod nginx -t

# Restart frontend
docker-compose -f docker-compose.production-standalone.yml restart rentguy-frontend
```

### Database issues
```bash
# Check database logs
docker logs rentguy-db-prod --tail 50

# Check connections
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "
  SELECT count(*) as connections FROM pg_stat_activity;
"

# Restart database (VOORZICHTIG!)
docker-compose -f docker-compose.production-standalone.yml restart rentguy-db
```

## 📚 Nuttige Commando's

```bash
# Alle services status
docker-compose -f docker-compose.production-standalone.yml ps

# Logs volgen
docker-compose -f docker-compose.production-standalone.yml logs -f

# Service herstarten
docker-compose -f docker-compose.production-standalone.yml restart <service>

# Alle services stoppen
docker-compose -f docker-compose.production-standalone.yml down

# Alle services starten
docker-compose -f docker-compose.production-standalone.yml up -d

# Database backup
docker exec rentguy-db-prod pg_dump -U rentguy rentguy_production > backup_$(date +%Y%m%d).sql

# Database restore
docker exec -i rentguy-db-prod psql -U rentguy rentguy_production < backup_20241017.sql
```

## 🎯 Prioriteiten Overzicht

| Stap | Prioriteit | Tijd | Status |
|------|-----------|------|--------|
| 1. Admin user aanmaken | 🔴 HOOG | 5 min | ⏸️ TODO |
| 2. Email SMTP configuratie | 🟡 MEDIUM | 10 min | ⏸️ TODO |
| 3. Domain & SSL setup | 🟡 MEDIUM | 30 min | ⏸️ TODO |
| 4. Backup verificatie | 🔴 HOOG | 5 min | ⏸️ TODO |
| 5. Monitoring setup | 🟡 MEDIUM | 15 min | ⏸️ TODO |
| 6. Firewall configuratie | 🔴 HOOG | 5 min | ⏸️ TODO |
| 7. Environment vars update | 🟡 MEDIUM | 10 min | ⏸️ TODO |

## 📖 Referentie Documentatie

- **Deployment Guide**: `/tmp/rentguy-analysis/DEPLOYMENT.md`
- **Deploy Script**: `/tmp/rentguy-analysis/deploy.sh`
- **Environment Template**: `/tmp/rentguy-analysis/.env.production.template`
- **Post-Deployment Improvements**: `POST_DEPLOYMENT_IMPROVEMENTS.md`
- **Go-Live Plan**: `rentguy_go_live_plan.md`

---

**Volgende Actie:** Begin met stap 1 - Admin gebruiker aanmaken!
