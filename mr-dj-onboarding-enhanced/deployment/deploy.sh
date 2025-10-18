#!/bin/bash

# Mr. DJ Onboarding Module - Production Deployment Script
# Author: Manus AI
# Date: October 2025

set -e  # Exit on any error

# Configuration
APP_NAME="mr-dj-onboarding"
DOCKER_IMAGE="rentguy/mr-dj-onboarding"
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}
DOMAIN=${3:-onboarding.mr-dj.nl}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if required environment variables are set
    if [[ -z "$DOMAIN" ]]; then
        error "DOMAIN environment variable is required"
        exit 1
    fi
    
    # Check if SSL certificates exist
    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        warning "SSL certificate not found for $DOMAIN. Will attempt to generate."
    fi
    
    # Check available disk space (minimum 2GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 2097152 ]]; then
        error "Insufficient disk space. At least 2GB required."
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Build Docker image
build_image() {
    log "Building Docker image..."
    
    # Create optimized Dockerfile for production
    cat > Dockerfile.prod << EOF
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add security headers
RUN echo 'add_header X-Frame-Options "SAMEORIGIN" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Build the image
    docker build -f Dockerfile.prod -t $DOCKER_IMAGE:$VERSION .
    
    success "Docker image built successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Create docker-compose.prod.yml
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  mr-dj-onboarding:
    image: $DOCKER_IMAGE:$VERSION
    container_name: $APP_NAME
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.$APP_NAME.rule=Host(\`$DOMAIN\`)"
      - "traefik.http.routers.$APP_NAME.entrypoints=websecure"
      - "traefik.http.routers.$APP_NAME.tls.certresolver=letsencrypt"
      - "traefik.http.services.$APP_NAME.loadbalancer.server.port=80"
      - "traefik.http.routers.$APP_NAME.middlewares=security-headers"
    environment:
      - NODE_ENV=production
      - DOMAIN=$DOMAIN
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  traefik:
    external: true
EOF

    # Stop existing container if running
    if docker ps -q -f name=$APP_NAME | grep -q .; then
        log "Stopping existing container..."
        docker-compose -f docker-compose.prod.yml down
    fi
    
    # Deploy new version
    docker-compose -f docker-compose.prod.yml up -d
    
    success "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for container to be ready
    sleep 10
    
    # Check if container is running
    if ! docker ps -q -f name=$APP_NAME | grep -q .; then
        error "Container is not running"
        return 1
    fi
    
    # Check application health
    for i in {1..30}; do
        if curl -f -s "https://$DOMAIN" > /dev/null; then
            success "Application is healthy and responding"
            return 0
        fi
        log "Waiting for application to be ready... ($i/30)"
        sleep 10
    done
    
    error "Health check failed - application is not responding"
    return 1
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # Get previous image version
    PREVIOUS_VERSION=$(docker images $DOCKER_IMAGE --format "table {{.Tag}}" | grep -v "TAG\|$VERSION" | head -1)
    
    if [[ -n "$PREVIOUS_VERSION" ]]; then
        log "Rolling back to version: $PREVIOUS_VERSION"
        
        # Update docker-compose with previous version
        sed -i "s/$DOCKER_IMAGE:$VERSION/$DOCKER_IMAGE:$PREVIOUS_VERSION/g" docker-compose.prod.yml
        
        # Deploy previous version
        docker-compose -f docker-compose.prod.yml up -d
        
        if health_check; then
            success "Rollback completed successfully"
        else
            error "Rollback failed. Manual intervention required."
        fi
    else
        error "No previous version found for rollback"
    fi
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    # Keep only the last 3 versions
    docker images $DOCKER_IMAGE --format "table {{.Tag}}" | grep -v "TAG\|latest\|$VERSION" | tail -n +4 | xargs -r docker rmi $DOCKER_IMAGE: 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f
    
    success "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting deployment of Mr. DJ Onboarding Module v$VERSION to $ENVIRONMENT"
    
    # Trap errors and rollback
    trap rollback ERR
    
    pre_deployment_checks
    build_image
    deploy_application
    
    if health_check; then
        cleanup
        success "Deployment completed successfully!"
        log "Application is available at: https://$DOMAIN"
    else
        error "Deployment failed health check"
        exit 1
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [VERSION] [ENVIRONMENT] [DOMAIN]"
    echo "  VERSION: Docker image version (default: latest)"
    echo "  ENVIRONMENT: Deployment environment (default: production)"
    echo "  DOMAIN: Application domain (default: onboarding.mr-dj.nl)"
    echo ""
    echo "Example: $0 v1.0.0 production onboarding.mr-dj.nl"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@"
