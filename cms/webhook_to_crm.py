"""Process CMS webhook payloads and synchronise content templates for CRM."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class WebhookPayload:
    tenant: str
    block_id: str
    variant: str
    content: str
    metadata: dict[str, Any]

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "WebhookPayload":
        tenant = str(payload.get("tenant") or "mrdj").strip().lower()
        block = str(payload.get("block_id") or payload.get("id"))
        if not block:
            raise ValueError("Webhook payload missing block identifier")
        variant = str(payload.get("variant") or "default").strip().lower()
        content = str(payload.get("content") or "")
        metadata = dict(payload.get("metadata") or {})
        return cls(tenant=tenant, block_id=block, variant=variant, content=content, metadata=metadata)


class CMSWebhookProcessor:
    """Writes CMS blocks to the tenant template directory."""

    def __init__(self, templates_root: Path, secret: str | None = None) -> None:
        self.templates_root = templates_root
        self.secret = secret

    def _target_path(self, payload: WebhookPayload) -> Path:
        tenant_root = self.templates_root / payload.tenant
        tenant_root.mkdir(parents=True, exist_ok=True)
        filename = f"{payload.block_id}-{payload.variant}.md"
        return tenant_root / filename

    def _verify_signature(self, body: bytes, signature: str | None) -> None:
        if not self.secret:
            return
        if not signature:
            raise PermissionError("Missing webhook signature")
        digest = hmac.new(self.secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(digest, signature):
            raise PermissionError("Invalid webhook signature")

    def process(self, raw_body: bytes, signature: str | None = None) -> dict[str, Any]:
        self._verify_signature(raw_body, signature)
        payload_dict = json.loads(raw_body.decode("utf-8"))
        payload = WebhookPayload.from_dict(payload_dict)
        target = self._target_path(payload)
        envelope = {
            "generated_at": datetime.now(tz=timezone.utc).isoformat(),
            "source": payload.metadata.get("source", "cms"),
            "version": payload.metadata.get("version", "draft"),
        }
        target.write_text(payload.content, encoding="utf-8")
        meta_path = target.with_suffix(".json")
        meta_path.write_text(json.dumps(envelope, indent=2, sort_keys=True), encoding="utf-8")
        return {
            "tenant": payload.tenant,
            "block_id": payload.block_id,
            "variant": payload.variant,
            "template_path": str(target),
            "metadata_path": str(meta_path),
        }


def _default_templates_root() -> Path:
    return Path(__file__).resolve().parents[1] / "automation" / "templates"


def main() -> None:
    parser = argparse.ArgumentParser(description="Synchronise CMS blocks into the CRM template library")
    parser.add_argument("payload", type=Path, nargs="?", help="Path to the JSON payload file. Reads stdin when omitted.")
    parser.add_argument("--signature", help="Optional HMAC signature provided by the CMS")
    parser.add_argument(
        "--templates-root",
        type=Path,
        default=_default_templates_root(),
        help="Destination root directory for tenant templates",
    )
    parser.add_argument(
        "--secret",
        help="Override secret used to validate the webhook signature",
        default=os.getenv("MRDJ_CMS_WEBHOOK_SECRET"),
    )
    args = parser.parse_args()

    if args.payload:
        body = args.payload.read_bytes()
    else:
        body = os.read(0, 10_000_000)
        if not body:
            raise SystemExit("No webhook payload provided")

    processor = CMSWebhookProcessor(args.templates_root, secret=args.secret)
    result = processor.process(body, signature=args.signature)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
