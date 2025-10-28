from __future__ import annotations
import csv
import io
from datetime import date, timedelta
from random import Random

import pytest

API_BASE = "/api/v1/billing"


def _build_fuzzed_invoice(seed: int) -> tuple[dict, dict]:
    rng = Random(seed)
    issued_at = date(2024, 1, 1) + timedelta(days=rng.randint(0, 120))
    due_at = issued_at + timedelta(days=rng.randint(7, 45))
    base_vat = rng.choice([None, 0.0, 9.0, 21.0])
    line_items: list[dict[str, float | int | str | None]] = []
    for idx in range(rng.randint(1, 5)):
        quantity = rng.randint(1, 5)
        unit_price = round(rng.uniform(25.0, 450.0), 2)
        vat_override = rng.choice([None, 0.0, 9.0, 21.0])
        line_items.append(
            {
                "description": f"Rental bundle {seed}-{idx}",
                "quantity": quantity,
                "unit_price": unit_price,
                "vat_rate": vat_override,
            }
        )

    payload: dict[str, object] = {
        "project_id": 10_000 + seed,
        "client_name": f"Fuzz Client {seed}",
        "currency": "EUR",
        "issued_at": issued_at.isoformat(),
        "due_at": due_at.isoformat(),
        "reference": f"FZ-{seed:05d}",
        "vat_rate": base_vat,
        "line_items": line_items,
        "total_net_override": None,
        "total_vat_override": None,
        "sync_with_finance_bridge": False,
    }

    expected = _expected_totals(payload)
    expected["issued_at"] = issued_at.isoformat()
    expected["due_at"] = due_at.isoformat()
    return payload, expected


def _expected_totals(payload: dict) -> dict[str, float]:
    resolved_vat = payload.get("vat_rate")
    for item in payload["line_items"]:
        if resolved_vat is not None:
            break
        candidate = item.get("vat_rate")
        if candidate is not None:
            resolved_vat = candidate
    if resolved_vat is None:
        resolved_vat = 21.0

    net_total = 0.0
    vat_total = 0.0
    for item in payload["line_items"]:
        quantity = float(item["quantity"])
        unit_price = float(item["unit_price"])
        line_net = quantity * unit_price
        applied_rate = (
            float(resolved_vat)
            if item.get("vat_rate") is None
            else float(item["vat_rate"])
        )
        net_total += line_net
        vat_total += line_net * (applied_rate / 100.0)

    total_net = round(net_total, 2)
    total_vat = round(vat_total, 2)
    total_gross = round(total_net + total_vat, 2)

    return {
        "vat_rate": float(resolved_vat),
        "total_net": total_net,
        "total_vat": total_vat,
        "total_gross": total_gross,
    }


@pytest.mark.parametrize("seed", [7, 42, 1337, 4096, 2025])
def test_create_invoice_contract_with_fuzzed_payloads(client, seed: int) -> None:
    payload, expected = _build_fuzzed_invoice(seed)

    response = client.post(f"{API_BASE}/invoices", json=payload)

    assert response.status_code == 201
    invoice = response.json()

    assert invoice["project_id"] == payload["project_id"]
    assert invoice["client_name"] == payload["client_name"]
    assert invoice["reference"] == payload["reference"]
    assert invoice["issued_at"] == expected["issued_at"]
    assert invoice["due_at"] == expected["due_at"]
    assert invoice["status"] == "draft"
    assert invoice["vat_rate"] == pytest.approx(expected["vat_rate"], abs=0.01)
    assert invoice["total_net"] == pytest.approx(expected["total_net"], abs=0.01)
    assert invoice["total_vat"] == pytest.approx(expected["total_vat"], abs=0.01)
    assert invoice["total_gross"] == pytest.approx(expected["total_gross"], abs=0.01)


def test_list_and_export_invoices_preserves_contract_for_fuzzed_payloads(client) -> None:
    seeds = [101, 202, 303]
    created: dict[int, tuple[dict, dict]] = {}
    for seed in seeds:
        payload, expected = _build_fuzzed_invoice(seed)
        response = client.post(f"{API_BASE}/invoices", json=payload)
        assert response.status_code == 201
        invoice = response.json()
        created[invoice["id"]] = (payload, expected)

    list_response = client.get(f"{API_BASE}/invoices")
    assert list_response.status_code == 200
    invoices = {entry["id"]: entry for entry in list_response.json()}
    assert len(invoices) == len(seeds)

    for invoice_id, entry in invoices.items():
        payload, expected = created[invoice_id]
        assert entry["client_name"] == payload["client_name"]
        assert entry["reference"] == payload["reference"]
        assert entry["vat_rate"] == pytest.approx(expected["vat_rate"], abs=0.01)
        assert entry["total_net"] == pytest.approx(expected["total_net"], abs=0.01)
        assert entry["total_vat"] == pytest.approx(expected["total_vat"], abs=0.01)
        assert entry["total_gross"] == pytest.approx(expected["total_gross"], abs=0.01)

    export_response = client.get(
        f"{API_BASE}/export.csv",
        params={"from_date": "2023-01-01", "to_date": "2026-12-31"},
    )
    assert export_response.status_code == 200
    assert export_response.headers["content-type"].startswith("text/csv")

    reader = csv.DictReader(io.StringIO(export_response.text))
    rows = list(reader)
    assert len(rows) == len(seeds)

    for row in rows:
        invoice_id = int(row["invoice_id"])
        payload, expected = created[invoice_id]
        assert row["reference"] == payload["reference"]
        assert row["client"] == payload["client_name"]
        assert float(row["total_net"]) == pytest.approx(expected["total_net"], abs=0.01)
        assert float(row["total_vat"]) == pytest.approx(expected["total_vat"], abs=0.01)
        assert float(row["total_gross"]) == pytest.approx(expected["total_gross"], abs=0.01)
        assert float(row["vat_rate"]) == pytest.approx(expected["vat_rate"], abs=0.01)
        assert row["status"] == "draft"
