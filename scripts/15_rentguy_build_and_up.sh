#!/usr/bin/env bash
set -Eeuo pipefail
docker compose -f docker-compose.rentguy.yml build --no-cache
RENTGUY_API_URL=${RENTGUY_API_URL:-https://api-rentguy.sevensa.nl}   docker compose -f docker-compose.rentguy.yml up -d redis rentguy-api rentguy-web keycloak
