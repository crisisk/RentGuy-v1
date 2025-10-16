"""Lightweight GA4 data client with sample fallback for tenant analytics."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

try:  # pragma: no cover - optional dependency
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
except ImportError:  # pragma: no cover - optional dependency
    BetaAnalyticsDataClient = None  # type: ignore[attr-defined]

DEFAULT_SAMPLE_PATH = Path(__file__).resolve().parent / "sample_data" / "ga4_channels.json"


@dataclass
class GA4ChannelMetric:
    """Aggregated GA4 channel metrics for a single day."""

    tenant_id: str | None
    property_id: str | None
    date: date
    channel: str
    source: str | None
    medium: str | None
    sessions: int
    new_users: int
    engaged_sessions: int
    conversions: int
    conversion_value: float


class GA4Client:
    """Fetch GA4 channel metrics or fall back to curated samples."""

    def __init__(
        self,
        *,
        service_account_path: str | None = None,
        service_account_info: dict[str, object] | None = None,
        sample_path: Path | None = None,
    ) -> None:
        self._sample_path = sample_path or DEFAULT_SAMPLE_PATH
        self._sample_data: list[dict[str, object]] | None = None
        self._client: BetaAnalyticsDataClient | None = None

        if BetaAnalyticsDataClient is not None:
            try:
                if service_account_info is not None:
                    self._client = BetaAnalyticsDataClient.from_service_account_info(
                        service_account_info
                    )
                elif service_account_path is not None:
                    self._client = BetaAnalyticsDataClient.from_service_account_file(
                        service_account_path
                    )
            except Exception:  # pragma: no cover - defensive fallback
                self._client = None

        if self._client is None:
            self._sample_data = self._load_sample_data(self._sample_path)

    def fetch_channel_report(
        self,
        property_id: str,
        start_date: date | datetime,
        end_date: date | datetime,
        *,
        tenant_id: str | None = None,
    ) -> list[GA4ChannelMetric]:
        """Return GA4 channel metrics for the inclusive date range."""

        start = self._ensure_date(start_date)
        end = self._ensure_date(end_date)

        if self._client is not None:
            try:
                return self._fetch_from_api(property_id, start, end, tenant_id)
            except Exception:  # pragma: no cover - defensive fallback to samples
                return self._fetch_from_sample(property_id, start, end, tenant_id)
        return self._fetch_from_sample(property_id, start, end, tenant_id)

    # ------------------------------------------------------------------
    def _fetch_from_api(
        self,
        property_id: str,
        start: date,
        end: date,
        tenant_id: str | None,
    ) -> list[GA4ChannelMetric]:  # pragma: no cover - requires GA4 credentials
        assert self._client is not None
        request = RunReportRequest(
            property=property_id,
            dimensions=[
                Dimension(name="date"),
                Dimension(name="sessionDefaultChannelGroup"),
                Dimension(name="source"),
                Dimension(name="medium"),
            ],
            metrics=[
                Metric(name="sessions"),
                Metric(name="newUsers"),
                Metric(name="engagedSessions"),
                Metric(name="conversions"),
                Metric(name="totalRevenue"),
            ],
            date_ranges=[
                DateRange(start_date=start.isoformat(), end_date=end.isoformat())
            ],
        )

        response = self._client.run_report(request)
        metrics: list[GA4ChannelMetric] = []
        for row in response.rows:
            dimensions = [value.value for value in row.dimension_values]
            metric_values = [value.value for value in row.metric_values]
            metric_date = date.fromisoformat(dimensions[0])
            channel = dimensions[1] or "(other)"
            source = dimensions[2] or None
            medium = dimensions[3] or None
            sessions = int(float(metric_values[0] or 0))
            new_users = int(float(metric_values[1] or 0))
            engaged_sessions = int(float(metric_values[2] or 0))
            conversions = int(round(float(metric_values[3] or 0)))
            conversion_value = float(metric_values[4] or 0.0)
            metrics.append(
                GA4ChannelMetric(
                    tenant_id=tenant_id,
                    property_id=property_id,
                    date=metric_date,
                    channel=channel,
                    source=source,
                    medium=medium,
                    sessions=sessions,
                    new_users=new_users,
                    engaged_sessions=engaged_sessions,
                    conversions=conversions,
                    conversion_value=conversion_value,
                )
            )
        return metrics

    def _fetch_from_sample(
        self,
        property_id: str,
        start: date,
        end: date,
        tenant_id: str | None,
    ) -> list[GA4ChannelMetric]:
        dataset = self._sample_data or []
        results: list[GA4ChannelMetric] = []
        for entry in dataset:
            entry_date_raw = entry.get("date")
            if not entry_date_raw:
                continue
            entry_date = date.fromisoformat(str(entry_date_raw))
            if entry_date < start or entry_date > end:
                continue
            entry_property = entry.get("property_id")
            if entry_property and entry_property != property_id:
                continue
            entry_tenant = entry.get("tenant")
            if tenant_id and entry_tenant and entry_tenant != tenant_id:
                continue
            results.append(
                GA4ChannelMetric(
                    tenant_id=entry_tenant or tenant_id,
                    property_id=entry_property or property_id,
                    date=entry_date,
                    channel=str(entry.get("channel", "Direct")),
                    source=entry.get("source"),
                    medium=entry.get("medium"),
                    sessions=int(entry.get("sessions", 0)),
                    new_users=int(entry.get("new_users", 0)),
                    engaged_sessions=int(entry.get("engaged_sessions", 0)),
                    conversions=int(entry.get("conversions", 0)),
                    conversion_value=float(entry.get("conversion_value", 0.0)),
                )
            )
        return results

    # ------------------------------------------------------------------
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
