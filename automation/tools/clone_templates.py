"""Clone automation workflow templates for a specific tenant."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

TEMPLATE_TOKEN_MAP = {
    "{{tenant}}": "tenant",
    "{{brand.primary_color}}": "brand_primary",
    "{{brand.logo_url}}": "brand_logo",
}


def _read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _apply_tokens(content: str, *, tenant: str, brand_primary: str | None, brand_logo: str | None) -> str:
    replacements = {
        "tenant": tenant,
        "brand_primary": brand_primary or "#FF3366",
        "brand_logo": brand_logo or "https://example.com/logo.png",
    }
    for token, key in TEMPLATE_TOKEN_MAP.items():
        content = content.replace(token, replacements[key])
    return content


def clone_templates(
    tenant: str,
    *,
    source_dir: Path,
    destination_dir: Path,
    brand_primary: str | None = None,
    brand_logo: str | None = None,
) -> list[Path]:
    copied: list[Path] = []
    for template in source_dir.glob("*.yaml"):
        content = _read_file(template)
        processed = _apply_tokens(
            content,
            tenant=tenant,
            brand_primary=brand_primary,
            brand_logo=brand_logo,
        )
        target = destination_dir / template.name
        _write_file(target, processed)
        copied.append(target)
    return copied


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clone CRM automation templates")
    parser.add_argument("--tenant", required=True, help="Tenant identifier")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "workflows",
        help="Directory with base templates",
    )
    parser.add_argument(
        "--destination",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "workflows" / "tenants",
        help="Directory to write tenant specific workflows",
    )
    parser.add_argument("--brand-primary", dest="brand_primary", help="Brand primary color")
    parser.add_argument("--brand-logo", dest="brand_logo", help="Brand logo URL")
    parser.add_argument("--dry-run", action="store_true", help="Only report files that would be created")
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> None:
    args = parse_args(argv)
    destination_root: Path = args.destination / args.tenant
    if args.dry_run:
        files = [p.name for p in args.source.glob("*.yaml")]
        print(f"Would clone {len(files)} templates for tenant '{args.tenant}': {', '.join(files)}")
        return

    copied = clone_templates(
        args.tenant,
        source_dir=args.source,
        destination_dir=destination_root,
        brand_primary=args.brand_primary,
        brand_logo=args.brand_logo,
    )
    print(f"Created {len(copied)} workflow templates for tenant '{args.tenant}' in {destination_root}")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
