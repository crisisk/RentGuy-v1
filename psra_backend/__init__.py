from __future__ import annotations

from importlib import import_module
from typing import TYPE_CHECKING, Any

__all__ = [
    "AuditService",
    "LogActionPayload",
]

_LAZY_ATTRS: dict[str, str] = {
    "AuditService": "psra_backend.audit.service:AuditService",
    "LogActionPayload": "psra_backend.audit.models:LogActionPayload",
}


def __getattr__(name: str) -> Any:
    try:
        target = _LAZY_ATTRS[name]
    except KeyError as exc:  # pragma: no cover - guard for unexpected attrs
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}") from exc

    module_name, attr_name = target.split(":", 1)
    module = import_module(module_name)
    value = getattr(module, attr_name)
    globals()[name] = value
    return value


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(_LAZY_ATTRS))


if TYPE_CHECKING:  # pragma: no cover - for static analyzers only
    from psra_backend.audit.models import LogActionPayload
    from psra_backend.audit.service import AuditService
