from __future__ import annotations

from typing import Any, Callable, Iterable, Sequence, cast

from types import NoneType, UnionType

import base64
import hashlib
import json
from dataclasses import dataclass
from typing import get_args, get_origin

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_core import PydanticUndefined


@dataclass(frozen=True)
class EnvironmentVariableDefinition:
    """Metadata describing how a ``Settings`` field is sourced from the environment."""

    name: str
    type: str
    required: bool
    secret: bool
    description: str | None
    default: str | None
    aliases: tuple[str, ...]
    vault_path: str | None

    def to_dict(self) -> dict[str, Any]:
        """Return a serialisable representation suitable for JSON exports."""

        payload: dict[str, Any] = {
            "name": self.name,
            "type": self.type,
            "required": self.required,
            "secret": self.secret,
        }
        if self.description:
            payload["description"] = self.description
        if self.default is not None:
            payload["default"] = self.default
        if self.aliases:
            payload["aliases"] = list(self.aliases)
        if self.vault_path:
            payload["vault_path"] = self.vault_path
        return payload


def _annotation_to_string(annotation: Any) -> str:
    """Return a readable representation for a typing annotation."""

    if annotation in {None, NoneType}:
        return "None"

    origin = get_origin(annotation)
    if origin is None:
        if getattr(annotation, "__name__", None):
            return annotation.__name__
        return str(annotation)

    args = [_annotation_to_string(argument) for argument in get_args(annotation)]

    if origin in {list, tuple, set, frozenset}:
        inner = ", ".join(args) if args else "Any"
        return f"{origin.__name__}[{inner}]"
    if origin is dict:
        key, value = (args + ["Any", "Any"])[:2]
        return f"dict[{key}, {value}]"
    if origin in {UnionType, getattr(__import__("typing"), "Union", UnionType)}:
        return " | ".join(args) if args else "Any"
    if origin is Sequence:
        inner = ", ".join(args) if args else "Any"
        return f"Sequence[{inner}]"

    if getattr(origin, "__module__", "").startswith("typing"):
        inner = ", ".join(args) if args else "Any"
        name = getattr(origin, "_name", None) or origin.__qualname__
        return f"{name}[{inner}]"

    inner = ", ".join(args) if args else "Any"
    return f"{origin.__name__}[{inner}]"


def _is_secret_annotation(annotation: Any) -> bool:
    if annotation is SecretStr:
        return True
    origin = get_origin(annotation)
    if origin is None:
        return False
    return any(_is_secret_annotation(argument) for argument in get_args(annotation))


def _serialise_default(value: Any, *, redact: bool) -> str | None:
    if value is None or value is PydanticUndefined or redact:
        return None
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    try:
        return json.dumps(value)
    except TypeError:  # pragma: no cover - defensive fallback
        return str(value)


class Settings(BaseSettings):
    """Application configuration loaded from the environment."""

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", ".env.secrets"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = Field(default="dev", description="Deployment environment name")
    DATABASE_URL: str = Field(..., description="SQLAlchemy database URL")
    JWT_SECRET: SecretStr = Field(..., description="Secret used to sign JWT tokens")
    JWT_ALG: str = Field(default="HS512", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60, description="Expiration for access tokens in minutes"
    )
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24, description="Expiration for refresh tokens in minutes"
    )
    INVENTORY_ADAPTER: str = "inprocess"  # or "http"
    INVENTORY_SERVICE_URL: str = "http://inventory:8000"
    FEATURE_TRANSPORT: bool = True
    FEATURE_PAYMENTS: bool = True
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        description="List of allowed origins for CORS",
    )
    DB_POOL_SIZE: int = Field(default=5, description="SQLAlchemy connection pool size")
    DB_MAX_OVERFLOW: int = Field(
        default=10, description="Maximum overflow connections for the pool"
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30, description="Timeout for acquiring a connection from the pool"
    )
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = Field(default=None, json_schema_extra={"secret": True})
    MAIL_FROM: str = "no-reply@rentguy.local"
    STRIPE_API_KEY: str | None = Field(default=None, json_schema_extra={"secret": True})
    STRIPE_WEBHOOK_SECRET: str | None = Field(default=None, json_schema_extra={"secret": True})
    STRIPE_API_BASE: str = "https://api.stripe.com/v1"
    MOLLIE_API_KEY: str | None = Field(default=None, json_schema_extra={"secret": True})
    MOLLIE_WEBHOOK_SECRET: str | None = Field(default=None, json_schema_extra={"secret": True})
    MOLLIE_API_BASE: str = "https://api.mollie.com/v2"
    RENTGUY_FINANCE_URL: str | None = None
    RENTGUY_FINANCE_TOKEN: str | None = Field(default=None, json_schema_extra={"secret": True})
    LEGACY_INVOICE_NINJA_URL: str | None = Field(default=None, alias="INVOICE_NINJA_URL")
    LEGACY_INVOICE_NINJA_TOKEN: str | None = Field(
        default=None,
        alias="INVOICE_NINJA_TOKEN",
        json_schema_extra={"secret": True},
    )
    PAYMENT_WEBHOOK_BASE_URL: str | None = None
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_EXPORTER_OTLP_HEADERS: str | None = None
    OTEL_SERVICE_NAME: str = "rentguy-api"
    SETTINGS_CRYPTO_SECRET: SecretStr | None = Field(
        default=None,
        description="Optional secret used to encrypt values managed through the secrets dashboard.",
    )
    MRDJ_SSO_AUTHORITY: str | None = Field(
        default=None,
        description="Base authority URL for the Mr. DJ Azure AD B2C tenant",
    )
    MRDJ_SSO_CLIENT_ID: str | None = Field(
        default=None,
        description="OAuth client id configured for the marketing → platform SSO flow",
    )
    MRDJ_SSO_CLIENT_SECRET: SecretStr | None = Field(
        default=None,
        description="Optional client secret used when exchanging authorization codes",
    )
    MRDJ_SSO_REDIRECT_URI: str | None = Field(
        default=None,
        description="Redirect URI registered for the marketing site callback",
    )
    MRDJ_SSO_SCOPE: str = Field(
        default="openid offline_access profile email",
        description="Space separated scope list requested during the SSO handshake",
    )
    MRDJ_PLATFORM_REDIRECT_URL: str = Field(
        default="https://mr-dj.rentguy.nl/crm",
        description="Default URL the marketing site should forward to after login",
    )
    MRDJ_LEAD_CAPTURE_RATE_LIMIT: int = Field(
        default=10,
        description="Maximum lead capture submissions allowed per IP address within the window",
    )
    MRDJ_LEAD_CAPTURE_RATE_WINDOW_SECONDS: int = Field(
        default=300,
        description="Duration of the lead capture rate limit window in seconds",
    )
    MRDJ_LEAD_CAPTURE_CAPTCHA_ENDPOINT: str | None = Field(
        default=None,
        description="Verification endpoint for the marketing site captcha tokens",
    )
    MRDJ_LEAD_CAPTURE_CAPTCHA_SECRET: SecretStr | None = Field(
        default=None,
        description="Secret shared with the captcha verification service",
    )
    CRM_ANALYTICS_SOURCES: dict[str, dict[str, str]] = Field(
        default_factory=dict,
        description="Mapping of tenant ids to GA4/GTM configuration.",
    )
    CRM_ANALYTICS_LOOKBACK_DAYS: int = Field(
        default=30,
        description="Default lookback window when syncing blended analytics metrics.",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: str | Iterable[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return list(value)

    @field_validator("CRM_ANALYTICS_SOURCES", mode="before")
    @classmethod
    def _parse_analytics_sources(cls, value: object) -> dict[str, dict[str, str]]:
        if not value:
            return {}
        if isinstance(value, str):
            parsed = json.loads(value)
        else:
            parsed = value
        if not isinstance(parsed, dict):  # pragma: no cover - defensive guard
            raise ValueError("CRM_ANALYTICS_SOURCES must be a dictionary")
        return parsed

    @model_validator(mode="after")
    def _ensure_sensitive_configuration(self) -> "Settings":
        if self.ENV not in {"dev", "test"}:
            missing: list[str] = []
            if not self.DATABASE_URL:
                missing.append("DATABASE_URL")
            if not self.JWT_SECRET.get_secret_value():
                missing.append("JWT_SECRET")
            if missing:
                joined = ", ".join(missing)
                raise ValueError(
                    f"Missing critical configuration values for production: {joined}"
                )
        return self

    @model_validator(mode="after")
    def _backfill_legacy_finance_aliases(self) -> "Settings":
        if not self.RENTGUY_FINANCE_URL and self.LEGACY_INVOICE_NINJA_URL:
            object.__setattr__(self, "RENTGUY_FINANCE_URL", self.LEGACY_INVOICE_NINJA_URL)
        if not self.RENTGUY_FINANCE_TOKEN and self.LEGACY_INVOICE_NINJA_TOKEN:
            object.__setattr__(self, "RENTGUY_FINANCE_TOKEN", self.LEGACY_INVOICE_NINJA_TOKEN)
        return self

    @model_validator(mode="after")
    def _normalise_analytics_sources(self) -> "Settings":
        normalised: dict[str, dict[str, str]] = {}
        for tenant, config in self.CRM_ANALYTICS_SOURCES.items():
            if not isinstance(config, dict):
                continue
            tenant_key = str(tenant).lower()
            normalised[tenant_key] = config
        object.__setattr__(self, "CRM_ANALYTICS_SOURCES", normalised)
        return self

    @property
    def database_url(self) -> str:
        """Expose the raw database URL string."""

        return self.DATABASE_URL

    @property
    def jwt_secret(self) -> str:
        """Return the JWT secret value as a plain string."""

        return self.JWT_SECRET.get_secret_value()

    @property
    def secrets_encryption_key(self) -> bytes:
        """Return a 32-byte Fernet key derived from the configured secret."""

        if self.SETTINGS_CRYPTO_SECRET is not None:
            base_secret = self.SETTINGS_CRYPTO_SECRET.get_secret_value()
        else:
            base_secret = self.JWT_SECRET.get_secret_value()

        digest = hashlib.sha256(base_secret.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest)

    @classmethod
    def describe_environment(cls) -> list[EnvironmentVariableDefinition]:
        """Return metadata describing the settings expected from the environment."""

        definitions: list[EnvironmentVariableDefinition] = []
        for field_name, field in cls.model_fields.items():
            primary_name = cast(str, field.alias or field_name)
            aliases: list[str] = []
            if primary_name != field_name:
                aliases.append(field_name)

            validation_alias = getattr(field, "validation_alias", None)
            if validation_alias and validation_alias != primary_name:
                aliases.append(str(validation_alias))

            extra = field.json_schema_extra or {}
            secret = bool(extra.get("secret")) or _is_secret_annotation(field.annotation)

            if field.default_factory is not None:
                default_value = field.default_factory()
            else:
                default_value = field.default

            description = field.description or None
            vault_path = None
            if "vault_path" in extra:
                vault_path = str(extra["vault_path"])
            elif secret:
                vault_path = f"secret/rentguy/{primary_name.lower()}"

            definitions.append(
                EnvironmentVariableDefinition(
                    name=primary_name,
                    type=_annotation_to_string(field.annotation),
                    required=field.is_required(),
                    secret=secret,
                    description=description,
                    default=_serialise_default(default_value, redact=secret),
                    aliases=tuple(sorted(set(aliases))),
                    vault_path=vault_path,
                )
            )

        definitions.sort(key=lambda item: item.name)
        return definitions


class _SettingsProxy:
    """Lazy proxy that defers ``Settings`` instantiation until first use."""

    __slots__ = ("_factory", "_instance")

    def __init__(self, factory: Callable[[], Settings]) -> None:
        object.__setattr__(self, "_factory", factory)
        object.__setattr__(self, "_instance", None)

    def _get_instance(self) -> Settings:
        instance = object.__getattribute__(self, "_instance")
        if instance is None:
            factory = object.__getattribute__(self, "_factory")
            instance = factory()
            object.__setattr__(self, "_instance", instance)
        return instance

    def __getattr__(self, item: str) -> Any:
        return getattr(self._get_instance(), item)

    def __setattr__(self, key: str, value: Any) -> None:
        if key in {"_factory", "_instance"}:
            object.__setattr__(self, key, value)
        else:
            setattr(self._get_instance(), key, value)

    def __repr__(self) -> str:  # pragma: no cover - representation helper
        instance = object.__getattribute__(self, "_instance")
        if instance is None:
            return "<SettingsProxy (uninitialised)>"
        return repr(instance)

    def __call__(self) -> Settings:
        return self._get_instance()

    def reload(self) -> Settings:
        factory = object.__getattribute__(self, "_factory")
        instance = factory()
        object.__setattr__(self, "_instance", instance)
        return instance

    @property
    def loaded(self) -> bool:
        return object.__getattribute__(self, "_instance") is not None


def _settings_factory() -> Settings:
    return Settings()


settings = cast(Settings, _SettingsProxy(_settings_factory))
