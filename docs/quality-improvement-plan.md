# RentGuy Enterprise Platform – Quality Improvement Plan

## Stack & System Inventory
- **Frontend**: React 18 single-page application served through Vite (`src/main.tsx`, `App.jsx`, `Planner.jsx`). The entry point now boots through a validated env schema (`src/config/env.schema.ts`) but the core feature modules remain JavaScript with dynamic data flows and extensive localStorage usage.
- **Barcode Scanner Mode**: Alternative entry in `scanner.jsx` toggled via `VITE_APP_MODE`, relies on `@zxing/browser`.
- **Backend**: FastAPI service (`backend/app/main.py`) with modular routers (`app.modules.*`), SQLAlchemy 2.0 ORM, Alembic migrations, Redis/WebSocket realtime gateway, and adapters for payments, inventory, billing, and reporting.
- **Configuration**: Environment settings managed via Pydantic (`backend/app/core/config.py`) and a new runtime-validated schema for the frontend (`src/config/env.schema.ts`), reducing drift risks between clients.
- **Tooling**:
  - Node scripts: linting, formatting, dependency analysis, duplication detection, tests, and aggregate quality gate via `npm run quality:all` (`package.json`).
  - Python: pytest + coverage scaffolded (`backend/tests`), Ruff linting configured in `backend/pyproject.toml` but not wired into CI.
  - Quality artefacts already scaffolded (e.g., `scripts/quality-report.mjs`, `docs/QUALITY_SUMMARY.md`).
- **Infrastructure**: Docker Compose manifests for multi-service deployment, Postgres primary datastore, optional Stripe/Mollie integrations.

## Metric Baseline (Initial Observation)
| Metric | Current Signals | Gaps Preventing ≥95% |
| --- | --- | --- |
| Type Safety | TS strict config exists, but core UI is JavaScript (`App.jsx`, `Planner.jsx`, `Login.jsx`). Backend lacks mypy. | No typed DTOs, no shared contracts, unchecked axios usage, missing env typing for frontend. |
| Error Handling | Backend central `AppError` and metrics middleware exist (`backend/app/core/errors.py`, `backend/app/main.py`), but many routes raise raw exceptions; frontend lacks boundaries. | Missing standardized error mapping, structured logging, retry/backoff wrappers, client-side error surfaces. |
| Code Reusability | Domain logic split across numerous feature-specific modules but duplicated patterns exist (`Planner.jsx` persona config, backend adapters). | No shared utilities/components folder, ad-hoc helper functions, inconsistent DTO shapes. |
| Maintainability | ESLint/Prettier configured; backend main file orchestrates everything (160+ LOC). | Lack of dependency boundaries, mixed concerns in single files, inconsistent naming conventions, absence of architectural documentation. |
| Documentation | Many historical reports but little actionable onboarding or runbooks for current stack. | No up-to-date getting started, architecture diagram, or API reference aligned with latest routes. |
| Test Coverage | Vitest/Playwright scaffolding present; backend tests sparse. Coverage targets not enforced. | Few automated tests, no per-module coverage tracking, limited fixtures/mocks. |

## Workstream DAG
1. **Baseline Tooling Refresh** (Foundation)  → ensures scripts & CI targets are reproducible.
2. **Type Safety Pass** → migrate critical UI files to TypeScript, introduce shared Zod schemas, env typing, ts-prune hygiene.
3. **Error Handling & Observability Pass** → enforce `AppError`, add React error boundary, structured logging, retry/backoff.
4. **Reusability & Architecture Pass** → carve `src/{core,domain,infrastructure,ui}` modules, codemod imports, deduplicate logic.
5. **Maintainability & Quality Gates** → dependency-cruiser rules, cyclomatic guards, husky/commitlint, CI enhancements.
6. **Documentation & Runbooks** → author `GETTING_STARTED`, `ARCHITECTURE`, `API_REFERENCE`, `QUALITY_GATES`, runbooks.
7. **Test Coverage Expansion** → Vitest unit suites, backend pytest integration, Playwright flows, enforce ≥90–95% coverage.

## Hot Spots & Risks
- **Front-end state & storage**: `App.jsx` orchestrates authentication, onboarding, and role management without typing or separation of concerns.【F:App.jsx†L1-L203】
- **Planner persona logic**: 200+ lines of persona presets and formatting in `Planner.jsx` with duplicated filter logic; high cyclomatic complexity and zero tests.【F:Planner.jsx†L1-L160】
- **Backend monolith**: `backend/app/main.py` combines middleware, router registration, metrics, sockets; difficult to test in isolation.【F:backend/app/main.py†L1-L160】
- **Configuration drift**: Shared validation now exists for both stacks, yet further alignment (e.g., generated typings for backend consumers) is needed to avoid divergence in future services.【F:src/config/env.schema.ts†L1-L35】【F:backend/app/core/config.py†L1-L68】

## Issue Backlog & Targeted Fixes
| Path / Area | Issue | Proposed Fix | Metrics Impacted | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| `src/main.tsx`, `App.jsx`, `Login.jsx`, `Planner.jsx` | Untyped React components with implicit data contracts and direct localStorage access | Codemod to `.tsx`, introduce typed storage helpers and Zod schemas for API payloads, migrate axios usage to typed client (entry point already migrated) | Type Safety, Maintainability | High | Medium |
| `scanner.jsx` & barcode flow | Minimal error handling around camera/decoder, no retry/feedback semantics | Wrap scanner interactions in Result/AppError primitives, surface UI states, add telemetry hooks | Error Handling, Documentation (user feedback) | Medium | Medium |
| `backend/app/main.py` | Centralized router + middleware logic, hard to test | Split into `app.bootstrap`, `app.http.middleware`, `app.routers`, wire dependency-cruiser / import boundaries | Maintainability, Reusability | High | Medium |
| `backend/app/modules/*` | Raw exceptions/logging inconsistencies | Enforce `AppError` factories, structured logging with requestId, add integration tests for failure paths | Error Handling, Maintainability | High | Medium |
| `backend/app/core/config.py` & frontend env usage | Shared schemas exist but lack a single source of truth for generated typings and docs | Automate schema generation between backend `Settings`, `src/config/env.schema.ts`, and `.env.example` | Type Safety, Documentation | Medium | Low |
| Docs (`docs/` root) | Missing up-to-date onboarding/architecture/API/runbooks | Author new docs with reproducible steps, diagrams, and quality gate instructions | Documentation, Maintainability | Medium | Low |
| Testing suites | Sparse coverage in both stacks | Implement Vitest component + hook tests, backend pytest for key modules, add Playwright happy path, enforce coverage thresholds in scripts | Test Coverage, Type Safety | High | Medium |
| CI / automation | Ruff, pytest, Playwright not in pipeline; quality gates partial | Expand `.github/workflows/ci.yml` to include Python lint/test, Playwright (in containers), upload coverage & QUALITY_SUMMARY.md | Maintainability, Documentation | Medium | Medium |
| Legacy archives (`*.zip`, `models(1).py`, etc.) | Historical artefacts inflate repo, risk confusion | Inventory and either remove or isolate in `archive/` folder with docs references, ensure they are excluded from tooling scopes | Maintainability | Medium | Low |

## Immediate Next Steps (Phase 1 Preparation)
1. Run `npm run quality:all` and backend pytest to capture baseline metrics and update `docs/QUALITY_SUMMARY.md` with current scores.
2. Automate synchronisation between `.env.example`, backend `Settings`, and the frontend schema so the documented defaults stay consistent across services.
3. Draft codemod scripts (ts-morph or jscodeshift) for JSX→TSX migration and import alias normalization; dry-run on UI entry points.
4. Prepare dependency-cruiser configuration enforcing `core → domain → application → infrastructure → ui` layering prior to large-scale moves.
5. Establish measurement harness (coverage thresholds in Vitest/pytest configs) so future PRs can demonstrate ≥95% target progress.

This plan will be updated after completing each phase to reflect new baselines and risks.
