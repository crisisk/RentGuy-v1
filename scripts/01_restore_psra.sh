#!/usr/bin/env bash
set -Eeuo pipefail
PSRA_TARBALL=${PSRA_TARBALL:-/root/psra_final_comprehensive_backup_20250927_211818.tar.gz}
RESTORE_DIR=/srv/restore-psra-$(date +%Y%m%d-%H%M%S)
mkdir -p "$RESTORE_DIR"

# Snapshot current DB before restore
bash scripts/12_db_snapshot.sh psra || true

if [[ -f "$PSRA_TARBALL" ]]; then
  echo "[psra] Extracting backup $PSRA_TARBALL"
  tar -xzf "$PSRA_TARBALL" -C "$RESTORE_DIR"
  DB_DUMP=$(find "$RESTORE_DIR" -type f \( -name '*.backup' -o -name '*.sql' \) | head -n1 || true)
  if [[ -n "$DB_DUMP" ]]; then
    source ./db/.env
    echo "[psra] Restoring DB from $DB_DUMP"
    if [[ "$DB_DUMP" == *.backup ]]; then
      docker exec -i $(docker ps -qf name=db) pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$DB_DUMP"
    else
      docker exec -i $(docker ps -qf name=db) psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$DB_DUMP"
    fi
  fi
  rsync -a "$RESTORE_DIR"/ ./psra/ || true
fi

docker compose -f docker-compose.psra.yml build --no-cache
docker compose -f docker-compose.psra.yml up -d psra
