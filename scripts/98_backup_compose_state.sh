#!/usr/bin/env bash
set -Eeuo pipefail
STAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p /root/backups/state/${STAMP}
docker compose -f docker-compose.psra.yml ps > /root/backups/state/${STAMP}/psra.txt || true
docker compose -f docker-compose.rentguy.yml ps > /root/backups/state/${STAMP}/rentguy.txt || true
docker compose -f docker-compose.wpctl.yml ps > /root/backups/state/${STAMP}/wpctl.txt || true
echo "[state] Saved compose ps snapshots to /root/backups/state/${STAMP}"
