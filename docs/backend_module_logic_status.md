# Backend Module Logic Status

This inventory verifies whether the newly introduced backend modules ship working FastAPI logic or still rely on placeholders. Each entry references the primary router or model implementation that is supposed to expose production behaviour.

## Module Summary

| Module | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Customer Portal | ✅ Implemented | Routes depend on the shared auth deps and return customer-specific data models.【F:backend/app/modules/customer_portal/routes.py†L1-L104】 | Fully wired to the synchronous session stack. |
| Recurring Invoices | ✅ Implemented | Router validates cron schedules, persists invoices, and exposes trigger + log endpoints.【F:backend/app/modules/recurring_invoices/routes.py†L1-L155】 | Works with existing `get_db` dependency. |
| Job Board | ✅ Implemented (Batch 1) | Models attach to `app.core.db.Base`, routes enforce role checks and emit notifications via a synchronous service.【F:backend/app/modules/jobboard/models.py†L1-L53】【F:backend/app/modules/jobboard/routes.py†L1-L134】【F:backend/app/modules/jobboard/notifications.py†L1-L44】 | Batch 1 delivered in this change. |
| Booking Engine | ⚠️ Missing integration | Router imports `app.core.database` and async dependencies that do not exist in the project, so the endpoints cannot start.【F:backend/app/modules/booking/routes.py†L1-L120】 | Requires conversion to the synchronous database stack. |
| Barcode/QR Scanning | ⚠️ Missing integration | Router references `auth.auth_store`, `database.database`, and standalone models that are absent from the repo.【F:backend/app/modules/scanning/routes.py†L1-L112】 | Needs rewritten dependencies plus validator wiring. |
| Sub-renting | ⚠️ Missing integration | Models and routes import `app.database` helpers that are not defined anywhere in the backend package.【F:backend/app/modules/subrenting/models.py†L1-L40】【F:backend/app/modules/subrenting/routes.py†L1-L80】 | Requires schema alignment with existing auth and inventory tables. |

## Batch Plan

- [x] **Batch 1 – Restore job board logic**: Replace placeholder imports with shared auth/db deps, rebuild SQLAlchemy models, and expose synchronous FastAPI routes with notification stubs. *(Completed in this work.)*
- [ ] **Batch 2 – Rebuild booking engine**: Align models with `app.core.db.Base`, swap async dependencies for `Session`, and port availability/payment helpers.
- [ ] **Batch 3 – Rebuild scanning service**: Replace nonexistent scanner dependencies with warehouse models, harden geo validation, and surface history queries via the shared database session.
- [ ] **Batch 4 – Rebuild sub-renting module**: Point partner models at `auth_users`, normalise geometry handling, and introduce repository helpers to encapsulate partner syncing.

