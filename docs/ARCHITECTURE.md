# Architecture Overview

The RentGuy Enterprise Platform follows a layered architecture that separates business logic, infrastructure concerns, and UI composition. This section summarises the key building blocks and how they interact.

## Frontend

- **Framework**: React 18 rendered via Vite. The root entry file is `src/main.jsx`.
- **Modes**: Planner and Scanner modes are determined by a validated environment configuration (see `src/config/env.schema.ts`).
- **State & Data**: REST and WebSocket clients live under `src` today and are being migrated into `@core`, `@domain`, and `@ui` workspaces.
- **Quality Guardrails**: TypeScript is enabled with `allowJs` + `checkJs` to allow incremental migration. ESLint and Prettier apply consistent standards.

## Backend

- **Framework**: FastAPI application under `backend/app` organised by domain modules.
- **Data Layer**: SQLAlchemy 2.0 ORM with Alembic migrations. Redis powers queues and WebSocket events.
- **Error Handling**: Centralised exception handlers map to an `AppError` abstraction, ensuring HTTP responses remain consistent.

## Shared Tooling

- **Quality Pipeline**: `npm run quality:all` coordinates linting, type-checking, duplication checks, dependency-cruiser, complexity auditing, tests with coverage, and report generation.
- **Dependency Boundaries**: `.dependency-cruiser.cjs` enforces layer rules. `jscpd` scans for duplication across both frontend and backend paths.
- **Documentation**: Required runbooks and onboarding materials live under `docs/` and are validated by the quality report.

## Deployment

- **Containers**: Docker Compose manifests cover local development, production, and proxy/database stacks.
- **CI/CD**: `.github/workflows/ci.yml` runs the full quality suite in stages (lint → typecheck → static analysis → tests → report) and publishes artefacts for review.
- **Secrets**: Managed via OpenBao. `.env.example` and `.env.production.template` document required keys for local and production deployments.

## Next Steps

- Complete the TypeScript migration for planner and scanner frontends.
- Adopt shared DTOs between the backend and frontend generated via OpenAPI.
- Increase integration test coverage for billing, transport planning, and onboarding flows.
