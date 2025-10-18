#!/usr/bin/env bash
set -Eeuo pipefail
echo "[verify] Alembic revision compatibility"
docker compose -f docker-compose.rentguy.yml run --rm rentguy-api bash -lc 'alembic current; alembic heads'
echo "[verify] If divergence detected, review migrations before proceeding."
