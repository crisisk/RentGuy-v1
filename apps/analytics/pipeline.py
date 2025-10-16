"""Synchronise GA4/GTM marketing metrics into CRM acquisition tables."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Iterable

from app.core.config import settings
from app.core.db import SessionLocal
from app.modules.crm import models

from .ga4 import GA4ChannelMetric, GA4Client
from .gtm import GTMClient, GTMConversionMetric

logger = logging.getLogger(__name__)


class CRMAnalyticsPipeline:
    """Pull GA4/GTM data and persist blended metrics per tenant."""

    def __init__(
        self,
        *,
        ga4_client: GA4Client | None = None,
        gtm_client: GTMClient | None = None,
        lookback_days: int | None = None,
    ) -> None:
        self.ga4_client = ga4_client or GA4Client()
        self.gtm_client = gtm_client or GTMClient()
        configured = getattr(settings, "CRM_ANALYTICS_LOOKBACK_DAYS", 30)
        self.lookback_days = lookback_days or configured

    def sync(
        self,
        start_date: date | datetime | None = None,
        end_date: date | datetime | None = None,
    ) -> None:
        """Synchronise metrics for all configured tenants."""

        end = self._ensure_date(end_date) if end_date else date.today()
        start = self._ensure_date(start_date) if start_date else end - timedelta(
            days=self.lookback_days - 1
        )

        tenants = getattr(settings, "CRM_ANALYTICS_SOURCES", {}) or {}
        for tenant_id, config in tenants.items():
            self._sync_tenant(tenant_id, config, start, end)

    # ------------------------------------------------------------------
    def _sync_tenant(
        self,
        tenant_id: str,
        config: dict[str, object],
        start: date,
        end: date,
    ) -> None:
        property_id = config.get("ga4_property_id") if isinstance(config, dict) else None
        container_id = config.get("gtm_container_id") if isinstance(config, dict) else None

        if not property_id and not container_id:
            logger.debug("Skipping tenant %s, no analytics connectors configured", tenant_id)
            return

        ga_rows: list[GA4ChannelMetric] = []
        if property_id:
            ga_rows = self.ga4_client.fetch_channel_report(
                str(property_id), start, end, tenant_id=tenant_id
            )

        gtm_rows: list[GTMConversionMetric] = []
        if container_id:
            gtm_rows = self.gtm_client.fetch_conversion_report(
                str(container_id), start, end, tenant_id=tenant_id
            )

        aggregated = self._merge_metrics(tenant_id, ga_rows, gtm_rows)
        self._persist_rows(tenant_id, aggregated, start, end)

    def _merge_metrics(
        self,
        tenant_id: str,
        ga_rows: Iterable[GA4ChannelMetric],
        gtm_rows: Iterable[GTMConversionMetric],
    ) -> dict[tuple[date, str | None, str | None], dict[str, object]]:
        merged: dict[tuple[date, str | None, str | None], dict[str, object]] = {}

        for row in ga_rows:
            key = (row.date, row.channel or None, row.source or None)
            payload = merged.setdefault(
                key,
                {
                    "tenant_id": tenant_id,
                    "medium": row.medium,
                    "sessions": 0,
                    "new_users": 0,
                    "engaged_sessions": 0,
                    "ga_conversions": 0,
                    "ga_conversion_value": Decimal(0),
                    "gtm_conversions": 0,
                    "gtm_conversion_value": Decimal(0),
                    "ga_property_id": row.property_id,
                    "gtm_container_id": None,
                },
            )
            payload["sessions"] += row.sessions
            payload["new_users"] += row.new_users
            payload["engaged_sessions"] += row.engaged_sessions
            payload["ga_conversions"] += row.conversions
            payload["ga_conversion_value"] += Decimal(str(row.conversion_value or 0.0))
            if row.medium:
                payload["medium"] = row.medium
            if row.property_id:
                payload["ga_property_id"] = row.property_id

        for row in gtm_rows:
            key = (row.date, row.channel or None, row.source or None)
            payload = merged.setdefault(
                key,
                {
                    "tenant_id": tenant_id,
                    "medium": None,
                    "sessions": 0,
                    "new_users": 0,
                    "engaged_sessions": 0,
                    "ga_conversions": 0,
                    "ga_conversion_value": Decimal(0),
                    "gtm_conversions": 0,
                    "gtm_conversion_value": Decimal(0),
                    "ga_property_id": None,
                    "gtm_container_id": row.container_id,
                },
            )
            payload["gtm_conversions"] += row.conversions
            payload["gtm_conversion_value"] += Decimal(str(row.conversion_value or 0.0))
            if row.container_id:
                payload["gtm_container_id"] = row.container_id

        return merged

    def _persist_rows(
        self,
        tenant_id: str,
        aggregated: dict[tuple[date, str | None, str | None], dict[str, object]],
        start: date,
        end: date,
    ) -> None:
        if not aggregated:
            logger.debug("No analytics rows to persist for tenant %s", tenant_id)
            return

        with SessionLocal() as session:
            session.query(models.CRMAcquisitionMetric).filter(
                models.CRMAcquisitionMetric.tenant_id == tenant_id,
                models.CRMAcquisitionMetric.captured_date >= start,
                models.CRMAcquisitionMetric.captured_date <= end,
            ).delete(synchronize_session=False)

            for (captured_date, channel, source), payload in aggregated.items():
                session.add(
                    models.CRMAcquisitionMetric(
                        tenant_id=tenant_id,
                        channel=channel,
                        source=source,
                        medium=payload.get("medium"),
                        captured_date=captured_date,
                        sessions=int(payload["sessions"]),
                        new_users=int(payload["new_users"]),
                        engaged_sessions=int(payload["engaged_sessions"]),
                        ga_conversions=int(payload["ga_conversions"]),
                        ga_conversion_value=payload["ga_conversion_value"],
                        gtm_conversions=int(payload["gtm_conversions"]),
                        gtm_conversion_value=payload["gtm_conversion_value"],
                        ga_property_id=payload.get("ga_property_id"),
                        gtm_container_id=payload.get("gtm_container_id"),
                    )
                )
            session.commit()

        logger.info(
            "Synced %s analytics rows for tenant %s", len(aggregated), tenant_id
        )

    @staticmethod
    def _ensure_date(value: date | datetime) -> date:
        if isinstance(value, datetime):
            return value.date()
        return value
