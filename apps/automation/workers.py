"""Async worker utilities for CRM automations."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .engine import WorkflowEngine, default_engine


@dataclass(slots=True)
class WorkerConfig:
    concurrency: int = 2
    queue_maxsize: int = 1000


@dataclass
class AutomationEvent:
    workflow_id: str
    payload: dict[str, Any]
    enqueued_at: datetime = field(default_factory=datetime.utcnow)


class AutomationWorker:
    """Simple asyncio based worker that delegates execution to a WorkflowEngine."""

    def __init__(
        self,
        engine: WorkflowEngine | None = None,
        config: WorkerConfig | None = None,
        loop: asyncio.AbstractEventLoop | None = None,
    ) -> None:
        self.engine = engine or default_engine
        self.config = config or WorkerConfig()
        self.loop = loop or asyncio.get_event_loop()
        self._queue: asyncio.Queue[AutomationEvent] = asyncio.Queue(maxsize=self.config.queue_maxsize)
        self._tasks: list[asyncio.Task[None]] = []
        self._running = False

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for _ in range(self.config.concurrency):
            task = self.loop.create_task(self._worker())
            self._tasks.append(task)

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        for _ in self._tasks:
            await self._queue.put(AutomationEvent("__shutdown__", {}))
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    async def enqueue(self, workflow_id: str, payload: dict[str, Any]) -> None:
        event = AutomationEvent(workflow_id=workflow_id, payload=payload)
        await self._queue.put(event)

    async def drain(self) -> None:
        await self._queue.join()

    async def _worker(self) -> None:
        while True:
            event = await self._queue.get()
            try:
                if event.workflow_id == "__shutdown__":
                    break
                self.engine.trigger(event.workflow_id, event.payload)
            finally:
                self._queue.task_done()

    # Convenience API for synchronous contexts ---------------------------
    def enqueue_sync(self, workflow_id: str, payload: dict[str, Any]) -> None:
        asyncio.run(self.enqueue(workflow_id, payload))
