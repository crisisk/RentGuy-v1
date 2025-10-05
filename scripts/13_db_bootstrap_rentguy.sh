#!/usr/bin/env bash
set -Eeuo pipefail
source ./db/.env
echo "[db] Ensuring rentguy database and user exist"
docker exec -i $(docker ps -qf name=db) psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rentguy') THEN
    CREATE ROLE rentguy LOGIN PASSWORD 'rentguy';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rentguy') THEN
    CREATE DATABASE rentguy OWNER rentguy;
  END IF;
END $$;
SQL
echo "[db] OK"
