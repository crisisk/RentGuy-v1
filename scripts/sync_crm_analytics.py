"""Run the CRM analytics pipeline to ingest GA4/GTM metrics."""

from __future__ import annotations

from apps.analytics import CRMAnalyticsPipeline


def main() -> None:
    pipeline = CRMAnalyticsPipeline()
    pipeline.sync()


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    main()
