#!/usr/bin/env python3
"""Generate environment variable metadata from ``backend/app/core/config.py``."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import Settings  # noqa: E402


def _write_output(data: str, output: Path | None) -> None:
    if output is None:
        sys.stdout.write(data)
        if not data.endswith("\n"):
            sys.stdout.write("\n")
        return

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(data, encoding="utf-8")


def _escape_cell(value: str) -> str:
    return value.replace("|", "\\|")


def _render_markdown(entries: Iterable[dict[str, object]]) -> str:
    header = "| Name | Required | Secret | Type | Default | Vault Path | Description | Aliases |\n"
    separator = "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
    lines = [header, separator]
    for entry in entries:
        default = str(entry.get("default", "")) if entry.get("default") is not None else ""
        vault = str(entry.get("vault_path", "")) if entry.get("vault_path") else ""
        description = str(entry.get("description", "")) if entry.get("description") else ""
        aliases = ", ".join(entry.get("aliases", [])) if entry.get("aliases") else ""
        line = "| {name} | {required} | {secret} | {type} | {default} | {vault} | {description} | {aliases} |\n".format(
            name=_escape_cell(str(entry["name"])),
            required="yes" if entry["required"] else "no",
            secret="yes" if entry["secret"] else "no",
            type=_escape_cell(str(entry.get("type", ""))),
            default=_escape_cell(default),
            vault=_escape_cell(vault),
            description=_escape_cell(description),
            aliases=_escape_cell(aliases),
        )
        lines.append(line)
    return "".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--format",
        choices=("json", "markdown"),
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional file path to write the generated metadata",
    )
    args = parser.parse_args()

    entries = [definition.to_dict() for definition in Settings.describe_environment()]
    if args.format == "json":
        payload = json.dumps(entries, indent=2, ensure_ascii=False) + "\n"
    else:
        payload = _render_markdown(entries)

    _write_output(payload, args.output)


if __name__ == "__main__":
    main()
