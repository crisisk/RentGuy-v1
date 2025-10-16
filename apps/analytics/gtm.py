"""Google Tag Manager conversion aggregation with sample fallback."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

DEFAULT_SAMPLE_PATH = Path(__file__).resolve().parent / "sample_data" / "gtm_conversions.json"


@dataclass
class GTMConversionMetric:
    """Daily GTM conversion metrics mapped to a marketing channel."""

    tenant_id: str | None
    container_id: str | None
    date: date
    channel: str
    source: str | None
    conversions: int
    conversion_value: float


class GTMClient:
    """Return GTM conversion metrics or fall back to curated samples."""

    def __init__(self, *, api_key: str | None = None, sample_path: Path | None = None) -> None:
        self.api_key = api_key
        self._sample_path = sample_path or DEFAULT_SAMPLE_PATH
        self._sample_data = self._load_sample_data(self._sample_path)

    def fetch_conversion_report(
        self,
        container_id: str,
        start_date: date | datetime,
        end_date: date | datetime,
        *,
        tenant_id: str | None = None,
    ) -> list[GTMConversionMetric]:
        """Return GTM conversions per channel for the inclusive date range."""

        start = self._ensure_date(start_date)
        end = self._ensure_date(end_date)

        # Placeholder for API-backed implementation. When no API key is present we
        # rely on curated samples, allowing tests and local development to run
        # without Google Cloud credentials.
        dataset = self._sample_data
        results: list[GTMConversionMetric] = []
        for entry in dataset:
            entry_date_raw = entry.get("date")
            if not entry_date_raw:
                continue
            entry_date = date.fromisoformat(str(entry_date_raw))
            if entry_date < start or entry_date > end:
                continue
            entry_container = entry.get("container_id")
            if entry_container and entry_container != container_id:
                continue
            entry_tenant = entry.get("tenant")
            if tenant_id and entry_tenant and entry_tenant != tenant_id:
                continue
            results.append(
                GTMConversionMetric(
                    tenant_id=entry_tenant or tenant_id,
                    container_id=entry_container or container_id,
                    date=entry_date,
                    channel=str(entry.get("channel", "Website")),
                    source=entry.get("source"),
                    conversions=int(entry.get("conversions", 0)),
                    conversion_value=float(entry.get("conversion_value", 0.0)),
                )
            )
        return results

    @staticmethod
    def _ensure_date(value: date | datetime) -> date:
        if isinstance(value, datetime):
            return value.date()
        return value

    @staticmethod
    def _load_sample_data(path: Path) -> list[dict[str, object]]:
        if not path.exists():  # pragma: no cover - defensive fallback
            return []
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, list):
            return data
        return []
