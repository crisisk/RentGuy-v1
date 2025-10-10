from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, Request

from app.core.metrics import MetricsTracker
from app.modules.auth.deps import require_role
from .schemas import ObservabilityStatusOut, RequestSampleOut


router = APIRouter()


def _humanize_duration(seconds: float) -> str:
    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    days, hours = divmod(hours, 24)
    parts: list[str] = []
    if days:
        parts.append(f"{days}d")
    if hours or parts:
        parts.append(f"{hours}u")
    parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


@router.get("/observability/status", response_model=ObservabilityStatusOut)
def observability_status(
    request: Request,
    user=Depends(require_role("admin", "planner", "viewer")),
) -> ObservabilityStatusOut:
    tracker: MetricsTracker = request.app.state.metrics_tracker
    snapshot = tracker.snapshot()

    uptime_seconds = float(snapshot["uptime_seconds"])
    recent = [
        RequestSampleOut(
            path=entry["path"],
            method=entry["method"],
            status_code=int(entry["status_code"]),
            latency_ms=float(entry["latency_seconds"]) * 1000,
            timestamp=datetime.fromtimestamp(float(entry["timestamp"])),
        )
        for entry in snapshot["recent_requests"]
    ]

    return ObservabilityStatusOut(
        uptime_seconds=uptime_seconds,
        uptime_human=_humanize_duration(uptime_seconds),
        total_requests=int(snapshot["total_requests"]),
        availability=float(snapshot["availability"]),
        average_latency_ms=float(snapshot["average_latency_seconds"]) * 1000,
        error_count=int(snapshot["error_count"]),
        sample_size=len(recent),
        recent_requests=recent,
        generated_at=datetime.utcnow(),
    )

