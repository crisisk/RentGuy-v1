# Quality Improvement Plan

## Stack Overview
- **Frontend**: React 18 + Vite 5 single page app located in `src/` with additional legacy JSX entry points in the repository root. Currently implemented in plain JavaScript without type annotations.
- **Backend**: FastAPI 0.115 service under `backend/app/` using SQLAlchemy 2.0 for data access, Alembic migrations, JWT-based auth, and extensive module surface (`auth`, `inventory`, `projects`, `calendar_sync`, etc.).
- **Runtime & Tooling**:
  - Node.js toolchain (Playwright E2E scaffolding, but no unit tests yet).
  - Python 3.11 stack with Ruff for linting (configured via `pyproject.toml`) and pytest.
  - Docker-compose manifests for multi-service deployment.
- **Datastores & Integrations**: PostgreSQL (via SQLAlchemy + psycopg), Redis sockets (Socket.IO real-time module), external payment adapters (Stripe, Mollie), emailer, and multiple integration adapters referenced under `backend/app/modules`.

## Inventory & Current State
### Node.js
- **Dependencies**: `react`, `react-dom`, `axios`, `socket.io-client`, `@zxing/browser`.
- **DevDependencies** (newly scaffolded): full ESLint + Prettier toolchain, Vitest + coverage plugin, dependency-cruiser, madge, jscpd, husky, lint-staged, ts-prune, ts-unused-exports, Playwright.
- **Scripts**: Added `lint`, `typecheck`, `test`, `dup`, `complexity`, `dep:graph`, `quality:report`, `quality:all`, and `ci:type-sanity` in addition to Vite dev/build/preview and Playwright E2E.
- **TypeScript**: `tsconfig.json` introduced with strict compiler flags, JS opt-in (`allowJs` + `checkJs`) to enable incremental migration.

### Python Backend
- **Requirements**: FastAPI, SQLAlchemy, Alembic, passlib, pydantic v2, psycopg, httpx, opentelemetry stack.
- **Testing**: pytest configured but few automated tests available; coverage unknown.
- **Linting**: Ruff config exists (`backend/pyproject.toml`) but not wired into CI.

### Tooling & Automation
- **Formatting**: `.editorconfig` and `.prettierrc.json` added to standardize whitespace and formatting across languages.
- **Linting**: `.eslintrc.cjs` introduced with security (eslint-plugin-security), maintainability (sonarjs, unicorn) and accessibility (jsx-a11y) guards.
- **Git Hooks**: Husky pre-commit hook running lint-staged for JS/TS formatting/linting.
- **CI/CD**: New GitHub Actions workflow `.github/workflows/ci.yml` executing `npm run quality:all` and `npm run ci:type-sanity`, uploading the generated quality summary.
- **Quality Reporting**: `scripts/quality-report.mjs` computes baseline heuristics for the six target metrics and writes `quality-report.json` + `docs/QUALITY_SUMMARY.md`.

### Hot Spots & Risks
- **Type Safety**: Frontend entirely JavaScript (`src/main.jsx`, `App.jsx`, `scanner.jsx`) with dynamic imports; backend Python uses runtime validation but lacks mypy or typed settings. No shared DTO definitions.
- **Error Handling**: Backend uses `AppError` but many modules still raise raw exceptions; frontend lacks centralized error boundary.
- **Reusability**: Domain logic dispersed across numerous modules and duplicated across zipped archives; React UI components live at root rather than a structured library.
- **Maintainability**: `backend/app/main.py` at 160+ lines orchestrates routers, metrics, middleware—candidate for decomposition. Many orphaned scripts (`scripts/*.sh`) and historical artifacts inflate repo.
- **Documentation**: Scattered project reports exist, but developer onboarding, architecture reference, API docs, and runbooks for operations are missing or outdated.
- **Testing**: Vitest/pytest infrastructure largely unused; no coverage reports, limited automated regression confidence.

## Prioritized Backlog
### Must Have (direct impact on reaching ≥95%)
1. **Quality Baseline Automation** – ensure `quality:all` passes locally/CI, wire Ruff + pytest into pipeline.
2. **Type Safety Upgrade** – migrate critical frontend modules to TypeScript, introduce shared DTO schemas (Zod) for backend+frontend contracts, add env schema validation.
3. **Error Handling Framework** – enforce AppError usage, add React error boundary, wrap I/O with structured logging + correlation IDs.
4. **Reusable Architecture** – establish `src/core|domain|infrastructure|ui` structure, refactor duplicated logic into shared utilities/components, enforce dependency rules with dependency-cruiser.
5. **Documentation Refresh** – produce onboarding (`GETTING_STARTED`), architecture overview, API reference, runbooks, quality gate handbook.
6. **Test Coverage Push** – add Vitest unit tests, backend pytest suites, integration tests with coverage thresholds ≥90%.

### Should Have
- Implement Storybook or component catalog for UI reuse.
- Introduce backend type checking (mypy) and coverage reporting pipeline.
- Harden CI with matrix (Node + Python) and caching for faster feedback.
- Automate changelog (Conventional Commits + release script).

### Nice to Have
- Add contract tests against external adapters with mocked services.
- Introduce performance budgets (Lighthouse/Gatling) and security scanning (npm audit, pip-audit, Trivy).
- Provide visual regression automation for UI changes.

## Issue Table
| Path | Issue | Proposed Fix | Metric(s) impacted | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| `src/main.jsx` & root JSX files | Untyped React entrypoints and legacy relative imports hinder type safety | Convert to TypeScript, align imports with alias (`@ui/*`), add type-safe App bootstrap | Type Safety, Maintainability | Medium | Low |
| `backend/app/main.py` | Monolithic application setup (routing, metrics, sockets) concentrated in one file | Split into router registration module, metrics middleware module, and websocket adapter with explicit types | Maintainability, Error Handling | High | Medium |
| `backend/app/modules/*` | Raw exceptions raised, inconsistent error mapping/logging | Standardize on `AppError` factory + structured logger with correlation IDs | Error Handling, Maintainability | High | Medium |
| `docs/` (missing artifacts) | Lack of onboarding, architecture, API docs, runbooks | Author required documents and automate API generation | Documentation | Medium | Low |
| Testing setup | Unit/integration tests absent; no coverage artifacts | Introduce Vitest + Testing Library suites, backend pytest coverage, configure coverage thresholds | Test Coverage, Type Safety | High | Medium |
| Repo tooling | No dependency policy enforcement or duplication monitoring | Enforce dependency-cruiser, madge, jscpd via CI (already scaffolded) and act on findings | Maintainability, Reusability | Medium | Low |
| Environment config | No typed config schema or `.env.example` | Add Zod-based config loader, generate env typings, document env variables | Type Safety, Documentation, Error Handling | Medium | Low |

## Effort/Impact Mapping
- **High Impact / Medium Effort**: Type migration + DTO schemas, documentation refresh, error handling framework.
- **High Impact / High Effort**: Comprehensive test coverage & backend refactor.
- **Medium Impact / Low Effort**: Enforcing tooling (lint, dependency rules) now configured; requires adoption.

## Metric Alignment
Each backlog item is tagged against the six key metrics to ensure every iteration measurably improves towards ≥95% thresholds.
