#!/usr/bin/env bash
set -euo pipefail
PHASE="${1:-manual}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT:-/home/ubuntu/backups}/${STAMP}-${PHASE}"
mkdir -p "$BACKUP_DIR"
echo "[*] Dumping Postgres..."
docker exec $(docker ps -qf name=_db_) pg_dump -U rentguy -F c rentguy > "${BACKUP_DIR}/rentguy.pg.dump" || true
echo "[*] Archiving repo state..."
tar -czf "${BACKUP_DIR}/repo.tar.gz" -C "$(git rev-parse --show-toplevel 2>/dev/null || echo /)" . || true
echo "[*] Done -> ${BACKUP_DIR}"
