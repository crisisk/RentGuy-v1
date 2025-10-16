from __future__ import annotations

from typing import Iterable

import base64
import hashlib
from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    SMTP_PASS: str | None = None
    MAIL_FROM: str = "no-reply@rentguy.local"
    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_API_BASE: str = "https://api.stripe.com/v1"
    MOLLIE_API_KEY: str | None = None
    MOLLIE_WEBHOOK_SECRET: str | None = None
    MOLLIE_API_BASE: str = "https://api.mollie.com/v2"
    RENTGUY_FINANCE_URL: str | None = None
    RENTGUY_FINANCE_TOKEN: str | None = None
    LEGACY_INVOICE_NINJA_URL: str | None = Field(default=None, alias="INVOICE_NINJA_URL")
    LEGACY_INVOICE_NINJA_TOKEN: str | None = Field(default=None, alias="INVOICE_NINJA_TOKEN")
    PAYMENT_WEBHOOK_BASE_URL: str | None = None
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_EXPORTER_OTLP_HEADERS: str | None = None
    OTEL_SERVICE_NAME: str = "rentguy-api"
    SETTINGS_CRYPTO_SECRET: SecretStr | None = Field(
        default=None,
        description="Optional secret used to encrypt values managed through the secrets dashboard.",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: str | Iterable[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return list(value)

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


settings = Settings()
