from __future__ import annotations

from typing import Dict

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.core.config import settings

_configured = False


def _parse_headers(raw: str | None) -> Dict[str, str]:
    if not raw:
        return {}
    headers: Dict[str, str] = {}
    for pair in raw.split(","):
        if "=" not in pair:
            continue
        key, value = pair.split("=", 1)
        headers[key.strip()] = value.strip()
    return headers


def configure_tracing(app: FastAPI) -> None:
    global _configured
    if _configured or not settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        return

    resource = Resource.create({
        "service.name": settings.OTEL_SERVICE_NAME,
        "service.version": getattr(app, "version", "dev"),
        "deployment.environment": settings.ENV,
    })

    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers=_parse_headers(settings.OTEL_EXPORTER_OTLP_HEADERS) or None,
    )
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider, excluded_urls="/metrics,/healthz,/readyz")
    _configured = True
