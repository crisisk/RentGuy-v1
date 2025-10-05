# RentGuy Application - Comprehensive Go-Live Plan

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** 2025-09-30  
**Target Release:** RentGuy v0.1 with Onboarding Module  

---

## Executive Summary

This document outlines the comprehensive go-live plan for the RentGuy application, focusing on the deployment of the interactive onboarding functionality. The plan ensures a safe, controlled, and reversible deployment process with minimal downtime and maximum reliability.

**Key Objectives:**
- Deploy RentGuy application with onboarding module to production VPS
- Ensure zero data loss and minimal downtime (< 30 minutes)
- Implement comprehensive testing and validation procedures
- Establish monitoring and rollback capabilities
- Enable seamless user onboarding experience for Bart (Mr. DJ) and future users

---

## 1. Pre-Deployment Phase (T-7 to T-1 Days)

### 1.1. Infrastructure Readiness Assessment

**VPS Environment Verification:**
```bash
# System Resources Check
df -h                    # Disk space (minimum 10GB free)
free -h                  # Memory (minimum 4GB available)
docker --version         # Docker 20.10+ required
docker-compose --version # Docker Compose 2.0+ required
```

**Network and Security:**
```bash
# Port Availability Check
netstat -tlnp | grep -E ':(8000|3000|5432)'  # Ensure ports are available
ufw status                                    # Firewall configuration
systemctl status nginx                        # NGINX status
```

**Database Preparation:**
```bash
# PostgreSQL Health Check
sudo -u postgres psql -c "SELECT version();"
sudo -u postgres createdb rentguy_backup_$(date +%Y%m%d)
```

### 1.2. Code Repository Preparation

**Branch Strategy:**
- `main` branch contains stable production code
- `feature/onboarding` branch contains new onboarding functionality
- Create `release/v0.1-onboarding` branch for deployment

**Pre-deployment Code Review:**
```bash
# Clone and prepare repository
git clone <repository-url> /opt/rentguy
cd /opt/rentguy
git checkout release/v0.1-onboarding

# Verify all required files are present
ls -la backend/alembic/versions/0007_onboarding.py
ls -la backend/app/modules/onboarding/
ls -la apps/web/src/OnboardingOverlay.jsx
ls -la apps/web/src/TipBanner.jsx
ls -la docs/onboarding_tips.json
```

### 1.3. Environment Configuration

**Environment Variables Setup:**
```bash
# Create production environment file
cat > /opt/rentguy/.env << EOF
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_DB=rentguy
POSTGRES_USER=rentguy
POSTGRES_PASSWORD=${SECURE_DB_PASSWORD}

# Application Configuration
JWT_SECRET=${SECURE_JWT_SECRET}
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=production

# SMTP Configuration for Welcome Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_EMAIL}
SMTP_PASSWORD=${SMTP_APP_PASSWORD}
SMTP_FROM_EMAIL=${SMTP_EMAIL}

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/rentguy/app.log
EOF
```

**Docker Compose Configuration:**
```yaml
# /opt/rentguy/docker-compose.prod.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: rentguy
      POSTGRES_USER: rentguy
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://rentguy:${POSTGRES_PASSWORD}@db:5432/rentguy
    volumes:
      - ./logs:/app/logs
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build: ./apps/web
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

---

## 2. Deployment Execution Phase (T-Day)

### 2.1. Pre-Deployment Checklist (T-2 Hours)

**System Backup:**
```bash
# Create comprehensive backup
mkdir -p /opt/backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"

# Database backup
sudo -u postgres pg_dump rentguy > $BACKUP_DIR/rentguy_pre_deployment.sql

# Application backup (if existing)
if [ -d "/opt/rentguy_current" ]; then
    tar -czf $BACKUP_DIR/rentguy_app_backup.tar.gz /opt/rentguy_current
fi

# Configuration backup
cp -r /etc/nginx/sites-available $BACKUP_DIR/nginx_config
```

**Maintenance Mode Activation:**
```bash
# Create maintenance page
cat > /var/www/html/maintenance.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>RentGuy - Maintenance</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Onderhoud in uitvoering</h1>
        <p>RentGuy wordt momenteel bijgewerkt met nieuwe functionaliteiten.</p>
        <p>We zijn over ongeveer 30 minuten weer online.</p>
        <p>Bedankt voor je geduld!</p>
    </div>
</body>
</html>
EOF

# Configure NGINX to serve maintenance page
sudo nginx -s reload
```

### 2.2. Deployment Execution (T-0)

**Step 1: Stop Current Services**
```bash
# Stop existing services gracefully
cd /opt/rentguy_current 2>/dev/null || echo "No existing deployment"
docker-compose down --timeout 30 2>/dev/null || echo "No containers to stop"
```

**Step 2: Deploy New Version**
```bash
# Move new code to production location
mv /opt/rentguy /opt/rentguy_new
ln -sfn /opt/rentguy_new /opt/rentguy_current
cd /opt/rentguy_current

# Build and start services
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

**Step 3: Database Migration**
```bash
# Wait for database to be ready
sleep 30

# Run Alembic migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Verify migration success
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.modules.onboarding.repo import OnboardingRepo
from app.core.db import get_db
from sqlalchemy.orm import Session

db = next(get_db())
repo = OnboardingRepo(db)
repo.ensure_seed()
db.commit()
print('Seed data loaded successfully')
"
```

**Step 4: Load Onboarding Tips**
```bash
# Load tips from JSON file
docker-compose -f docker-compose.prod.yml exec backend python -c "
import json
from app.modules.onboarding.models import Tip
from app.core.db import get_db

db = next(get_db())
with open('/app/docs/onboarding_tips.json', 'r') as f:
    tips_data = json.load(f)

for tip_data in tips_data:
    existing = db.query(Tip).filter_by(module=tip_data['module']).first()
    if not existing:
        tip = Tip(**tip_data)
        db.add(tip)

db.commit()
print('Tips loaded successfully')
"
```

### 2.3. Health Checks and Validation

**System Health Verification:**
```bash
# Wait for services to stabilize
sleep 60

# Check container health
docker-compose -f docker-compose.prod.yml ps

# Verify database connectivity
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.core.db import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM onb_steps'))
    print(f'Onboarding steps count: {result.scalar()}')
"

# Test API endpoints
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:3000 || exit 1
```

**Functional Testing:**
```bash
# Test authentication
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=rentguy@demo.local&password=rentguy" | jq -r '.access_token')

# Test onboarding endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/onboarding/steps
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/onboarding/progress?user_email=rentguy@demo.local"
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/onboarding/tips?module=projects"
```

---

## 3. Post-Deployment Phase (T+1 to T+24 Hours)

### 3.1. User Acceptance Testing

**Test Scenario 1: First Login Experience**
```bash
# Test steps:
# 1. Navigate to http://your-domain.com
# 2. Login with rentguy@demo.local / rentguy
# 3. Verify OnboardingOverlay appears
# 4. Check 7 steps are visible with 0% progress
# 5. Verify "Sluiten" button functionality
```

**Test Scenario 2: Onboarding Step Completion**
```bash
# Test API call for step completion
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_email":"rentguy@demo.local","step_code":"welcome"}' \
  http://localhost:8000/api/v1/onboarding/complete

# Verify progress update
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/onboarding/progress?user_email=rentguy@demo.local"
```

**Test Scenario 3: Contextual Tips**
```bash
# Navigate to Planner module
# Verify TipBanner appears with projects tip
# Check tip content: "Sleep projecten in de kalender om snel te herplannen."
# Verify "Open Planner" CTA button
```

**Test Scenario 4: Email Functionality**
```bash
# Test welcome email
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/onboarding/send-welcome?to_email=test@example.com"

# Check email delivery in logs
docker-compose -f docker-compose.prod.yml logs backend | grep -i "email\|smtp"
```

### 3.2. Performance Monitoring

**Key Performance Indicators:**
```bash
# API Response Times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/onboarding/steps

# Database Query Performance
docker-compose -f docker-compose.prod.yml exec backend python -c "
import time
from app.modules.onboarding.repo import OnboardingRepo
from app.core.db import get_db

db = next(get_db())
repo = OnboardingRepo(db)

start = time.time()
steps = repo.list_steps()
end = time.time()
print(f'Steps query time: {(end-start)*1000:.2f}ms')

start = time.time()
progress = repo.progress_for('rentguy@demo.local')
end = time.time()
print(f'Progress query time: {(end-start)*1000:.2f}ms')
"

# Memory and CPU Usage
docker stats --no-stream
```

**Monitoring Setup:**
```bash
# Create monitoring script
cat > /opt/rentguy/monitoring/health_check.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/rentguy/health_check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check API health
if curl -f -s http://localhost:8000/health > /dev/null; then
    echo "$DATE - API: OK" >> $LOG_FILE
else
    echo "$DATE - API: FAILED" >> $LOG_FILE
    # Send alert (implement notification system)
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "$DATE - Frontend: OK" >> $LOG_FILE
else
    echo "$DATE - Frontend: FAILED" >> $LOG_FILE
fi

# Check database
if docker-compose -f /opt/rentguy_current/docker-compose.prod.yml exec -T db pg_isready > /dev/null; then
    echo "$DATE - Database: OK" >> $LOG_FILE
else
    echo "$DATE - Database: FAILED" >> $LOG_FILE
fi
EOF

chmod +x /opt/rentguy/monitoring/health_check.sh

# Setup cron job for monitoring
echo "*/5 * * * * /opt/rentguy/monitoring/health_check.sh" | crontab -
```

---

## 4. Rollback Procedures

### 4.1. Emergency Rollback (< 5 Minutes)

**Immediate Rollback Triggers:**
- API health checks failing for > 2 minutes
- Database connectivity issues
- Frontend not loading
- Critical errors in application logs

**Rollback Execution:**
```bash
#!/bin/bash
# Emergency rollback script
echo "EMERGENCY ROLLBACK INITIATED at $(date)"

# Stop current deployment
cd /opt/rentguy_current
docker-compose -f docker-compose.prod.yml down --timeout 10

# Restore database
LATEST_BACKUP=$(ls -t /opt/backups/*/rentguy_pre_deployment.sql | head -1)
sudo -u postgres dropdb rentguy
sudo -u postgres createdb rentguy
sudo -u postgres psql rentguy < $LATEST_BACKUP

# Restore previous application version
if [ -d "/opt/rentguy_previous" ]; then
    rm -f /opt/rentguy_current
    ln -s /opt/rentguy_previous /opt/rentguy_current
    cd /opt/rentguy_current
    docker-compose up -d
fi

# Verify rollback success
sleep 30
curl -f http://localhost:8000/health && echo "Rollback successful" || echo "Rollback failed"
```

### 4.2. Planned Rollback (30 Minutes)

**Rollback Decision Criteria:**
- User acceptance testing failures
- Performance degradation > 50%
- Data integrity issues
- Business stakeholder rejection

**Planned Rollback Steps:**
1. Communicate rollback decision to stakeholders
2. Activate maintenance mode
3. Export any new data created during deployment
4. Execute database rollback
5. Restore previous application version
6. Validate system functionality
7. Deactivate maintenance mode
8. Post-rollback analysis and reporting

---

## 5. Success Criteria and Validation

### 5.1. Technical Success Criteria

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| API Response Time | < 500ms | Load testing with curl |
| Frontend Load Time | < 2 seconds | Browser dev tools |
| Database Query Performance | < 100ms | Application logs |
| System Uptime | > 99.5% | Monitoring dashboard |
| Error Rate | < 0.1% | Application logs |

### 5.2. Functional Success Criteria

| Feature | Validation | Status |
|---------|------------|--------|
| User Authentication | Login with demo account successful | ⏳ |
| Onboarding Overlay | Displays on first login | ⏳ |
| Step Completion | Progress tracking works | ⏳ |
| Contextual Tips | Tips show in relevant modules | ⏳ |
| Email Functionality | Welcome emails sent successfully | ⏳ |
| Data Persistence | User progress saved correctly | ⏳ |

### 5.3. Business Success Criteria

| Objective | Measurement | Target |
|-----------|-------------|--------|
| User Onboarding Completion | % of users completing all steps | > 80% |
| Time to First Value | Minutes from login to first action | < 5 minutes |
| Support Ticket Reduction | Onboarding-related tickets | < 5 per week |
| User Satisfaction | Feedback score | > 4.0/5.0 |

---

## 6. Communication Plan

### 6.1. Stakeholder Communication

**Pre-Deployment (T-24 Hours):**
- Email to all stakeholders with deployment timeline
- Slack/Teams notification with maintenance window
- Update status page with planned maintenance

**During Deployment:**
- Real-time updates in dedicated Slack channel
- Status page updates every 15 minutes
- Immediate notification of any issues

**Post-Deployment:**
- Success confirmation to all stakeholders
- Performance metrics summary
- User guide distribution for new onboarding features

### 6.2. User Communication

**Maintenance Notification:**
```html
<!-- Email template for users -->
Subject: RentGuy Upgrade - New Onboarding Experience

Beste RentGuy gebruiker,

We upgraden RentGuy met een nieuwe onboarding ervaring die je helpt om sneller wegwijs te worden in de applicatie.

Geplande onderbreking:
- Datum: [DATE]
- Tijd: [TIME] - [TIME] (ongeveer 30 minuten)
- Impact: Tijdelijk geen toegang tot RentGuy

Nieuwe functionaliteiten na de upgrade:
✨ Interactieve onboarding met stap-voor-stap begeleiding
💡 Contextuele tips in elke module
📧 Welkomstmails voor nieuwe gebruikers
📊 Voortgangsregistratie

Bedankt voor je geduld!
Het RentGuy Team
```

---

## 7. Documentation and Knowledge Transfer

### 7.1. Technical Documentation Updates

**Files to Update:**
- `README.md` - Add onboarding section
- `docs/api.md` - Document new onboarding endpoints
- `docs/deployment.md` - Update deployment procedures
- `docs/troubleshooting.md` - Add onboarding-specific issues

**API Documentation:**
```markdown
## Onboarding API Endpoints

### GET /api/v1/onboarding/steps
Returns list of all onboarding steps.

### GET /api/v1/onboarding/progress?user_email={email}
Returns user's onboarding progress.

### POST /api/v1/onboarding/complete
Marks an onboarding step as complete.
Body: {"user_email": "string", "step_code": "string"}

### GET /api/v1/onboarding/tips?module={module}
Returns contextual tips for specified module.

### POST /api/v1/onboarding/send-welcome?to_email={email}
Sends welcome email to specified address.
```

### 7.2. User Documentation

**Onboarding Guide for Bart (Mr. DJ):**
```markdown
# RentGuy Onboarding Guide

## Eerste Login
1. Ga naar [your-domain.com]
2. Log in met je credentials
3. Een welkomstscherm verschijnt automatisch
4. Volg de 7 stappen voor een complete tour

## Onboarding Stappen
1. **Welkom** - Kennismaking met RentGuy
2. **Project** - Maak je eerste project aan
3. **Crew** - Voeg crewleden toe
4. **Booking** - Plan je eerste crew booking
5. **Scan** - Gebruik de PWA scanner
6. **Transport** - Genereer transportbrieven
7. **Factuur** - Maak je eerste factuur

## Tips & Tricks
- Kijk uit naar blauwe tip-banners in elke module
- Klik op "Markeer gereed" wanneer je een stap hebt voltooid
- Je voortgang wordt automatisch opgeslagen
- Sluit het onboarding scherm en open het later opnieuw via je profiel
```

---

## 8. Risk Assessment and Mitigation

### 8.1. High-Risk Scenarios

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration failure | Medium | High | Pre-test on staging, backup strategy |
| Frontend build failure | Low | Medium | Pre-build verification, rollback plan |
| SMTP configuration issues | Medium | Low | Test email setup, fallback provider |
| Performance degradation | Low | High | Load testing, monitoring alerts |
| User data loss | Very Low | Critical | Multiple backups, transaction safety |

### 8.2. Contingency Plans

**Database Migration Failure:**
```bash
# Rollback migration
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade -1

# Restore from backup
sudo -u postgres dropdb rentguy
sudo -u postgres createdb rentguy
sudo -u postgres psql rentguy < /opt/backups/latest/rentguy_pre_deployment.sql
```

**Frontend Issues:**
```bash
# Serve static fallback page
cp /opt/rentguy/fallback/index.html /var/www/html/
nginx -s reload
```

**Email Service Failure:**
```bash
# Switch to alternative SMTP provider
docker-compose -f docker-compose.prod.yml exec backend python -c "
import os
os.environ['SMTP_HOST'] = 'alternative-smtp.com'
os.environ['SMTP_PORT'] = '587'
# Restart backend service
"
```

---

## 9. Post-Go-Live Activities

### 9.1. Week 1 Activities

**Daily Monitoring:**
- Check health metrics and performance
- Review application logs for errors
- Monitor user onboarding completion rates
- Collect user feedback

**User Support:**
- Dedicated support channel for onboarding questions
- Quick response team for critical issues
- Documentation of common questions for FAQ

### 9.2. Month 1 Activities

**Performance Analysis:**
- Comprehensive performance review
- User behavior analytics
- Onboarding completion funnel analysis
- Technical debt assessment

**Optimization Planning:**
- Identify bottlenecks and improvement opportunities
- Plan next iteration of onboarding features
- Prepare for scaling based on usage patterns

---

## 10. Conclusion

This comprehensive go-live plan ensures a safe, controlled, and successful deployment of the RentGuy application with onboarding functionality. The plan emphasizes safety through extensive testing, monitoring, and rollback procedures while maintaining focus on user experience and business objectives.

**Key Success Factors:**
- Thorough pre-deployment testing and validation
- Comprehensive backup and rollback strategies
- Real-time monitoring and alerting
- Clear communication with all stakeholders
- Detailed documentation and knowledge transfer

**Next Steps:**
1. Review and approve this go-live plan
2. Schedule deployment window with stakeholders
3. Execute pre-deployment checklist
4. Perform deployment following this plan
5. Monitor and optimize post-deployment

The RentGuy application is ready for production deployment with confidence in its stability, functionality, and user experience.
