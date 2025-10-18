"""Sanity check against the FastAPI health endpoint."""

from __future__ import annotations

import importlib
import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-secret")

# Importing the backend test configuration installs lightweight stubs for optional
# dependencies (OpenTelemetry, geoalchemy2) so the FastAPI app can be imported in
# isolation from the rest of the backend test-suite.
importlib.import_module("backend.tests.conftest")

from app.main import app

def test_health():
    c = TestClient(app)
    r = c.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
