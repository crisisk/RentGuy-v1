#!/bin/bash
set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_NAME="myapp"
GIT_BRANCH="staging"
DEPLOY_DIR="/opt/deployments/${PROJECT_NAME}"

# Logging function
log() {
    echo -e "${GREEN}[DEPLOY] $1${NC}"
}

# Error handling function
error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    rollback
    exit 1
}

# Rollback function
rollback() {
    log "Starting rollback process..."
    if [ -f "${DEPLOY_DIR}/docker-compose.yml.backup" ]; then
        mv "${DEPLOY_DIR}/docker-compose.yml.backup" "${DEPLOY_DIR}/docker-compose.yml"
    fi
    docker-compose -f "${DEPLOY_DIR}/docker-compose.yml" up -d
}

# Prerequisites check
prereqs_check() {
    log "Checking prerequisites..."
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
}

# Main deployment function
deploy() {
    # Change to deployment directory
    cd "${DEPLOY_DIR}" || error "Cannot change to deployment directory"

    # 1. Prerequisites check
    prereqs_check

    # 2. Pull latest code
    log "Pulling latest code..."
    git fetch origin
    git checkout "${GIT_BRANCH}"
    git pull origin "${GIT_BRANCH}"

    # 3. Copy staging environment
    log "Configuring environment..."
    cp .env.staging .env

    # 4. NPM build
    log "Building application..."
    npm ci || error "NPM install failed"
    npm run build || error "Build failed"

    # Backup current docker-compose
    cp docker-compose.yml docker-compose.yml.backup

    # 5. Build Docker images
    log "Building Docker images..."
    docker-compose build || error "Docker build failed"

    # 6. Stop old containers
    log "Stopping existing containers..."
    docker-compose down || true

    # 7. Start new containers
    log "Starting new containers..."
    docker-compose up -d || error "Docker compose up failed"

    # 8. Wait for health checks
    log "Waiting for services to be healthy..."
    sleep 30  # Adjust based on your startup time

    # 9. Run smoke tests
    log "Running smoke tests..."
    npm run test:smoke || error "Smoke tests failed"

    # 10. Success message
    log "Deployment to staging completed successfully!"
    echo "Application URLs:"
    echo "- Web: https://staging.myapp.com"
    echo "- API: https://api-staging.myapp.com"
}

# Execute deployment
main() {
    trap rollback ERR

    log "Starting deployment to staging environment..."
    deploy
}

# Run main function
main
