#!/usr/bin/env bash
set -Eeuo pipefail
DBNAME="${1:-appdb}"
source ./db/.env
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="/root/backups/db/${DBNAME}_${STAMP}.sql"
echo "[db] Snapshotting $DBNAME to $OUT"
docker exec -i $(docker ps -qf name=db) pg_dump -U "$POSTGRES_USER" -d "$DBNAME" > "$OUT"
echo "[db] Snapshot saved: $OUT"
