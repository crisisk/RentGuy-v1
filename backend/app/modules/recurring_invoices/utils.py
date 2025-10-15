"""Utility helpers for cron-like scheduling without external dependencies."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Set

DAY_NAME_MAP = {
    "sun": 0,
    "mon": 1,
    "tue": 2,
    "wed": 3,
    "thu": 4,
    "fri": 5,
    "sat": 6,
}


class CronExpressionError(ValueError):
    """Raised when a cron expression cannot be parsed or evaluated."""


@dataclass(frozen=True)
class CronFields:
    minute: Optional[Set[int]]
    hour: Optional[Set[int]]
    day_of_month: Optional[Set[int]]
    month: Optional[Set[int]]
    day_of_week: Optional[Set[int]]

    @property
    def day_of_month_matches_any(self) -> bool:
        return self.day_of_month is None

    @property
    def day_of_week_matches_any(self) -> bool:
        return self.day_of_week is None


def _parse_value(token: str, minimum: int, maximum: int, allow_names: bool = False) -> int:
    token_lower = token.lower()
    if allow_names and token_lower in DAY_NAME_MAP:
        return DAY_NAME_MAP[token_lower]

    try:
        value = int(token)
    except ValueError as exc:  # pragma: no cover - validation guard
        raise CronExpressionError(f"Invalid value '{token}'") from exc

    if allow_names and value == 7:
        value = 0

    if not minimum <= value <= maximum:
        raise CronExpressionError(
            f"Value '{token}' out of bounds ({minimum}-{maximum})"
        )
    return value


def _expand_component(
    component: str,
    minimum: int,
    maximum: int,
    *,
    allow_names: bool = False,
) -> Optional[Set[int]]:
    component = component.strip()
    if component == "*":
        return None

    values: Set[int] = set()
    for part in component.split(","):
        part = part.strip()
        if not part:
            raise CronExpressionError("Empty cron component")

        step = 1
        if "/" in part:
            base, step_str = part.split("/", 1)
            if not step_str:
                raise CronExpressionError("Invalid step in cron component")
            step = int(step_str)
        else:
            base = part

        if base == "*":
            start = minimum
            end = maximum
        elif "-" in base:
            start_str, end_str = base.split("-", 1)
            start = _parse_value(start_str, minimum, maximum, allow_names)
            end = _parse_value(end_str, minimum, maximum, allow_names)
            if start > end:
                raise CronExpressionError("Start of range greater than end")
        else:
            value = _parse_value(base, minimum, maximum, allow_names)
            start = value
            end = value

        for current in range(start, end + 1, step):
            values.add(current)

    return values


def parse_cron_expression(expression: str) -> CronFields:
    parts = expression.split()
    if len(parts) != 5:
        raise CronExpressionError("Cron expression must have five parts")

    minute = _expand_component(parts[0], 0, 59)
    hour = _expand_component(parts[1], 0, 23)
    day_of_month = _expand_component(parts[2], 1, 31)
    month = _expand_component(parts[3], 1, 12)
    day_of_week = _expand_component(parts[4], 0, 6, allow_names=True)

    return CronFields(minute, hour, day_of_month, month, day_of_week)


def next_run_from_cron(expression: str, reference: datetime) -> datetime:
    fields = parse_cron_expression(expression)
    candidate = reference.replace(second=0, microsecond=0) + timedelta(minutes=1)

    # Search up to one year ahead which covers all practical cases for the app.
    for _ in range(525600):
        if not _value_matches(candidate.minute, fields.minute):
            candidate += timedelta(minutes=1)
            continue
        if not _value_matches(candidate.hour, fields.hour):
            candidate += timedelta(minutes=60)
            candidate = candidate.replace(minute=0)
            continue
        if not _value_matches(candidate.month, fields.month):
            candidate = (candidate.replace(day=1, hour=0, minute=0) + timedelta(days=32)).replace(day=1)
            continue

        dom_match = _value_matches(candidate.day, fields.day_of_month)
        dow_match = _value_matches(candidate.weekday(), fields.day_of_week)
        if fields.day_of_month_matches_any or fields.day_of_week_matches_any:
            if not (dom_match and dow_match):
                if not dom_match and not fields.day_of_month_matches_any:
                    candidate += timedelta(days=1)
                    candidate = candidate.replace(hour=0, minute=0)
                    continue
                if not dow_match and not fields.day_of_week_matches_any:
                    candidate += timedelta(days=1)
                    candidate = candidate.replace(hour=0, minute=0)
                    continue
        else:
            if not (dom_match or dow_match):
                candidate += timedelta(days=1)
                candidate = candidate.replace(hour=0, minute=0)
                continue

        return candidate

    raise CronExpressionError("Unable to compute next run within one year")


def _value_matches(value: int, allowed: Optional[Set[int]]) -> bool:
    return allowed is None or value in allowed


def is_valid_cron(expression: str) -> bool:
    try:
        parse_cron_expression(expression)
        return True
    except CronExpressionError:
        return False


__all__ = [
    "CronExpressionError",
    "CronFields",
    "is_valid_cron",
    "next_run_from_cron",
    "parse_cron_expression",
]
