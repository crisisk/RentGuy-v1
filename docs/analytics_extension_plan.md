# Analytics Extension Plan for Executive BI Dashboards

## Objectives

- Deliver executive-ready dashboards tracking revenue, utilisation, and customer health.
- Standardise event taxonomy across frontend and backend interactions.
- Enable automated weekly reporting with actionable alerts.

## Key KPIs

| Category         | Metric                                                   | Data Source                           |
| ---------------- | -------------------------------------------------------- | ------------------------------------- |
| Revenue          | Monthly Recurring Revenue (MRR), Invoice Collection Rate | Billing module, finance integrations  |
| Operations       | Equipment utilisation %, On-time transport departures    | Inventory module, transport telemetry |
| Customer Success | Net Promoter Score (NPS), Ticket resolution time         | CRM module, support tooling           |
| Growth           | Qualified leads, Conversion rate per channel             | Marketing site, CRM analytics exports |

## Data Pipeline Enhancements

1. **Event Tracking:**
   - Instrument key UI flows using Segment (frontend) and FastAPI middleware (backend) with consistent event names.
   - Capture metadata for project IDs, tenant IDs, and booking values to enable drill-down filters.
2. **Warehouse Telemetry:**
   - Extend scanning module to emit `scan.completed` and `scan.exception` events with equipment status deltas.
3. **Data Lake:**
   - Land raw events in an S3-compatible object store, partitioned by day and tenant.
   - Use dbt to model aggregate tables feeding dashboards.

## Tooling Stack

- **Warehouse:** Snowflake or BigQuery (depending on existing contracts) with dbt Core for transformations.
- **Dashboarding:** Looker Studio for lightweight needs, migrating to Power BI for enterprise deployments.
- **Orchestration:** Prefect 3.0 flows triggered hourly for event ingestion and nightly for KPI aggregation.

## Delivery Roadmap

| Phase          | Duration | Deliverables                                                       |
| -------------- | -------- | ------------------------------------------------------------------ |
| Foundation     | 3 weeks  | Event taxonomy, Segment workspace, initial dbt models              |
| MVP Dashboards | 4 weeks  | Finance, operations, and customer health dashboards with live data |
| Automation     | 2 weeks  | Prefect deployment, Slack alerting for SLA breaches                |
| Optimisation   | 3 weeks  | Advanced cohort analysis, anomaly detection rules                  |

## Governance & Compliance

- Implement data retention policies aligning with GDPR and Dutch tax requirements (7-year invoice history).
- Enforce role-based access to BI datasets using existing RBAC roles from the platform.
- Schedule quarterly data quality reviews with finance and operations stakeholders.

## Frontend event contract

### Eventnaam

- Gebruik het patroon `rentguy.<domein>.<actie>` zodat dashboards eenvoudig kunnen filteren op module en gebeurtenis.
- Voorbeeld: `rentguy.onboarding.step_completed` of `rentguy.finance.invoice_sent`.

### Verplichte velden

| Veld             | Type              | Beschrijving                                                                   |
| ---------------- | ----------------- | ------------------------------------------------------------------------------ |
| `event`          | string            | Canonieke eventnaam volgens bovenstaand patroon.                               |
| `eventId`        | string            | Unieke identifier (UUID) voor deduplicatie in downstream pipelines.            |
| `timestamp`      | string (ISO-8601) | Tijdstip waarop het event in de frontend plaatsvindt.                          |
| `context.module` | string            | Naam van de UI-module die het event verstuurt (bijv. `onboarding`, `planner`). |

### Optionele velden

| Veld               | Type   | Beschrijving                                                                              |
| ------------------ | ------ | ----------------------------------------------------------------------------------------- |
| `context.tenantId` | string | Tenant of klant waarvoor de actie geldt.                                                  |
| `context.userId`   | string | Gebruiker die de actie uitvoert (indien beschikbaar en toegestaan door privacybeleid).    |
| `properties`       | object | Vrij veld voor domeinspecifieke attributen (bijv. stapcode, monetair bedrag, duur in ms). |

### Voorbeeldpayload via helper

```ts
track('rentguy.onboarding.step_completed', {
  context: {
    module: 'onboarding',
    tenantId: 'tenant-42',
    userId: 'user-91',
  },
  properties: {
    stepCode: 'kickoff',
    completionState: 'complete',
    durationMs: 8400,
  },
})
```

De helper borgt dat events veilig in `window.dataLayer` terechtkomen, buffered worden als de laag nog niet bestaat en dat de queue automatisch getrimd wordt zodat downstream tooling geen overflow ziet.
