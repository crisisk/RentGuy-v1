from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Callable, Sequence

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse
from sqlalchemy import text

from app.core.errors import AppError, app_error_handler
from app.core.logging import setup_logging
from app.core.metrics import MetricsTracker
from app.core.observability import configure_tracing
from app.core.config import settings
from app.core.db import SessionLocal, database_ready
from app.core.middleware import SecurityHeadersMiddleware
from .realtime import socket_app, sio  # Import from new realtime module
from app.modules.recurring_invoices.scheduler import (
    scheduler as recurring_invoice_scheduler,
)

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and tear down application level resources."""
    configure_tracing(app)
    app.state.start_time = time.time()
    app.state.metrics_tracker = MetricsTracker()
    app.state.sio = sio  # Store sio server in app state
    await recurring_invoice_scheduler.start()
    try:
        yield
    finally:
        await recurring_invoice_scheduler.shutdown()


app = FastAPI(title="Rentguyapp API", version="0.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)
app.add_middleware(SecurityHeadersMiddleware, hsts_enabled=settings.ENV == "prod")

app.add_exception_handler(AppError, app_error_handler)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next: Callable):
    route = request.scope.get("route")
    path_template = getattr(route, "path", request.url.path)
    if path_template == "/metrics":
        return await call_next(request)

    start = time.perf_counter()
    method = request.method

    try:
        response = await call_next(request)
    except Exception:
        duration = time.perf_counter() - start
        tracker: MetricsTracker = getattr(request.app.state, "metrics_tracker", MetricsTracker())
        request.app.state.metrics_tracker = tracker
        availability = tracker.record(
            method=method,
            path=path_template,
            status_code=500,
            latency=duration,
        )
        request.app.state.latest_availability = availability
        raise

    duration = time.perf_counter() - start
    tracker: MetricsTracker = getattr(request.app.state, "metrics_tracker", MetricsTracker())
    request.app.state.metrics_tracker = tracker
    availability = tracker.record(
        method=method,
        path=path_template,
        status_code=response.status_code,
        latency=duration,
    )
    request.app.state.latest_availability = availability
    response.headers["X-Process-Time"] = f"{duration:.3f}"
    response.headers["X-Service-Availability"] = f"{availability:.4f}"
    return response


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    if not database_ready():
        raise HTTPException(status_code=503, detail="database not available")
    with SessionLocal() as session:
        try:
            session.execute(text("SELECT 1"))
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(status_code=503, detail="database not available") from exc
    return {"status": "ready"}


@app.get("/metrics")
def metrics() -> PlainTextResponse:
    tracker: MetricsTracker = getattr(app.state, "metrics_tracker", MetricsTracker())
    app.state.metrics_tracker = tracker
    payload = tracker.prometheus_payload()
    return PlainTextResponse(payload, media_type="text/plain; version=0.0.4")


ROUTERS: Sequence[tuple[str, str, str, list[str]]] = (
    ("app.modules.auth.routes", "router", "/api/v1/auth", ["auth"]),
    ("app.modules.inventory.routes", "router", "/api/v1/inventory", ["inventory"]),
    ("app.modules.projects.routes", "router", "/api/v1", ["projects"]),
    ("app.modules.calendar_sync.routes", "router", "/api/v1", ["calendar"]),
    ("app.modules.crew.routes", "router", "/api/v1", ["crew"]),
    ("app.modules.transport.routes", "router", "/api/v1", ["transport"]),
    ("app.modules.billing.routes", "router", "/api/v1", ["billing"]),
    ("app.modules.warehouse.routes", "router", "/api/v1", ["warehouse"]),
    ("app.modules.reporting.routes", "router", "/api/v1", ["reporting"]),
    ("app.modules.customer_portal.routes", "router", "/api/v1", ["customer-portal"]),
    (
        "app.modules.recurring_invoices.routes",
        "router",
        "/api/v1",
        ["recurring-invoices"],
    ),
    ("app.modules.onboarding.routes", "router", "/api/v1", ["onboarding"]),
    ("app.modules.crm.routes", "router", "/api/v1", ["crm"]),
    (
        "app.modules.platform.observability.routes",
        "router",
        "/api/v1",
        ["observability"],
    ),
    (
        "app.modules.platform.secrets.routes",
        "router",
        "/api/v1/platform",
        ["platform"],
    ),
)


def _register_routers() -> None:
    from importlib import import_module

    for module_path, attr, prefix, tags in ROUTERS:
        module = import_module(module_path)
        router = getattr(module, attr)
        app.include_router(router, prefix=prefix, tags=tags)


_register_routers()

from app.modules.chat.routes import router as chat_router

app.include_router(chat_router, prefix="/api/v1", tags=["chat"])

# Mount the Socket.IO application
app.mount("/ws", socket_app)

