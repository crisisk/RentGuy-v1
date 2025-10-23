"""Tests for the scanning API routes."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from app.main import app
from app.modules.auth import deps as auth_deps
from app.modules.auth.models import User
from app.modules.scanning.models import Asset, ScanHistory


@pytest.fixture()
def scanner_user(db_session):
    user = User(email="scanner@example.com", password_hash="hashed", role="admin")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def scanner_asset(db_session):
    asset = Asset(barcode="ASSET123")
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def _override_user(user):
    return lambda: user


def _submit_scan(client, barcode, coordinates, timestamp):
    payload = {
        "barcode": barcode,
        "scan_location": {"type": "Point", "coordinates": coordinates},
        "timestamp": timestamp.isoformat(),
    }
    return client.post("/api/v1/scans/submit", json=payload)


def test_submit_scan_success(client, db_session, scanner_user, scanner_asset):
    original_override = app.dependency_overrides.get(auth_deps.get_current_user)
    app.dependency_overrides[auth_deps.get_current_user] = _override_user(scanner_user)
    try:
        response = _submit_scan(
            client,
            scanner_asset.barcode,
            [4.8952, 52.3702],
            datetime.utcnow(),
        )
    finally:
        if original_override is not None:
            app.dependency_overrides[auth_deps.get_current_user] = original_override
        else:
            app.dependency_overrides.pop(auth_deps.get_current_user, None)

    assert response.status_code == 201
    body = response.json()
    assert body["asset_id"] == scanner_asset.id
    assert body["scan_id"] > 0

    history = db_session.query(ScanHistory).all()
    assert len(history) == 1
    assert history[0].barcode == scanner_asset.barcode


def test_submit_scan_duplicate_rejected(client, scanner_user, scanner_asset):
    original_override = app.dependency_overrides.get(auth_deps.get_current_user)
    app.dependency_overrides[auth_deps.get_current_user] = _override_user(scanner_user)
    try:
        first = _submit_scan(
            client,
            scanner_asset.barcode,
            [4.8952, 52.3702],
            datetime.utcnow(),
        )
        second = _submit_scan(
            client,
            scanner_asset.barcode,
            [4.8952, 52.3702],
            datetime.utcnow(),
        )
    finally:
        if original_override is not None:
            app.dependency_overrides[auth_deps.get_current_user] = original_override
        else:
            app.dependency_overrides.pop(auth_deps.get_current_user, None)

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.json()["detail"] == "Duplicate scan within cooldown period"


def test_submit_scan_invalid_location(client, scanner_user, scanner_asset):
    original_override = app.dependency_overrides.get(auth_deps.get_current_user)
    app.dependency_overrides[auth_deps.get_current_user] = _override_user(scanner_user)
    try:
        response = _submit_scan(
            client,
            scanner_asset.barcode,
            [5.8952, 53.3702],  # Far outside the 10km radius
            datetime.utcnow(),
        )
    finally:
        if original_override is not None:
            app.dependency_overrides[auth_deps.get_current_user] = original_override
        else:
            app.dependency_overrides.pop(auth_deps.get_current_user, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "User not authorized for this scan location"


def test_scan_history_endpoint(client, scanner_user, scanner_asset):
    original_override = app.dependency_overrides.get(auth_deps.get_current_user)
    app.dependency_overrides[auth_deps.get_current_user] = _override_user(scanner_user)
    try:
        timestamp = datetime.utcnow() - timedelta(minutes=1)
        response = _submit_scan(
            client,
            scanner_asset.barcode,
            [4.8952, 52.3702],
            timestamp,
        )
        assert response.status_code == 201

        history_response = client.get("/api/v1/scans/history")
    finally:
        if original_override is not None:
            app.dependency_overrides[auth_deps.get_current_user] = original_override
        else:
            app.dependency_overrides.pop(auth_deps.get_current_user, None)

    assert history_response.status_code == 200
    payload = history_response.json()
    assert len(payload) == 1
    entry = payload[0]
    assert entry["barcode"] == scanner_asset.barcode
    assert entry["location"]["type"] == "Point"
    assert entry["location"]["coordinates"] == [4.8952, 52.3702]
