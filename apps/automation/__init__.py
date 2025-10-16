"""Utility package for defining and executing CRM automation flows."""

from .engine import WorkflowEngine, default_engine  # noqa: F401
from .workers import AutomationWorker, WorkerConfig  # noqa: F401

__all__ = ["WorkflowEngine", "default_engine", "AutomationWorker", "WorkerConfig"]
