# RentGuy Enterprise Platform – Quality Improvement Plan

## Stack & System Inventory
- **Frontend**: React 18 single-page application served through Vite (`src/main.tsx`, `src/ui/App.tsx`, `src/ui/Planner.jsx`). The entry point now boots through a validated env schema (`src/config/env.schema.ts`) and authentication shell components (`src/ui/App.tsx`, `src/ui/Login.tsx`, `src/ui/RoleSelection.tsx`) are typed, but core feature modules such as the planner remain JavaScript with dynamic data flows and extensive localStorage usage. The planner exposes both the new persona dashboard and the legacy FullCalendar drag-and-drop grid via an inline toggle to keep upstream scheduling workflows intact while we continue the TypeScript migration.
- **Barcode Scanner Mode**: Alternative entry in `src/ui/Scanner.jsx` toggled via `VITE_APP_MODE`, relies on `@zxing/browser`.
- **Backend**: FastAPI service (`backend/app/main.py`) with modular routers (`app.modules.*`), SQLAlchemy 2.0 ORM, Alembic migrations, Redis/WebSocket realtime gateway, and adapters for payments, inventory, billing, and reporting.
- **Configuration**: Environment settings managed via Pydantic (`backend/app/core/config.py`) and a new runtime-validated schema for the frontend (`src/config/env.schema.ts`), reducing drift risks between clients.
- **Tooling**:
  - Node scripts: linting, formatting, dependency analysis, duplication detection, tests, and aggregate quality gate via `npm run quality:all` (`package.json`).
  - ESLint 9 now consumes a flat configuration (`eslint.config.mjs`) aligned with the `@application/@core/@infra/@ui` aliases so the lint pipeline runs in modern CI images without legacy `.eslintrc` fallbacks.
  - Python: pytest + coverage scaffolded (`backend/tests`), Ruff linting configured in `backend/pyproject.toml` but not wired into CI.
  - Quality artefacts already scaffolded (e.g., `scripts/quality-report.mjs`, `docs/QUALITY_SUMMARY.md`).
- **Infrastructure**: Docker Compose manifests for multi-service deployment, Postgres primary datastore, optional Stripe/Mollie integrations.

## Metric Baseline (Initial Observation)
| Metric | Current Signals | Gaps Preventing ≥95% |
| --- | --- | --- |
| Type Safety | TS strict config exists, maar kritieke views bevatten nog JavaScript (`src/ui/Planner.jsx`, `src/ui/Scanner.jsx`). Backend lacks mypy. | No typed DTOs, no shared contracts, unchecked axios usage beyond the typed shell, missing env typing for frontend feature modules. |
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
- **Front-end state & storage**: `src/ui/App.tsx` now types the orchestration of authentication, onboarding, and role management but still centralises multiple concerns that should migrate into dedicated hooks/modules.【F:src/ui/App.tsx†L1-L196】
- **Planner persona logic**: 200+ lines of persona presets and formatting in `src/ui/Planner.jsx` with duplicated filter logic; high cyclomatic complexity and zero tests.【F:src/ui/Planner.jsx†L1-L160】
- **Backend monolith**: `backend/app/main.py` combines middleware, router registration, metrics, sockets; difficult to test in isolation.【F:backend/app/main.py†L1-L160】
- **Configuration drift**: Shared validation now exists for both stacks, yet further alignment (e.g., generated typings for backend consumers) is needed to avoid divergence in future services.【F:src/config/env.schema.ts†L1-L35】【F:backend/app/core/config.py†L1-L68】

## Issue Backlog & Targeted Fixes
| Path / Area | Issue | Proposed Fix | Metrics Impacted | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| `src/main.tsx`, `src/ui/App.tsx`, `src/ui/Login.tsx`, `src/ui/OnboardingOverlay.tsx`, `src/ui/Planner.jsx` | React shell components typed; onboarding overlay nu gekoppeld aan `Result<AppError>`-patroon maar planner-flow blijft implicit en deelt mutable state | Breid codemod uit naar planner, extraheer typed hooks voor storage access en deel API DTO contracts. Calendar toggle houdt legacy drag/drop gedrag actief; forwardRef-proxies (`Planner.jsx`, `OnboardingOverlay.jsx`) blijven bestaan voor langlopende branches en vereisen rooktests. | Type Safety, Maintainability, Error Handling, Test Coverage | Medium | Medium |
| `src/ui/Scanner.jsx` & barcode flow | Minimal error handling around camera/decoder, no retry/feedback semantics | Wrap scanner interactions in Result/AppError primitives, surface UI states, add telemetry hooks | Error Handling, Documentation (user feedback) | Medium | Medium |
| `backend/app/main.py` | Centralized router + middleware logic, hard to test | Split into `app.bootstrap`, `app.http.middleware`, `app.routers`, wire dependency-cruiser / import boundaries | Maintainability, Reusability | High | Medium |
| `backend/app/modules/*` | Raw exceptions/logging inconsistencies | Enforce `AppError` factories, structured logging with requestId, add integration tests for failure paths | Error Handling, Maintainability | High | Medium |
| `backend/app/core/config.py` & frontend env usage | Shared schemas exist but lack a single source of truth for generated typings and docs | Automate schema generation between backend `Settings`, `src/config/env.schema.ts`, and `.env.example` | Type Safety, Documentation | Medium | Low |
| Docs (`docs/` root) | Missing up-to-date onboarding/architecture/API/runbooks; quality plan updated iteratief | Author new docs with reproducible steps, diagrams, and quality gate instructions; blijf iteraties vastleggen in QUALITY_SUMMARY | Documentation, Maintainability | Medium | Low |
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
