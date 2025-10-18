# OTLP Span Catalog

| Endpoint | Span name | Attributes | Notes |
| --- | --- | --- | --- |
| `GET /api/v1/billing/invoices` | `GET /billing/invoices` | `http.method`, `http.route`, `http.status_code`, `net.peer.ip` | Baseline span die elke lijstcall registreert. |
| `POST /api/v1/billing/payments/stripe/checkout` | `POST /billing/payments/stripe/checkout` | `billing.invoice_id`, `billing.provider`, `enduser.id` | Span omvat request naar Stripe API met event `stripe.checkout`. |
| `POST /api/v1/warehouse/scan` | `POST /warehouse/scan` | `warehouse.tag_value`, `warehouse.bundle_mode`, `warehouse.bundle_id`, `warehouse.direction` | Belangrijk voor tracing van offline wachtrij retries. |
| `GET /api/v1/reporting/margins` | `GET /reporting/margins` | `reporting.projects_returned` | Wordt gebruikt in Grafana voor BI latency. |
| `POST /api/v1/billing/payments/mollie/webhook` | `POST /billing/payments/mollie/webhook` | `billing.provider`, `billing.payment_id`, `http.status_code` | Alert bij signature mismatch (span status = ERROR). |

De tracer wordt automatisch geconfigureerd via `configure_tracing` in `app/core/observability.py`. Zet `OTEL_EXPORTER_OTLP_ENDPOINT` en optioneel `OTEL_EXPORTER_OTLP_HEADERS` (bijv. `Authorization=Bearer token`) in de omgeving om export naar Grafana Cloud of Tempo te activeren.
