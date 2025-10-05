#!/usr/bin/env bash
set -Eeuo pipefail
mkdir -p /root/manus-logs /root/backups/db
docker version >/dev/null
docker compose version >/dev/null
docker network create sevensa-core3_traefik >/dev/null 2>&1 || true
docker network create sevensa-core3_backend >/dev/null 2>&1 || true
docker compose -f docker-compose.proxy-db.yml up -d proxy db
