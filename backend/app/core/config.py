from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENV: str = "dev"
    DATABASE_URL: str = "postgresql+psycopg://rentguy:rentguy@db:5432/rentguy"
    JWT_SECRET: str = "change_me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    INVENTORY_ADAPTER: str = "inprocess"  # or "http"
    INVENTORY_SERVICE_URL: str = "http://inventory:8000"
    FEATURE_TRANSPORT: bool = True
    FEATURE_PAYMENTS: bool = True
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
    INVOICE_NINJA_URL: str | None = None
    INVOICE_NINJA_TOKEN: str | None = None
    PAYMENT_WEBHOOK_BASE_URL: str | None = None
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_EXPORTER_OTLP_HEADERS: str | None = None
    OTEL_SERVICE_NAME: str = "rentguy-api"

settings = Settings()
