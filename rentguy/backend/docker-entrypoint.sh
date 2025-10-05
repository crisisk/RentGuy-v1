#!/usr/bin/env bash
set -Eeuo pipefail
echo "[rentguy] DB connectivity check"
python - <<'PY'
import os, sys
from sqlalchemy import create_engine
url = os.environ.get("DATABASE_URL","")
try:
    e = create_engine(url, pool_pre_ping=True)
    with e.connect() as c: c.execute("SELECT 1")
    print("[rentguy] DB OK")
except Exception as ex:
    print("[rentguy] DB FAIL:", ex); sys.exit(1)
PY

echo "[rentguy] Alembic upgrade head"
alembic -c "${ALEMBIC_CONFIG:-alembic/alembic.ini}" upgrade head

echo "[rentguy] Starting uvicorn on :${APP_PORT:-8001}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${APP_PORT:-8001}" --proxy-headers
