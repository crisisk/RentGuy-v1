from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class RequestSampleOut(BaseModel):
    path: str
    method: str
    status_code: int
    latency_ms: float = Field(..., ge=0)
    timestamp: datetime


class ObservabilityStatusOut(BaseModel):
    uptime_seconds: float
    uptime_human: str
    total_requests: int
    availability: float
    average_latency_ms: float
    error_count: int
    sample_size: int
    recent_requests: list[RequestSampleOut]
    generated_at: datetime

