"""Simple workflow engine used for CRM automation flows."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict

try:
    import yaml
except ModuleNotFoundError as exc:  # pragma: no cover - dependency guard
    raise RuntimeError("PyYAML is required to use the automation engine") from exc


@dataclass
class RetryPolicy:
    max_attempts: int = 3
    initial_interval: float = 1.0
    backoff_factor: float = 2.0


@dataclass
class Workflow:
    id: str
    name: str
    description: str
    triggers: list[str]
    entrypoint: str
    retry_policy: RetryPolicy = field(default_factory=RetryPolicy)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class WorkflowRun:
    workflow_id: str
    run_id: str
    status: str
    attempts: int
    triggered_at: datetime
    completed_at: datetime | None
    context: dict[str, Any] | None


class WorkflowEngine:
    """Loads YAML-defined workflows and executes them with simple retry logic."""

    def __init__(self, sleep_fn: Callable[[float], None] | None = None) -> None:
        self._flows: Dict[str, Workflow] = {}
        self._sleep = sleep_fn or (lambda seconds: None)

    # Loading -------------------------------------------------------------
    def load_from_directory(self, path: Path) -> None:
        if not path.exists():
            return
        for file_path in path.glob("*.yaml"):
            with file_path.open("r", encoding="utf-8") as handle:
                raw = yaml.safe_load(handle) or {}
            flow = self._parse_flow(raw, file_path)
            self.register(flow)

    def register(self, flow: Workflow) -> None:
        self._flows[flow.id] = flow

    def get_active_flows(self) -> list[Workflow]:
        return list(self._flows.values())

    # Execution -----------------------------------------------------------
    def trigger(self, workflow_id: str, context: dict[str, Any] | None = None) -> WorkflowRun:
        if workflow_id not in self._flows:
            raise KeyError(f"Workflow '{workflow_id}' is not registered")

        flow = self._flows[workflow_id]
        retry = flow.retry_policy
        attempts = 0
        triggered_at = datetime.utcnow()
        last_error: Exception | None = None

        for attempt in range(1, retry.max_attempts + 1):
            attempts = attempt
            try:
                self._execute(flow, context or {})
                completed_at = datetime.utcnow()
                return WorkflowRun(
                    workflow_id=flow.id,
                    run_id=str(uuid.uuid4()),
                    status="completed",
                    attempts=attempts,
                    triggered_at=triggered_at,
                    completed_at=completed_at,
                    context=context,
                )
            except Exception as exc:  # pragma: no cover - safeguard
                last_error = exc
                if attempt >= retry.max_attempts:
                    break
                delay = retry.initial_interval * (retry.backoff_factor ** (attempt - 1))
                self._sleep(delay)

        raise RuntimeError(
            f"Workflow '{workflow_id}' failed after {attempts} attempts"
        ) from last_error

    # Internal helpers ----------------------------------------------------
    def _parse_flow(self, payload: dict[str, Any], file_path: Path) -> Workflow:
        retry = payload.get("retry", {})
        retry_policy = RetryPolicy(
            max_attempts=int(retry.get("max_attempts", 3)),
            initial_interval=float(retry.get("initial_interval", 1.0)),
            backoff_factor=float(retry.get("backoff_factor", 2.0)),
        )
        return Workflow(
            id=str(payload.get("id") or file_path.stem),
            name=str(payload.get("name", file_path.stem)),
            description=str(payload.get("description", "")),
            triggers=[str(value) for value in payload.get("triggers", [])],
            entrypoint=str(payload.get("entrypoint", "noop")),
            retry_policy=retry_policy,
            metadata=dict(payload.get("metadata", {})),
        )

    def _execute(self, flow: Workflow, context: dict[str, Any]) -> None:
        # In a real deployment this would call out to Temporal/n8n.
        # For tests we serialize the payload to ensure it is JSON safe.
        json.dumps({"flow": flow.id, "context": context})


def _default_engine() -> WorkflowEngine:
    engine = WorkflowEngine()
    root = Path(__file__).resolve().parents[2] / "automation" / "workflows"
    engine.load_from_directory(root)
    return engine


default_engine = _default_engine()
