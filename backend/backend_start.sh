#!/usr/bin/env bash
set -e
export DATABASE_URL=${DATABASE_URL:-postgresql+psycopg://rentguy:rentguy@db:5432/rentguy}
alembic -c alembic/alembic.ini upgrade head
# python seed_admin.py  # Commented out - file doesn't exist
uvicorn app.main:app --host 0.0.0.0 --port 8000
