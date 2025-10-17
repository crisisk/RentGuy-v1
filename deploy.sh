#!/bin/bash

# RentGuy Production Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "================================================"
echo "RentGuy Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Compose file $COMPOSE_FILE not found!"
fi

info "Using compose file: $COMPOSE_FILE"

# Pre-flight checks
info "Running pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed!"
fi
info "✓ Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed!"
fi
info "✓ Docker Compose found: $(docker-compose --version)"

# Check environment file
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f ".env.production" ]; then
        warn "No .env.production file found. Creating from template..."
        if [ -f ".env.production.template" ]; then
            cp .env.production.template .env.production
            warn "Please edit .env.production with your actual values!"
            error "Deployment aborted. Configure .env.production first."
        else
            error ".env.production.template not found!"
        fi
    fi
    info "✓ .env.production exists"
fi

# Check required directories for production
if [ "$ENVIRONMENT" = "production" ]; then
    info "Checking data directories..."

    DIRS=(
        "/root/rentguy/data/postgres"
        "/root/rentguy/data/redis"
        "/root/backups/rentguy"
    )

    for dir in "${DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            info "Creating directory: $dir"
            sudo mkdir -p "$dir"
        fi
    done

    # Set correct permissions
    info "Setting permissions..."
    sudo chown -R 999:999 /root/rentguy/data/postgres 2>/dev/null || true
    sudo chown -R 999:999 /root/rentguy/data/redis 2>/dev/null || true

    info "✓ Data directories ready"
fi

# Create external network for production
if [ "$ENVIRONMENT" = "production" ]; then
    if ! docker network inspect web &> /dev/null; then
        info "Creating external 'web' network for Traefik..."
        docker network create web
    else
        info "✓ External 'web' network exists"
    fi
fi

# Build images
info "Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    error "Build failed!"
fi

info "✓ Build successful"

# Pull any missing images
info "Pulling required images..."
docker-compose -f $COMPOSE_FILE pull

# Stop existing containers
info "Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Start services
info "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    error "Failed to start services!"
fi

info "✓ Services started"

# Wait for services to be healthy
info "Waiting for services to be healthy..."
sleep 10

# Check service health
info "Checking service health..."

SERVICES=$(docker-compose -f $COMPOSE_FILE ps --services)

for service in $SERVICES; do
    CONTAINER_NAME=$(docker-compose -f $COMPOSE_FILE ps -q $service)
    if [ -z "$CONTAINER_NAME" ]; then
        warn "Service $service is not running"
        continue
    fi

    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo "no_healthcheck")

    if [ "$HEALTH" = "healthy" ]; then
        info "✓ $service is healthy"
    elif [ "$HEALTH" = "no_healthcheck" ]; then
        STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)
        if [ "$STATUS" = "running" ]; then
            info "✓ $service is running (no healthcheck)"
        else
            warn "✗ $service is $STATUS"
        fi
    else
        warn "✗ $service health: $HEALTH"
    fi
done

# Run migrations for production
if [ "$ENVIRONMENT" = "production" ]; then
    info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE run --rm rentguy-migrations || warn "Migrations failed or already applied"
fi

# Show running containers
info "Currently running containers:"
docker-compose -f $COMPOSE_FILE ps

# Show service URLs
echo ""
info "================================================"
info "Deployment Complete!"
info "================================================"

if [ "$ENVIRONMENT" = "staging" ]; then
    echo ""
    info "Service URLs:"
    info "  Frontend: http://localhost:8080"
    info "  Backend:  http://localhost:8000"
    info "  Health:   http://localhost:8000/healthz"
    echo ""
    info "View logs: docker-compose -f $COMPOSE_FILE logs -f"
elif [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    info "Production deployment successful!"
    info "Check your configured domain for access"
    echo ""
    info "Useful commands:"
    info "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
    info "  Check status: docker-compose -f $COMPOSE_FILE ps"
    info "  Stop:         docker-compose -f $COMPOSE_FILE down"
fi

echo ""
info "================================================"

# Show logs tail
info "Tailing logs (Ctrl+C to exit)..."
docker-compose -f $COMPOSE_FILE logs -f --tail=50
