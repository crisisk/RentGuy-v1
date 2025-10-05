# RentGuy Application - Technical Deployment & Rollback Procedures

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** 2025-09-30  
**Target:** Production VPS Deployment

---

## 1. Pre-Deployment Technical Setup

### 1.1. System Requirements Verification

```bash
#!/bin/bash
# System requirements check script
echo "=== RentGuy Deployment - System Check ==="

# Check available disk space (minimum 10GB)
DISK_AVAIL=$(df / | awk 'NR==2 {print $4}')
if [ $DISK_AVAIL -lt 10485760 ]; then
    echo "❌ Insufficient disk space. Available: $(($DISK_AVAIL/1024/1024))GB"
    exit 1
else
    echo "✅ Disk space: $(($DISK_AVAIL/1024/1024))GB available"
fi

# Check memory (minimum 4GB)
MEM_AVAIL=$(free -m | awk 'NR==2{print $7}')
if [ $MEM_AVAIL -lt 4096 ]; then
    echo "❌ Insufficient memory. Available: ${MEM_AVAIL}MB"
    exit 1
else
    echo "✅ Memory: ${MEM_AVAIL}MB available"
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
else
    echo "✅ Docker: $(docker --version)"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed"
    exit 1
else
    echo "✅ Docker Compose: $(docker-compose --version)"
fi

# Check port availability
PORTS=(8000 3000 5432)
for port in "${PORTS[@]}"; do
    if netstat -tlnp | grep -q ":$port "; then
        echo "⚠️  Port $port is in use"
        netstat -tlnp | grep ":$port "
    else
        echo "✅ Port $port available"
    fi
done

echo "=== System check completed ==="
```

### 1.2. Environment Preparation

```bash
#!/bin/bash
# Environment setup script

# Create application directory structure
sudo mkdir -p /opt/rentguy/{logs,backups,config,data}
sudo chown -R $USER:$USER /opt/rentguy

# Create log directory
sudo mkdir -p /var/log/rentguy
sudo chown -R $USER:$USER /var/log/rentguy

# Setup environment variables
cat > /opt/rentguy/.env << 'EOF'
# Database Configuration
POSTGRES_HOST=db
POSTGRES_DB=rentguy
POSTGRES_USER=rentguy
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# Application Configuration
JWT_SECRET=CHANGE_ME_SECURE_JWT_SECRET_MIN_32_CHARS
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=production
DEBUG=false

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_FROM_NAME=RentGuy

# Security
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CORS_ORIGINS=https://your-domain.com,http://localhost:3000

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/rentguy/app.log
EOF

echo "⚠️  IMPORTANT: Update passwords and secrets in /opt/rentguy/.env"
```

### 1.3. Database Backup Strategy

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/opt/rentguy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rentguy_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to create database backup
create_backup() {
    echo "Creating database backup..."
    
    # Check if database exists
    if docker-compose exec -T db psql -U rentguy -d rentguy -c '\q' 2>/dev/null; then
        # Create backup
        docker-compose exec -T db pg_dump -U rentguy -d rentguy > $BACKUP_FILE
        
        if [ $? -eq 0 ]; then
            echo "✅ Backup created: $BACKUP_FILE"
            
            # Compress backup
            gzip $BACKUP_FILE
            echo "✅ Backup compressed: $BACKUP_FILE.gz"
            
            # Keep only last 7 backups
            find $BACKUP_DIR -name "rentguy_backup_*.sql.gz" -mtime +7 -delete
            echo "✅ Old backups cleaned up"
        else
            echo "❌ Backup failed"
            exit 1
        fi
    else
        echo "ℹ️  No existing database found, skipping backup"
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        # Find latest backup
        backup_file=$(ls -t $BACKUP_DIR/rentguy_backup_*.sql.gz 2>/dev/null | head -1)
    fi
    
    if [ -z "$backup_file" ]; then
        echo "❌ No backup file found"
        exit 1
    fi
    
    echo "Restoring from backup: $backup_file"
    
    # Stop application
    docker-compose down
    
    # Start only database
    docker-compose up -d db
    sleep 10
    
    # Drop and recreate database
    docker-compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS rentguy;"
    docker-compose exec -T db psql -U postgres -c "CREATE DATABASE rentguy OWNER rentguy;"
    
    # Restore backup
    if [[ $backup_file == *.gz ]]; then
        gunzip -c $backup_file | docker-compose exec -T db psql -U rentguy -d rentguy
    else
        docker-compose exec -T db psql -U rentguy -d rentguy < $backup_file
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restored successfully"
    else
        echo "❌ Database restore failed"
        exit 1
    fi
}

# Export functions for use in other scripts
export -f create_backup
export -f restore_backup
```

---

## 2. Deployment Execution Procedures

### 2.1. Code Deployment Script

```bash
#!/bin/bash
# Main deployment script

set -e  # Exit on any error

DEPLOYMENT_DIR="/opt/rentguy"
REPO_URL="https://github.com/your-org/rentguy.git"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== RentGuy Deployment Started at $(date) ==="

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    log "Checking health of $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "✅ $service is healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log "❌ $service health check failed after $max_attempts attempts"
    return 1
}

# Step 1: Create backup
log "Step 1: Creating backup..."
source /opt/rentguy/scripts/backup.sh
create_backup

# Step 2: Clone/update repository
log "Step 2: Updating code..."
if [ -d "$DEPLOYMENT_DIR/src" ]; then
    cd $DEPLOYMENT_DIR/src
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    mkdir -p $DEPLOYMENT_DIR
    cd $DEPLOYMENT_DIR
    git clone -b $BRANCH $REPO_URL src
fi

# Step 3: Build Docker images
log "Step 3: Building Docker images..."
cd $DEPLOYMENT_DIR/src
docker-compose -f docker-compose.prod.yml build --no-cache

# Step 4: Stop existing services
log "Step 4: Stopping existing services..."
if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
    docker-compose -f docker-compose.prod.yml down --timeout 30
fi

# Step 5: Start database first
log "Step 5: Starting database..."
docker-compose -f docker-compose.prod.yml up -d db
sleep 20

# Step 6: Run database migrations
log "Step 6: Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# Step 7: Seed onboarding data
log "Step 7: Seeding onboarding data..."
docker-compose -f docker-compose.prod.yml run --rm backend python -c "
from app.modules.onboarding.repo import OnboardingRepo
from app.core.db import get_db
import json

# Seed onboarding steps
db = next(get_db())
repo = OnboardingRepo(db)
repo.ensure_seed()

# Load tips from JSON
try:
    with open('docs/onboarding_tips.json', 'r') as f:
        tips_data = json.load(f)
    
    from app.modules.onboarding.models import Tip
    for tip_data in tips_data:
        existing = db.query(Tip).filter_by(module=tip_data['module']).first()
        if not existing:
            tip = Tip(**tip_data)
            db.add(tip)
    
    db.commit()
    print('✅ Onboarding data seeded successfully')
except Exception as e:
    print(f'❌ Error seeding tips: {e}')
    raise
"

# Step 8: Start all services
log "Step 8: Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 9: Health checks
log "Step 9: Performing health checks..."
check_health "Backend API" "http://localhost:8000/health"
check_health "Frontend" "http://localhost:3000"

# Step 10: Functional tests
log "Step 10: Running functional tests..."
./scripts/functional_tests.sh

log "=== Deployment completed successfully at $(date) ==="
```

### 2.2. Docker Compose Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: rentguy_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - rentguy_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: rentguy_backend
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - ENVIRONMENT=production
    volumes:
      - ./logs:/app/logs
      - ./docs:/app/docs:ro
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - rentguy_network

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.prod
    container_name: rentguy_web
    environment:
      - REACT_APP_API_URL=http://localhost:8000
      - NODE_ENV=production
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - rentguy_network

  pwa-scanner:
    build:
      context: ./apps/pwa-scanner
      dockerfile: Dockerfile.prod
    container_name: rentguy_scanner
    ports:
      - "127.0.0.1:3001:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - rentguy_network

volumes:
  postgres_data:
    driver: local

networks:
  rentguy_network:
    driver: bridge
```

### 2.3. Functional Testing Script

```bash
#!/bin/bash
# Functional testing script

set -e

API_BASE="http://localhost:8000"
WEB_BASE="http://localhost:3000"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Test 1: API Health Check
log "Test 1: API Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/health)
if [ "$response" = "200" ]; then
    log "✅ API health check passed"
else
    log "❌ API health check failed (HTTP $response)"
    exit 1
fi

# Test 2: Authentication
log "Test 2: Authentication Test"
auth_response=$(curl -s -X POST $API_BASE/api/v1/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=rentguy@demo.local&password=rentguy")

if echo "$auth_response" | grep -q "access_token"; then
    TOKEN=$(echo "$auth_response" | jq -r '.access_token')
    log "✅ Authentication successful"
else
    log "❌ Authentication failed"
    log "Response: $auth_response"
    exit 1
fi

# Test 3: Onboarding Steps
log "Test 3: Onboarding Steps API"
steps_response=$(curl -s -H "Authorization: Bearer $TOKEN" $API_BASE/api/v1/onboarding/steps)
steps_count=$(echo "$steps_response" | jq '. | length')

if [ "$steps_count" -eq 7 ]; then
    log "✅ Onboarding steps loaded correctly ($steps_count steps)"
else
    log "❌ Onboarding steps count incorrect (expected 7, got $steps_count)"
    exit 1
fi

# Test 4: User Progress
log "Test 4: User Progress API"
progress_response=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/api/v1/onboarding/progress?user_email=rentguy@demo.local")

if echo "$progress_response" | jq -e '. | type == "array"' > /dev/null; then
    log "✅ User progress API working"
else
    log "❌ User progress API failed"
    exit 1
fi

# Test 5: Tips API
log "Test 5: Tips API"
tips_response=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/api/v1/onboarding/tips?module=projects")

if echo "$tips_response" | jq -e '. | type == "array"' > /dev/null; then
    log "✅ Tips API working"
else
    log "❌ Tips API failed"
    exit 1
fi

# Test 6: Step Completion
log "Test 6: Step Completion"
complete_response=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"user_email":"rentguy@demo.local","step_code":"welcome"}' \
    $API_BASE/api/v1/onboarding/complete)

if echo "$complete_response" | grep -q '"ok":true'; then
    log "✅ Step completion working"
else
    log "❌ Step completion failed"
    exit 1
fi

# Test 7: Frontend Accessibility
log "Test 7: Frontend Accessibility"
web_response=$(curl -s -o /dev/null -w "%{http_code}" $WEB_BASE)
if [ "$web_response" = "200" ]; then
    log "✅ Frontend accessible"
else
    log "❌ Frontend not accessible (HTTP $web_response)"
    exit 1
fi

# Test 8: Database Connectivity
log "Test 8: Database Connectivity"
db_test=$(docker-compose -f docker-compose.prod.yml exec -T backend python -c "
from app.core.db import engine
from sqlalchemy import text
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT COUNT(*) FROM onb_steps'))
        count = result.scalar()
        print(f'Steps in database: {count}')
        assert count == 7, f'Expected 7 steps, got {count}'
    print('✅ Database connectivity test passed')
except Exception as e:
    print(f'❌ Database test failed: {e}')
    exit(1)
")

echo "$db_test"

log "=== All functional tests passed ==="
```

---

## 3. Rollback Procedures

### 3.1. Emergency Rollback Script (< 5 Minutes)

```bash
#!/bin/bash
# Emergency rollback script - execute immediately on critical failure

set -e

DEPLOYMENT_DIR="/opt/rentguy"
BACKUP_DIR="/opt/rentguy/backups"

log() {
    echo "[EMERGENCY ROLLBACK $(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚨 EMERGENCY ROLLBACK INITIATED"

# Step 1: Stop all services immediately
log "Step 1: Stopping all services..."
cd $DEPLOYMENT_DIR/src
docker-compose -f docker-compose.prod.yml down --timeout 10

# Step 2: Find latest backup
log "Step 2: Finding latest backup..."
LATEST_BACKUP=$(ls -t $BACKUP_DIR/rentguy_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    log "❌ No backup found! Manual intervention required."
    exit 1
fi

log "Using backup: $LATEST_BACKUP"

# Step 3: Restore database
log "Step 3: Restoring database..."
docker-compose -f docker-compose.prod.yml up -d db
sleep 15

# Drop and recreate database
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS rentguy;"
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -c "CREATE DATABASE rentguy OWNER rentguy;"

# Restore from backup
gunzip -c $LATEST_BACKUP | docker-compose -f docker-compose.prod.yml exec -T db psql -U rentguy -d rentguy

if [ $? -ne 0 ]; then
    log "❌ Database restore failed!"
    exit 1
fi

log "✅ Database restored"

# Step 4: Checkout previous version
log "Step 4: Reverting to previous code version..."
cd $DEPLOYMENT_DIR/src
git checkout HEAD~1  # Go back one commit

# Step 5: Start services with previous version
log "Step 5: Starting services with previous version..."
docker-compose -f docker-compose.prod.yml up -d

# Step 6: Quick health check
log "Step 6: Verifying rollback..."
sleep 30

if curl -f -s http://localhost:8000/health > /dev/null; then
    log "✅ EMERGENCY ROLLBACK SUCCESSFUL"
    log "Services are running on previous version"
else
    log "❌ EMERGENCY ROLLBACK FAILED - Manual intervention required"
    exit 1
fi

# Step 7: Notify stakeholders
log "Step 7: Sending notifications..."
# Add notification logic here (email, Slack, etc.)

log "🚨 EMERGENCY ROLLBACK COMPLETED at $(date)"
```

### 3.2. Planned Rollback Script (30 Minutes)

```bash
#!/bin/bash
# Planned rollback script - more thorough rollback with data preservation

set -e

DEPLOYMENT_DIR="/opt/rentguy"
BACKUP_DIR="/opt/rentguy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() {
    echo "[PLANNED ROLLBACK $(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "📋 PLANNED ROLLBACK INITIATED"

# Step 1: Activate maintenance mode
log "Step 1: Activating maintenance mode..."
cat > /var/www/html/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RentGuy - Onderhoud</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Onderhoud in uitvoering</h1>
        <p>RentGuy wordt momenteel teruggezet naar een eerdere versie vanwege technische problemen.</p>
        <p>We verwachten binnen 30 minuten weer online te zijn.</p>
        <p>Bedankt voor je geduld!</p>
    </div>
</body>
</html>
EOF

# Configure NGINX to serve maintenance page
sudo nginx -s reload

# Step 2: Export current data (if needed)
log "Step 2: Exporting current data..."
cd $DEPLOYMENT_DIR/src

# Export any new onboarding progress
docker-compose -f docker-compose.prod.yml exec -T backend python -c "
import json
from app.modules.onboarding.models import UserProgress
from app.core.db import get_db

db = next(get_db())
progress = db.query(UserProgress).all()
export_data = []

for p in progress:
    export_data.append({
        'user_email': p.user_email,
        'step_code': p.step_code,
        'status': p.status,
        'completed_at': p.completed_at.isoformat() if p.completed_at else None
    })

with open('/backups/user_progress_export_$TIMESTAMP.json', 'w') as f:
    json.dump(export_data, f, indent=2)

print(f'Exported {len(export_data)} progress records')
"

# Step 3: Create current state backup
log "Step 3: Creating current state backup..."
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U rentguy -d rentguy > $BACKUP_DIR/rollback_current_state_$TIMESTAMP.sql

# Step 4: Stop services
log "Step 4: Stopping services..."
docker-compose -f docker-compose.prod.yml down --timeout 30

# Step 5: Restore from backup
log "Step 5: Restoring from backup..."
ROLLBACK_BACKUP=$1  # Backup file passed as argument

if [ -z "$ROLLBACK_BACKUP" ]; then
    # Find backup from before deployment
    ROLLBACK_BACKUP=$(ls -t $BACKUP_DIR/rentguy_backup_*.sql.gz | head -1)
fi

if [ -z "$ROLLBACK_BACKUP" ]; then
    log "❌ No rollback backup specified or found"
    exit 1
fi

log "Rolling back to: $ROLLBACK_BACKUP"

# Start database
docker-compose -f docker-compose.prod.yml up -d db
sleep 20

# Restore database
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS rentguy;"
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -c "CREATE DATABASE rentguy OWNER rentguy;"

if [[ $ROLLBACK_BACKUP == *.gz ]]; then
    gunzip -c $ROLLBACK_BACKUP | docker-compose -f docker-compose.prod.yml exec -T db psql -U rentguy -d rentguy
else
    docker-compose -f docker-compose.prod.yml exec -T db psql -U rentguy -d rentguy < $ROLLBACK_BACKUP
fi

# Step 6: Revert code
log "Step 6: Reverting code..."
ROLLBACK_COMMIT=$2  # Git commit hash passed as argument

if [ -n "$ROLLBACK_COMMIT" ]; then
    git checkout $ROLLBACK_COMMIT
else
    git checkout HEAD~1  # Default to previous commit
fi

# Step 7: Start services
log "Step 7: Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 8: Health checks
log "Step 8: Performing health checks..."
sleep 60

# Check API
if curl -f -s http://localhost:8000/health > /dev/null; then
    log "✅ API health check passed"
else
    log "❌ API health check failed"
    exit 1
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    log "✅ Frontend health check passed"
else
    log "❌ Frontend health check failed"
    exit 1
fi

# Step 9: Functional tests
log "Step 9: Running basic functional tests..."
./scripts/functional_tests.sh

# Step 10: Deactivate maintenance mode
log "Step 10: Deactivating maintenance mode..."
sudo rm -f /var/www/html/maintenance.html
sudo nginx -s reload

# Step 11: Notify stakeholders
log "Step 11: Notifying stakeholders..."
# Add notification logic here

log "✅ PLANNED ROLLBACK COMPLETED SUCCESSFULLY"
log "System restored to previous stable state"
log "Current state backup saved as: rollback_current_state_$TIMESTAMP.sql"
```

### 3.3. Rollback Validation Script

```bash
#!/bin/bash
# Rollback validation script

set -e

log() {
    echo "[ROLLBACK VALIDATION $(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🔍 Starting rollback validation..."

# Test 1: Service availability
log "Test 1: Checking service availability..."
services=("http://localhost:8000/health" "http://localhost:3000")

for service in "${services[@]}"; do
    if curl -f -s "$service" > /dev/null; then
        log "✅ $service is accessible"
    else
        log "❌ $service is not accessible"
        exit 1
    fi
done

# Test 2: Database integrity
log "Test 2: Checking database integrity..."
db_check=$(docker-compose -f docker-compose.prod.yml exec -T backend python -c "
from app.core.db import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        # Check if core tables exist
        tables = ['auth_users', 'onb_steps', 'onb_progress', 'onb_tips']
        for table in tables:
            result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
            count = result.scalar()
            print(f'{table}: {count} records')
    
    print('✅ Database integrity check passed')
except Exception as e:
    print(f'❌ Database integrity check failed: {e}')
    exit(1)
")

echo "$db_check"

# Test 3: Authentication
log "Test 3: Testing authentication..."
auth_response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=rentguy@demo.local&password=rentguy")

if echo "$auth_response" | grep -q "access_token"; then
    log "✅ Authentication is working"
else
    log "❌ Authentication failed"
    exit 1
fi

# Test 4: Core functionality
log "Test 4: Testing core functionality..."
TOKEN=$(echo "$auth_response" | jq -r '.access_token')

# Test onboarding endpoints
endpoints=(
    "/api/v1/onboarding/steps"
    "/api/v1/onboarding/progress?user_email=rentguy@demo.local"
    "/api/v1/onboarding/tips?module=projects"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000$endpoint")
    if echo "$response" | jq -e '. | type == "array"' > /dev/null; then
        log "✅ $endpoint is working"
    else
        log "❌ $endpoint failed"
        exit 1
    fi
done

# Test 5: Performance check
log "Test 5: Basic performance check..."
start_time=$(date +%s%N)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/onboarding/steps > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds

if [ $response_time -lt 1000 ]; then
    log "✅ Response time acceptable: ${response_time}ms"
else
    log "⚠️  Response time high: ${response_time}ms"
fi

log "✅ ROLLBACK VALIDATION COMPLETED SUCCESSFULLY"
log "System is stable and functional after rollback"
```

---

## 4. Monitoring and Alerting

### 4.1. Health Monitoring Script

```bash
#!/bin/bash
# Continuous health monitoring script

MONITOR_LOG="/var/log/rentguy/health_monitor.log"
ALERT_THRESHOLD=3  # Number of consecutive failures before alert

log_health() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $MONITOR_LOG
}

check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}
    
    if timeout $timeout curl -f -s "$url" > /dev/null 2>&1; then
        log_health "✅ $service_name: OK"
        return 0
    else
        log_health "❌ $service_name: FAILED"
        return 1
    fi
}

# Initialize failure counters
api_failures=0
web_failures=0
db_failures=0

while true; do
    # Check API
    if check_service "API" "http://localhost:8000/health"; then
        api_failures=0
    else
        ((api_failures++))
    fi
    
    # Check Frontend
    if check_service "Frontend" "http://localhost:3000"; then
        web_failures=0
    else
        ((web_failures++))
    fi
    
    # Check Database
    if docker-compose -f /opt/rentguy/src/docker-compose.prod.yml exec -T db pg_isready -U rentguy > /dev/null 2>&1; then
        log_health "✅ Database: OK"
        db_failures=0
    else
        log_health "❌ Database: FAILED"
        ((db_failures++))
    fi
    
    # Check for alert conditions
    if [ $api_failures -ge $ALERT_THRESHOLD ] || [ $web_failures -ge $ALERT_THRESHOLD ] || [ $db_failures -ge $ALERT_THRESHOLD ]; then
        log_health "🚨 ALERT: Multiple service failures detected"
        
        # Send alert (implement your notification system)
        # Example: send email, Slack notification, etc.
        
        # Optional: Auto-trigger rollback
        # /opt/rentguy/scripts/emergency_rollback.sh
    fi
    
    # Wait 60 seconds before next check
    sleep 60
done
```

### 4.2. Performance Monitoring

```bash
#!/bin/bash
# Performance monitoring script

PERF_LOG="/var/log/rentguy/performance.log"

log_perf() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $PERF_LOG
}

# Monitor API response times
monitor_api_performance() {
    local endpoint="http://localhost:8000/health"
    local response_time=$(curl -w "%{time_total}" -o /dev/null -s "$endpoint")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    log_perf "API Response Time: ${response_time_ms}ms"
    
    # Alert if response time > 2 seconds
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log_perf "⚠️  HIGH API RESPONSE TIME: ${response_time_ms}ms"
    fi
}

# Monitor system resources
monitor_system_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log_perf "CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%"
    
    # Alerts for high resource usage
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_perf "⚠️  HIGH CPU USAGE: ${cpu_usage}%"
    fi
    
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        log_perf "⚠️  HIGH MEMORY USAGE: ${memory_usage}%"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        log_perf "⚠️  HIGH DISK USAGE: ${disk_usage}%"
    fi
}

# Monitor Docker containers
monitor_containers() {
    local containers=$(docker-compose -f /opt/rentguy/src/docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}")
    log_perf "Container Status:"
    echo "$containers" >> $PERF_LOG
    
    # Check for unhealthy containers
    local unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
    if [ -n "$unhealthy" ]; then
        log_perf "⚠️  UNHEALTHY CONTAINERS: $unhealthy"
    fi
}

# Main monitoring loop
while true; do
    monitor_api_performance
    monitor_system_resources
    monitor_containers
    
    sleep 300  # Run every 5 minutes
done
```

---

## 5. Troubleshooting Guide

### 5.1. Common Issues and Solutions

**Issue 1: Database Connection Failed**
```bash
# Diagnosis
docker-compose logs db
docker-compose exec backend python -c "from app.core.db import engine; engine.connect()"

# Solution
docker-compose restart db
# Wait 30 seconds
docker-compose restart backend
```

**Issue 2: Migration Failed**
```bash
# Diagnosis
docker-compose exec backend alembic current
docker-compose exec backend alembic history

# Solution - Rollback and retry
docker-compose exec backend alembic downgrade -1
docker-compose exec backend alembic upgrade head
```

**Issue 3: Frontend Build Failed**
```bash
# Diagnosis
docker-compose logs web

# Solution - Rebuild
docker-compose build --no-cache web
docker-compose up -d web
```

**Issue 4: Email Not Sending**
```bash
# Diagnosis
docker-compose logs backend | grep -i smtp

# Solution - Check SMTP config
docker-compose exec backend python -c "
import smtplib
from email.mime.text import MIMEText
# Test SMTP connection
"
```

### 5.2. Emergency Contacts and Procedures

**Escalation Matrix:**
1. **Level 1:** Automated monitoring alerts
2. **Level 2:** Development team notification
3. **Level 3:** System administrator involvement
4. **Level 4:** Emergency rollback execution
5. **Level 5:** Stakeholder communication

**Emergency Procedures:**
- Critical failure: Execute emergency rollback immediately
- Data corruption: Stop all services, restore from backup
- Security breach: Isolate system, change all credentials
- Performance degradation: Scale resources, investigate bottlenecks

---

## 6. Post-Deployment Checklist

### 6.1. Immediate Post-Deployment (0-2 hours)

- [ ] All services running and healthy
- [ ] Database migration completed successfully
- [ ] Onboarding data seeded correctly
- [ ] Authentication working
- [ ] All API endpoints responding
- [ ] Frontend accessible and functional
- [ ] Email functionality tested
- [ ] Performance within acceptable limits
- [ ] No critical errors in logs
- [ ] Monitoring systems active

### 6.2. Extended Validation (2-24 hours)

- [ ] User acceptance testing completed
- [ ] Performance metrics stable
- [ ] No memory leaks detected
- [ ] Database performance optimal
- [ ] All integrations working
- [ ] Backup systems functioning
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team notified of successful deployment
- [ ] Rollback procedures validated

---

This technical deployment and rollback plan provides comprehensive procedures for safely deploying the RentGuy application to production with minimal risk and maximum reliability. All scripts should be tested in a staging environment before production use.
