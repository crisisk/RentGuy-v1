#!/usr/bin/env python3
"""Utility to detect frontend route and component metadata for RentGuy apps."""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set

REPO_ROOT = Path(__file__).resolve().parents[3]


@dataclass
class FrontendConfig:
    key: str
    label: str
    expected_paths: List[Path]
    description: str


COMPONENT_DECL_RE = re.compile(
    r"^(?:export\s+(?:default\s+)?)?(?:(?:async\s+)?function|const|class)\s+([A-Z][A-Za-z0-9_]*)"
)
EXPORT_RE = re.compile(r"^export\s+(?:default\s+)?([A-Z][A-Za-z0-9_]*)")
EXPORT_DECL_RE = re.compile(
    r"^export\s+(?:default\s+)?(?:(?:async\s+)?function|const|class)\s+([A-Z][A-Za-z0-9_]*)"
)
EXPORT_LIST_RE = re.compile(r"export\s+\{([^}]+)\}")
ROUTE_RE = re.compile(r"path\s*[:=]\s*['\"]([^'\"]+)['\"]")
ROUTE_COMPONENT_RE = re.compile(r"<Route[^>]*?path=['\"]([^'\"]+)['\"]")
DATA_TESTID_RE = re.compile(r"data-testid\s*=\s*['\"]([^'\"]+)['\"]")


SKIP_DIRS = {"node_modules", "dist", "build", ".next", "coverage", "out"}


@dataclass
class FrontendReport:
    config: FrontendConfig
    status: str
    root: Optional[Path] = None
    missing_paths: List[Path] = field(default_factory=list)
    components: Set[str] = field(default_factory=set)
    exported_components: Set[str] = field(default_factory=set)
    routes: Set[str] = field(default_factory=set)
    data_testids: Set[str] = field(default_factory=set)
    files_missing_testids: Set[Path] = field(default_factory=set)
    lighthouse_routes: Set[str] = field(default_factory=set)
    files_scanned: int = 0

    def to_dict(self) -> Dict[str, object]:
        return {
            "key": self.config.key,
            "label": self.config.label,
            "status": self.status,
            "description": self.config.description,
            "root": str(self.root.relative_to(REPO_ROOT)) if self.root else None,
            "missing_paths": [str(p.relative_to(REPO_ROOT)) for p in self.missing_paths],
            "files_scanned": self.files_scanned,
            "components": sorted(self.components),
            "exported_components": sorted(self.exported_components),
            "routes": sorted(self.routes),
            "data_testids": sorted(self.data_testids),
            "files_missing_testids": [
                str(path.relative_to(REPO_ROOT)) for path in sorted(self.files_missing_testids)
            ],
            "lighthouse_routes": sorted(self.lighthouse_routes),
        }


def iter_source_files(root: Path) -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if "__tests__" in Path(dirpath).parts:
            continue
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() not in {".jsx", ".tsx", ".js", ".ts"}:
                continue
            if path.name.endswith(('.test.tsx', '.test.ts', '.spec.tsx', '.spec.ts')):
                continue
            yield path


def parse_component_names(lines: Iterable[str]) -> Set[str]:
    names: Set[str] = set()
    for line in lines:
        match = COMPONENT_DECL_RE.search(line.strip())
        if match:
            names.add(match.group(1))
    return names


def parse_exports(lines: Iterable[str], component_names: Set[str]) -> Set[str]:
    exported: Set[str] = set()
    joined = "\n".join(lines)
    for raw_line in lines:
        line = raw_line.strip()
        decl_match = EXPORT_DECL_RE.match(line)
        if decl_match:
            exported.add(decl_match.group(1))
            continue
        match = EXPORT_RE.match(line)
        if match:
            name = match.group(1)
            exported.add(name)
            continue
        list_match = EXPORT_LIST_RE.search(line)
        if list_match:
            for name in (item.strip() for item in list_match.group(1).split(",")):
                if name and not name.startswith("*"):
                    exported.add(name)
    # consider default exports defined earlier
    for name in component_names:
        if f"export default {name}" in joined or f"export default function {name}" in joined:
            exported.add(name)
    return exported


def parse_routes(lines: Iterable[str]) -> Set[str]:
    routes: Set[str] = set()
    joined = "\n".join(lines)
    routes.update(ROUTE_RE.findall(joined))
    routes.update(ROUTE_COMPONENT_RE.findall(joined))
    cleaned = {route.strip() for route in routes if route.strip()}
    return cleaned


def parse_data_testids(lines: Iterable[str]) -> Set[str]:
    joined = "\n".join(lines)
    return {match for match in DATA_TESTID_RE.findall(joined)}


def analyze_frontend(config: FrontendConfig) -> FrontendReport:
    resolved_paths = [REPO_ROOT / path for path in config.expected_paths]
    existing = [path for path in resolved_paths if path.exists()]
    missing = [path for path in resolved_paths if not path.exists()]

    if not existing:
        return FrontendReport(config=config, status="missing", missing_paths=missing)

    root = existing[0]
    report = FrontendReport(
        config=config, status="found", root=root, missing_paths=missing
    )

    for file_path in iter_source_files(root):
        report.files_scanned += 1
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        lines = text.splitlines()
        component_names = parse_component_names(lines)
        report.components.update(component_names)
        report.exported_components.update(parse_exports(lines, component_names))
        detected_routes = parse_routes(lines)
        report.routes.update(detected_routes)
        data_testids = parse_data_testids(lines)
        if component_names and not data_testids:
            report.files_missing_testids.add(file_path)
        report.data_testids.update(data_testids)
        for route in detected_routes:
            normalized = route if route.startswith("/") else f"/{route.lstrip('/')}"
            if normalized not in {"/*", "*"}:
                report.lighthouse_routes.add(normalized)

    return report


def build_frontend_configs() -> List[FrontendConfig]:
    return [
        FrontendConfig(
            key="app",
            label="Backoffice Operations App",
            expected_paths=[Path("apps/web"), Path("app")],
            description="Primary internal operations cockpit used by Renske and team.",
        ),
        FrontendConfig(
            key="portal",
            label="Client Booking Portal",
            expected_paths=[Path("apps/portal"), Path("portal")],
            description="Customer-facing booking and payment portal for Lisa.",
        ),
        FrontendConfig(
            key="crew",
            label="Crew PWA Scanner",
            expected_paths=[Path("apps/pwa-scanner"), Path("crew")],
            description="Mobile-first PWA for warehouse and crew flows (Wouter & Said).",
        ),
    ]


def render_markdown(frontends: List[FrontendReport]) -> str:
    lines = ["# Frontend Route & Component Inventory", ""]
    lines.append(
        f"_Generated: {datetime.now(timezone.utc).isoformat()} · Source repo: {REPO_ROOT.name}_"
    )
    lines.append("")
    for report in frontends:
        lines.append(f"## {report.config.label} (`{report.config.key}`)")
        lines.append("")
        lines.append(f"Status: **{report.status.upper()}**")
        if report.root:
            lines.append(f"Root: `{report.root.relative_to(REPO_ROOT)}`")
        if report.missing_paths:
            missing = ", ".join(f"`{p.relative_to(REPO_ROOT)}`" for p in report.missing_paths)
            lines.append(f"Missing expected paths: {missing}")
        lines.append("")
        if report.status != "found":
            lines.append("No files scanned.")
            lines.append("")
            continue
        lines.append(f"Files scanned: {report.files_scanned}")
        lines.append("")
        components = sorted(report.components)
        exported = sorted(report.exported_components)
        routes = sorted(report.routes)
        lines.append("### Components detected")
        if components:
            for name in components:
                marker = " (exported)" if name in exported else ""
                lines.append(f"- `{name}`{marker}")
        else:
            lines.append("- _No component declarations detected_")
        lines.append("")
        lines.append("### Routes detected")
        if routes:
            for route in routes:
                lines.append(f"- `{route}`")
        else:
            lines.append("- _No route patterns detected_")
        lines.append("")
        lines.append("### data-testid coverage")
        if report.data_testids:
            lines.append(
                f"- Total unique `data-testid`: **{len(report.data_testids)}**"
            )
        else:
            lines.append("- _No `data-testid` attributes detected_")
        if report.files_missing_testids:
            lines.append("- Files with components but missing `data-testid` usage:")
            for path in sorted(report.files_missing_testids):
                lines.append(f"  - `{path.relative_to(REPO_ROOT)}`")
        lines.append("")
        if report.lighthouse_routes:
            lines.append("### Recommended Lighthouse routes")
            for route in sorted(report.lighthouse_routes):
                lines.append(f"- `{route}`")
            lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-json",
        default=REPO_ROOT / "tests/ux-retention/reports/frontend_map.json",
        type=Path,
        help="Destination for JSON summary",
    )
    parser.add_argument(
        "--output-md",
        default=REPO_ROOT / "tests/ux-retention/reports/frontend_map.md",
        type=Path,
        help="Destination for Markdown summary",
    )
    args = parser.parse_args()

    frontends = [analyze_frontend(config) for config in build_frontend_configs()]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "frontends": [report.to_dict() for report in frontends],
    }

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    markdown = render_markdown(frontends)
    args.output_md.write_text(markdown + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
