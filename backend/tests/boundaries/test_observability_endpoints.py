from __future__ import annotations

from fastapi.testclient import TestClient


def test_metrics_endpoint_exposes_prometheus_payload(client: TestClient):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "rentguy_service_uptime_seconds" in response.text
    assert response.headers["content-type"].startswith("text/plain")


def test_observability_status_returns_snapshot(client: TestClient):
    client.get("/healthz")
    status_response = client.get("/api/v1/observability/status")

    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload["uptime_seconds"] >= 0
    assert payload["total_requests"] >= 1
    assert "m" in payload["uptime_human"]
    assert "recent_requests" in payload
    assert isinstance(payload["recent_requests"], list)
    if payload["recent_requests"]:
        sample = payload["recent_requests"][0]
        assert "latency_ms" in sample
        assert "timestamp" in sample
