"""Domain services for the secrets dashboard."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from .crypto import SecretDecryptionError, build_hint, decrypt_value, encrypt_value
from .models import PlatformSecret
from .repo import PlatformSecretRepo
from .schemas import EmailDiagnosticsResponse, SecretOut, SecretSyncResponse

REPO_ROOT = Path(__file__).resolve().parents[5]
DEFAULT_ENV_PATH = REPO_ROOT / ".env.secrets"


@dataclass(frozen=True)
class SecretDefinition:
    key: str
    label: str
    category: str
    description: str
    is_sensitive: bool = True
    requires_restart: bool = False


DEFAULT_SECRET_DEFINITIONS: tuple[SecretDefinition, ...] = (
    SecretDefinition(
        key="DATABASE_URL",
        label="Database connectiestring",
        category="core",
        description="SQLAlchemy-compatibele URL voor de primaire RentGuy database.",
        requires_restart=True,
    ),
    SecretDefinition(
        key="JWT_SECRET",
        label="JWT signing secret",
        category="core",
        description="Wordt gebruikt om toegangstokens te ondertekenen en moet sterk & uniek zijn.",
        requires_restart=True,
    ),
    SecretDefinition(
        key="SMTP_HOST",
        label="SMTP host",
        category="email",
        description="Hostname of IP-adres van de mailserver voor notificaties en planners.",
    ),
    SecretDefinition(
        key="SMTP_PORT",
        label="SMTP poort",
        category="email",
        description="Poort waarop de mailserver bereikbaar is (bijv. 587).",
        is_sensitive=False,
    ),
    SecretDefinition(
        key="SMTP_USER",
        label="SMTP gebruikersnaam",
        category="email",
        description="Inlognaam voor geauthenticeerde mailverbindingen.",
    ),
    SecretDefinition(
        key="SMTP_PASS",
        label="SMTP wachtwoord",
        category="email",
        description="Wachtwoord of app-specifieke sleutel voor de mailserver.",
    ),
    SecretDefinition(
        key="MAIL_FROM",
        label="Afzenderadres",
        category="email",
        description="E-mailadres dat als afzender wordt gebruikt in uitgaande berichten.",
        is_sensitive=False,
    ),
    SecretDefinition(
        key="STRIPE_API_KEY",
        label="Stripe API key",
        category="payments",
        description="Secret key voor de Stripe API-integratie.",
    ),
    SecretDefinition(
        key="STRIPE_WEBHOOK_SECRET",
        label="Stripe webhook secret",
        category="payments",
        description="Verificatiesleutel voor Stripe-webhooks.",
    ),
    SecretDefinition(
        key="MOLLIE_API_KEY",
        label="Mollie API key",
        category="payments",
        description="API-sleutel voor Mollie betalingen.",
    ),
    SecretDefinition(
        key="MOLLIE_WEBHOOK_SECRET",
        label="Mollie webhook secret",
        category="payments",
        description="Verificatiesleutel voor Mollie-webhooks.",
    ),
    SecretDefinition(
        key="INVOICE_NINJA_URL",
        label="Invoice Ninja URL",
        category="integrations",
        description="Basis-URL van de Invoice Ninja instance voor facturatie.",
        is_sensitive=False,
    ),
    SecretDefinition(
        key="INVOICE_NINJA_TOKEN",
        label="Invoice Ninja token",
        category="integrations",
        description="Authenticatietoken voor de Invoice Ninja API.",
    ),
    SecretDefinition(
        key="PAYMENT_WEBHOOK_BASE_URL",
        label="Webhook base URL",
        category="integrations",
        description="Publieke basis-URL voor betalingswebhooks richting RentGuy.",
        is_sensitive=False,
    ),
    SecretDefinition(
        key="OTEL_EXPORTER_OTLP_ENDPOINT",
        label="OTLP endpoint",
        category="observability",
        description="Endpoint voor het versturen van OpenTelemetry-traces.",
        is_sensitive=False,
    ),
    SecretDefinition(
        key="OTEL_EXPORTER_OTLP_HEADERS",
        label="OTLP headers",
        category="observability",
        description="Authenticatie- of configuratieheaders voor de OTLP-exporter.",
    ),
)

DEFAULT_SECRET_LOOKUP = {definition.key: definition for definition in DEFAULT_SECRET_DEFINITIONS}


class PlatformSecretService:
    """High level operations for the secrets dashboard."""

    def __init__(self, repo: PlatformSecretRepo, env_path: Path | None = None) -> None:
        self.repo = repo
        self.env_path = env_path or DEFAULT_ENV_PATH

    # ------------------------------------------------------------------
    # CRUD helpers
    # ------------------------------------------------------------------
    def ensure_defaults(self) -> None:
        """Insert default definitions for each known secret when absent."""

        payload: list[tuple[str, dict]] = []
        for definition in DEFAULT_SECRET_DEFINITIONS:
            payload.append(
                (
                    definition.key,
                    {
                        "label": definition.label,
                        "category": definition.category,
                        "description": definition.description,
                        "is_sensitive": definition.is_sensitive,
                        "requires_restart": definition.requires_restart,
                    },
                )
            )
        self.repo.bulk_upsert(payload)
        self.repo.session.flush()

    def list_secrets(self) -> list[SecretOut]:
        """Return all managed secrets, bootstrapping defaults on first use."""

        self.ensure_defaults()
        return [self._to_out(secret) for secret in self.repo.list()]

    def update_secret(self, key: str, value: str | None) -> SecretOut:
        """Store a new value for the given secret."""

        definition = self._definition_for(key)
        secret = self.repo.upsert(
            key,
            label=definition.label,
            category=definition.category,
            description=definition.description,
            is_sensitive=definition.is_sensitive,
            requires_restart=definition.requires_restart,
        )

        normalised = (value or "").strip()
        if normalised:
            secret.value_encrypted = encrypt_value(normalised)
            secret.value_hint = normalised if not definition.is_sensitive else build_hint(normalised)
        else:
            secret.value_encrypted = None
            secret.value_hint = None
        self.repo.session.flush()
        return self._to_out(secret)

    # ------------------------------------------------------------------
    # Synchronisation & diagnostics
    # ------------------------------------------------------------------
    def sync_to_env(self, env_path: Path | None = None) -> SecretSyncResponse:
        """Write the current secret set to an .env-style file."""

        target = env_path or self.env_path
        target.parent.mkdir(parents=True, exist_ok=True)

        now = datetime.utcnow()
        applied = 0
        requires_restart = False

        lines = [
            "# File generated by the RentGuy secrets dashboard.",
            f"# Last synced at {now.isoformat()}",
            "",
        ]

        for secret in self.repo.list():
            raw = self._decrypt_value(secret)
            if raw is None:
                continue
            applied += 1
            if secret.requires_restart:
                requires_restart = True
            lines.append(f"{secret.key}={self._format_env_value(raw)}")
            secret.mark_synced(now)

        contents = "\n".join(lines).rstrip() + "\n"
        tmp_path = target.with_name(target.name + ".tmp")
        tmp_path.write_text(contents, encoding="utf-8")
        tmp_path.replace(target)
        self.repo.session.flush()

        return SecretSyncResponse(
            applied=applied,
            env_path=str(target),
            triggered_restart=requires_restart,
            timestamp=now,
        )

    def email_diagnostics(self) -> EmailDiagnosticsResponse:
        """Summarise the e-mail configuration coverage."""

        self.ensure_defaults()
        lookup = {secret.key: self._decrypt_value(secret) for secret in self.repo.list()}

        host = (lookup.get("SMTP_HOST") or "").strip()
        port = (lookup.get("SMTP_PORT") or "").strip()
        mail_from = (lookup.get("MAIL_FROM") or "").strip()
        user = (lookup.get("SMTP_USER") or "").strip()
        password = (lookup.get("SMTP_PASS") or "").strip()

        missing = [key for key in ("SMTP_HOST", "SMTP_PORT", "MAIL_FROM") if not (lookup.get(key) or "").strip()]
        configured = sorted([key for key, value in lookup.items() if (value or "").strip()])
        auth_configured = bool(user and password)
        node_ready = bool(host and port and mail_from)

        if node_ready:
            status = "ok"
            message = "SMTP-configuratie is compleet en klaar voor Express/React e-mailintegraties."
        elif host or port or mail_from:
            status = "warning"
            message = "SMTP-configuratie is gedeeltelijk ingevuld. Vul ontbrekende waarden aan om e-mail te activeren."
        else:
            status = "error"
            message = "SMTP-configuratie ontbreekt. Vul host, poort en afzenderadres in om e-mail te versturen."

        return EmailDiagnosticsResponse(
            status=status,
            message=message,
            missing=missing,
            configured=configured,
            node_ready=node_ready,
            auth_configured=auth_configured,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _to_out(self, secret: PlatformSecret) -> SecretOut:
        return SecretOut(
            key=secret.key,
            label=secret.label,
            category=secret.category,
            description=secret.description,
            is_sensitive=secret.is_sensitive,
            requires_restart=secret.requires_restart,
            has_value=secret.value_encrypted is not None,
            value_hint=secret.value_hint,
            updated_at=secret.updated_at,
            last_synced_at=secret.last_synced_at,
        )

    def _definition_for(self, key: str) -> SecretDefinition:
        if key in DEFAULT_SECRET_LOOKUP:
            return DEFAULT_SECRET_LOOKUP[key]
        return SecretDefinition(
            key=key,
            label=key,
            category="custom",
            description="Aangepaste configuratiewaarde toegevoegd via het dashboard.",
        )

    def _decrypt_value(self, secret: PlatformSecret) -> str | None:
        if not secret.value_encrypted:
            return None
        try:
            return decrypt_value(secret.value_encrypted)
        except SecretDecryptionError:
            return None

    @staticmethod
    def _format_env_value(value: str) -> str:
        if value == "":
            return '""'
        if any(char in value for char in " \t#\n\r\""):
            escaped = value.replace("\\", "\\\\").replace('"', '\\"')
            return f'"{escaped}"'
        return value
