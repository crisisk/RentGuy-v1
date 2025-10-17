#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
# Extract hostname from DATABASE_URL or use default
DB_HOST=$(echo ${DATABASE_URL} | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_HOST=${DB_HOST:-postgres}
while ! pg_isready -h ${DB_HOST} -U ${POSTGRES_USER:-rentguy} > /dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Running database migrations..."
alembic -c alembic/alembic.ini upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
