from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse

from app.core.errors import AppError, app_error_handler
from app.core.logging import setup_logging
from app.core.metrics import MetricsTracker
from app.core.observability import configure_tracing
from .realtime import socket_app, sio # Import from new realtime module

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and tear down application level resources."""
    configure_tracing(app)
    app.state.start_time = time.time()
    app.state.metrics_tracker = MetricsTracker()
    app.state.sio = sio # Store sio server in app state
    yield


app = FastAPI(title="Rentguyapp API", version="0.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "ready"}


@app.get("/metrics")
def metrics() -> PlainTextResponse:
    tracker: MetricsTracker = getattr(app.state, "metrics_tracker", MetricsTracker())
    app.state.metrics_tracker = tracker
    payload = tracker.prometheus_payload()
    return PlainTextResponse(payload, media_type="text/plain; version=0.0.4")


# Mount module routers
from app.modules.auth.routes import router as auth_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

from app.modules.inventory.routes import router as inventory_router

app.include_router(inventory_router, prefix="/api/v1/inventory", tags=["inventory"])

from app.modules.projects.routes import router as projects_router

app.include_router(projects_router, prefix="/api/v1", tags=["projects"])

from app.modules.calendar_sync.routes import router as calendar_router

app.include_router(calendar_router, prefix="/api/v1", tags=["calendar"])

from app.modules.crew.routes import router as crew_router

app.include_router(crew_router, prefix="/api/v1", tags=["crew"])

from app.modules.transport.routes import router as transport_router

app.include_router(transport_router, prefix="/api/v1", tags=["transport"])

from app.modules.billing.routes import router as billing_router

app.include_router(billing_router, prefix="/api/v1", tags=["billing"])

from app.modules.warehouse.routes import router as warehouse_router

app.include_router(warehouse_router, prefix="/api/v1", tags=["warehouse"])

from app.modules.reporting.routes import router as reporting_router

app.include_router(reporting_router, prefix="/api/v1", tags=["reporting"])

from app.modules.platform.observability.routes import router as observability_router

app.include_router(observability_router, prefix="/api/v1", tags=["observability"])

# Mount the Socket.IO application
app.mount("/ws", socket_app)
