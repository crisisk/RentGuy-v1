from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock
import time
from typing import Deque, Dict, Iterable, Tuple


@dataclass
class _RequestSample:
    method: str
    path: str
    status: int
    latency: float
    timestamp: float


class MetricsTracker:
    """In-memory tracker voor uptime, latency en requeststatistieken."""

    __slots__ = (
        "start_time",
        "lock",
        "total_requests",
        "error_requests",
        "latency_total",
        "recent",
        "per_path_counts",
        "per_path_latency",
        "error_counts",
    )

    def __init__(self, max_samples: int = 50) -> None:
        self.start_time = time.time()
        self.lock = Lock()
        self.total_requests = 0
        self.error_requests = 0
        self.latency_total = 0.0
        self.recent: Deque[_RequestSample] = deque(maxlen=max_samples)
        self.per_path_counts: Dict[Tuple[str, str, str], int] = defaultdict(int)
        self.per_path_latency: Dict[Tuple[str, str], float] = defaultdict(float)
        self.error_counts: Dict[Tuple[str, str], int] = defaultdict(int)

    def record(self, *, method: str, path: str, status_code: int, latency: float) -> float:
        with self.lock:
            self.total_requests += 1
            self.latency_total += latency
            key = (method, path, str(status_code))
            self.per_path_counts[key] += 1
            latency_key = (method, path)
            self.per_path_latency[latency_key] += latency
            if status_code >= 500:
                self.error_requests += 1
                self.error_counts[latency_key] += 1
            self.recent.append(
                _RequestSample(
                    method=method,
                    path=path,
                    status=status_code,
                    latency=latency,
                    timestamp=time.time(),
                )
            )

            availability = 1.0 if self.total_requests == 0 else 1.0 - (self.error_requests / self.total_requests)
            return availability

    def uptime_seconds(self) -> float:
        return time.time() - self.start_time

    def snapshot(self) -> Dict[str, object]:
        with self.lock:
            total = self.total_requests
            errors = self.error_requests
            latency_total = self.latency_total
            counts = dict(self.per_path_counts)
            errors_by_path = dict(self.error_counts)
            latency_by_path = dict(self.per_path_latency)
            recent: Iterable[_RequestSample] = list(self.recent)

        avg_latency = (latency_total / total) if total else 0.0
        availability = 1.0 if total == 0 else 1.0 - (errors / total)

        return {
            "uptime_seconds": self.uptime_seconds(),
            "total_requests": total,
            "error_count": errors,
            "average_latency_seconds": avg_latency,
            "availability": availability,
            "per_path_counts": counts,
            "per_path_latency": latency_by_path,
            "error_counts": errors_by_path,
            "recent_requests": [
                {
                    "method": sample.method,
                    "path": sample.path,
                    "status_code": sample.status,
                    "latency_seconds": sample.latency,
                    "timestamp": sample.timestamp,
                }
                for sample in recent
            ],
        }

    def prometheus_payload(self) -> str:
        snapshot = self.snapshot()
        lines = [
            "# HELP rentguy_request_total Total number of HTTP requests processed by the API.",
            "# TYPE rentguy_request_total counter",
        ]

        for (method, path, status_code), value in sorted(snapshot["per_path_counts"].items()):
            lines.append(
                f'rentguy_request_total{{method="{method}",path="{path}",status_code="{status_code}"}} {value}'
            )

        lines.extend(
            [
                "# HELP rentguy_request_error_total Total number of 5xx responses returned by the API.",
                "# TYPE rentguy_request_error_total counter",
            ]
        )

        for (method, path), value in sorted(snapshot["error_counts"].items()):
            lines.append(f'rentguy_request_error_total{{method="{method}",path="{path}"}} {value}')

        lines.extend(
            [
                "# HELP rentguy_request_latency_seconds_sum Cumulative latency per method/path.",
                "# TYPE rentguy_request_latency_seconds_sum gauge",
            ]
        )

        for (method, path), value in sorted(snapshot["per_path_latency"].items()):
            lines.append(f'rentguy_request_latency_seconds_sum{{method="{method}",path="{path}"}} {value}')

        lines.extend(
            [
                "# HELP rentguy_service_uptime_seconds Seconds since the API process started.",
                "# TYPE rentguy_service_uptime_seconds gauge",
                f'rentguy_service_uptime_seconds {snapshot["uptime_seconds"]}',
                "# HELP rentguy_service_availability_ratio Calculated availability excluding 5xx responses.",
                "# TYPE rentguy_service_availability_ratio gauge",
                f'rentguy_service_availability_ratio {snapshot["availability"]}',
                "# HELP rentguy_request_latency_seconds_average Rolling average latency across all requests.",
                "# TYPE rentguy_request_latency_seconds_average gauge",
                f'rentguy_request_latency_seconds_average {snapshot["average_latency_seconds"]}',
            ]
        )

        return "\n".join(lines) + "\n"

