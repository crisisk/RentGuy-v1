#!/usr/bin/env bash
set -Eeuo pipefail
echo "[rollback] Stopping services (rentguy/wpctl/psra/proxy+db)"
docker compose -f docker-compose.wpctl.yml down || true
docker compose -f docker-compose.rentguy.yml down || true
docker compose -f docker-compose.psra.yml down || true
docker compose -f docker-compose.proxy-db.yml down || true
echo "[rollback] To restore DB from latest snapshot: see /root/backups/db/*.sql and use psql"
