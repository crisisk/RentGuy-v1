# RentGuy - Production Deployment Guide

## Overview

RentGuy is een multi-tenant equipment rental management platform met support voor:
- Projectbeheer en planning
- Inventory tracking met PostGIS locatie support
- Crew management en calendar sync
- CRM en pipeline management
- Online booking en customer portal
- Recurring invoices
- Sub-renting functionaliteit

## Architectuur

### Services
- **Frontend**: React/Vite SPA met Nginx
- **Backend**: FastAPI met PostgreSQL en Redis
- **Database**: PostgreSQL 15 met PostGIS extension
- **Cache**: Redis 7 voor sessies en caching
- **Reverse Proxy**: Traefik (optioneel)
- **Auth**: Keycloak integration (optioneel)
- **Secrets**: OpenBao integration (optioneel)

### Network Architectuur
```
Internet → Traefik (Port 8721) →
  ├─ Frontend (React/Nginx)
  ├─ Backend API (FastAPI:8000)
  └─ Internal Network
      ├─ PostgreSQL:5432 (with PostGIS)
      └─ Redis:6379
```

---

## Pre-requisites

### System Requirements
- Ubuntu 22.04 LTS of nieuwer
- Docker 24.x of nieuwer
- Docker Compose 2.x of nieuwer
- Minimaal 4GB RAM (8GB aanbevolen)
- 50GB disk ruimte

### Netwerkpoorten
- **80**: HTTP (redirect naar HTTPS)
- **443**: HTTPS (Traefik)
- **8721**: RentGuy dedicated port (Traefik entrypoint)

---

## Deployment Opties

### Optie 1: Full Enterprise Stack (Aanbevolen voor Productie)

Met Traefik, Keycloak, en OpenBao integratie.

#### Stap 1: Secrets Setup
```bash
# Genereer sterke secrets
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET_KEY=$(openssl rand -base64 64)

# Sla secrets op in OpenBao
openbao kv put secret/rentguy/database password=$POSTGRES_PASSWORD
openbao kv put secret/rentguy/redis password=$REDIS_PASSWORD
openbao kv put secret/rentguy/jwt secret=$JWT_SECRET_KEY
```

#### Stap 2: Environment Configuratie
```bash
# Kopieer template
cp .env.production.template .env.production

# Vul de waarden in
nano .env.production

# Vereiste variabelen:
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET_KEY
# - DOMAIN (bijv. rentguy.sevensa.nl)
```

#### Stap 3: Data Directories
```bash
# Maak data directories aan
sudo mkdir -p /root/rentguy/data/{postgres,redis}
sudo mkdir -p /root/backups/rentguy

# Set permissions
sudo chown -R 999:999 /root/rentguy/data/postgres
sudo chown -R 999:999 /root/rentguy/data/redis
```

#### Stap 4: Traefik Netwerk
```bash
# Maak external Traefik netwerk (als nog niet bestaat)
docker network create web 2>/dev/null || true
```

#### Stap 5: Deploy
```bash
# Build en start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

### Optie 2: Standalone Deployment (Zonder Traefik/Keycloak)

Voor test/staging omgevingen of standalone setups.

#### Gebruik docker-compose.staging.yml
```bash
# Kopieer en pas aan
cp docker-compose.staging.yml docker-compose.standalone.yml

# Update environment variabelen
nano docker-compose.standalone.yml

# Wijzig:
# - ENV=production
# - Sterke passwords
# - Juiste domain/origins
# - SSL configuratie in Nginx

# Deploy
docker-compose -f docker-compose.standalone.yml up -d
```

---

## Database Migrations

Migrations worden automatisch uitgevoerd via de `rentguy-migrations` service.

### Manueel Migrations Runnen
```bash
# Als migrations service
docker-compose -f docker-compose.production.yml run --rm rentguy-migrations

# Of direct in backend container
docker exec rentguy-backend-prod alembic upgrade head
```

### Nieuwe Migration Maken
```bash
# Create migration
docker exec rentguy-backend-prod alembic revision --autogenerate -m "Description"

# Review migration in backend/alembic/versions/
# Test in staging first!
```

---

## SSL/TLS Configuratie

### Met Traefik (Automatisch Let's Encrypt)
Traefik regelt automatisch SSL certificaten via Let's Encrypt.

Labels in docker-compose.production.yml:
```yaml
labels:
  - "traefik.http.routers.rentguy-frontend.tls=true"
  - "traefik.http.routers.rentguy-frontend.tls.certresolver=letsencrypt"
```

### Zonder Traefik (Manuele Nginx SSL)
```bash
# Genereer self-signed cert (voor testing)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt

# Of gebruik certbot voor Let's Encrypt
sudo certbot certonly --standalone -d rentguy.example.com
```

Update `nginx/rentguy.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name rentguy.example.com;

    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;

    # ... rest van config
}
```

---

## Monitoring & Logging

### Logs Bekijken
```bash
# Alle services
docker-compose -f docker-compose.production.yml logs -f

# Specifieke service
docker-compose -f docker-compose.production.yml logs -f rentguy-backend

# Met filter
docker-compose -f docker-compose.production.yml logs -f | grep ERROR
```

### Health Checks
```bash
# Check health status
docker-compose -f docker-compose.production.yml ps

# Backend health endpoint
curl https://rentguy.sevensa.nl/api/health

# Database connectivity
docker exec rentguy-db-prod pg_isready -U rentguy
```

### Resource Monitoring
```bash
# Container stats
docker stats

# Disk usage
docker system df
du -sh /root/rentguy/data/*
```

---

## Backup & Recovery

### Automatische Backups
De `rentguy-backup` service maakt dagelijks backups:
- **Dagelijks**: 30 dagen bewaard
- **Wekelijks**: 8 weken bewaard
- **Maandelijks**: 12 maanden bewaard

Backup locatie: `/root/backups/rentguy/`

### Manuele Backup
```bash
# Database backup
docker exec rentguy-db-prod pg_dump -U rentguy rentguy_production > backup_$(date +%Y%m%d).sql

# Of via backup container
docker exec rentguy-backup /backup.sh
```

### Restore
```bash
# Stop backend
docker-compose -f docker-compose.production.yml stop rentguy-backend

# Restore database
docker exec -i rentguy-db-prod psql -U rentguy rentguy_production < backup_20241017.sql

# Start backend
docker-compose -f docker-compose.production.yml start rentguy-backend
```

---

## Maintenance

### Updates Deployen
```bash
# Pull nieuwe code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.production.yml build

# Restart services (zero-downtime met health checks)
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose -f docker-compose.production.yml run --rm rentguy-migrations
```

### Database Maintenance
```bash
# Vacuum analyze
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "VACUUM ANALYZE;"

# Check database size
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "SELECT pg_size_pretty(pg_database_size('rentguy_production'));"

# Check table sizes
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Redis Maintenance
```bash
# Check memory usage
docker exec rentguy-redis-prod redis-cli INFO memory

# Clear cache (if needed)
docker exec rentguy-redis-prod redis-cli FLUSHDB
```

---

## Troubleshooting

### Backend Niet Bereikbaar
```bash
# Check backend logs
docker-compose -f docker-compose.production.yml logs rentguy-backend

# Check health
docker exec rentguy-backend-prod curl -f http://localhost:8000/health

# Check database connectivity
docker exec rentguy-backend-prod python -c "from app.core.db import engine; print(engine.connect())"
```

### Database Connection Errors
```bash
# Check postgres is running
docker-compose -f docker-compose.production.yml ps rentguy-db

# Check postgres logs
docker-compose -f docker-compose.production.yml logs rentguy-db

# Test connection
docker exec rentguy-db-prod psql -U rentguy -d rentguy_production -c "SELECT version();"
```

### Migration Errors
```bash
# Check current migration version
docker exec rentguy-backend-prod alembic current

# Check migration history
docker exec rentguy-backend-prod alembic history

# Rollback one version
docker exec rentguy-backend-prod alembic downgrade -1

# Force stamp to specific version
docker exec rentguy-backend-prod alembic stamp <revision>
```

### Disk Space Issues
```bash
# Clean Docker system
docker system prune -a

# Clean old backups
find /root/backups/rentguy -mtime +90 -delete

# Check disk usage
df -h
du -sh /root/rentguy/data/*
```

---

## Security Checklist

- [ ] Sterke, unieke passwords voor alle services
- [ ] JWT secret is veilig gegenereerd en opgeslagen
- [ ] SSL/TLS certificaten zijn geconfigureerd
- [ ] Firewall rules zijn actief (UFW)
- [ ] Database is niet extern exposed
- [ ] Redis vereist password
- [ ] Backup encryptie is enabled
- [ ] Log rotation is geconfigureerd
- [ ] Regular security updates
- [ ] Monitoring en alerting is actief

---

## Performance Tuning

### PostgreSQL
Zie `command` sectie in docker-compose voor optimale settings:
- `shared_buffers=256MB`
- `effective_cache_size=1GB`
- `work_mem=1310kB`
- `maintenance_work_mem=64MB`

Voor grotere workloads, pas deze aan in docker-compose.yml.

### Redis
Configured met:
- `maxmemory=256mb`
- `maxmemory-policy=allkeys-lru`

### Backend
Resource limits in docker-compose:
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

---

## Support

Voor vragen of issues:
1. Check logs: `docker-compose logs -f`
2. Check health endpoints
3. Review deze documentatie
4. Check GitHub issues

---

## Versioning

Huidige versie: 1.0.0
Laatst geupdate: 2024-10-17
