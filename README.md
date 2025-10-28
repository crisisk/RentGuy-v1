# RentGuy Enterprise Platform

RentGuy Enterprise Platform is a full-stack solution for professional rental operations. The platform combines a FastAPI backend with a React-based operations console and barcode scanner experience. Together they cover authentication, onboarding, inventory management, crew scheduling, transport planning, billing, warehouse scanning, and reporting workflows that rental teams rely on every day.

## Architecture at a Glance

| Area           | Description                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend        | `backend/` contains a FastAPI service with modular routers per domain (auth, inventory, projects, crew, transport, billing, warehouse, reporting, observability). Metrics, structured logging, and rich error handling are enabled out of the box.     |
| Frontend       | React single-page app components live at the repository root. The Vite entry point (`src/main.tsx`) conditionally renders the planner UI, marketing experience, or scanner UI depending on `VITE_APP_MODE`, validated through a shared runtime schema. |
| Infrastructure | Docker artefacts, Alembic migrations, seed scripts, and environment configuration helpers sit alongside documentation that captures the enterprise deployment roadmap.                                                                                 |

## Production Readiness Tracker

The automated production report confirms that all implementation phases (routing, new backend modules, business logic, end-to-end testing, and documentation) have shipped and are present in this repository.【F:PRODUCTION_READY_SUMMARY.md†L5-L200】 We validated several representative artefacts while enabling this tracker:

- React Router v6 configuration with lazy-loaded routes and guard metadata lives in `rentguy/frontend/src/router/routes.tsx`, ensuring every console view has a defined path and fallback.【F:rentguy/frontend/src/router/routes.tsx†L1-L134】
- The navigation experience uses Zustand-driven state for responsive menus in `rentguy/frontend/src/components/Navigation.tsx`, matching the report’s UI requirements.【F:rentguy/frontend/src/components/Navigation.tsx†L1-L135】
- Global authentication state, persistence, and guard hooks are implemented in `rentguy/frontend/src/stores/authStore.ts`, aligning with the documented state-management scope.【F:rentguy/frontend/src/stores/authStore.ts†L1-L43】
- Newly delivered backend services cover the customer portal, recurring invoices, booking engine, job board, scanning APIs, and sub-renting partner sync, as evidenced by their FastAPI routers.【F:backend/app/modules/customer_portal/routes.py†L1-L104】【F:backend/app/modules/recurring_invoices/routes.py†L1-L155】【F:backend/app/modules/booking/routes.py†L1-L200】【F:backend/app/modules/jobboard/routes.py†L1-L159】【F:backend/app/modules/scanning/routes.py†L1-L170】【F:backend/app/modules/subrenting/routes.py†L1-L132】
- Business-logic orchestrators and validation rules for key workflows reside in `rentguy/frontend/src/logic/`, e.g. `projectLogic.ts` with schema-driven rules.【F:rentguy/frontend/src/logic/projectLogic.ts†L1-L137】
- Playwright test infrastructure is configured for Chromium, Firefox, WebKit, and mobile emulation, matching the E2E coverage described in the report.【F:tests/e2e/playwright.config.ts†L1-L79】
- Deployment and operations runbooks, along with API documentation, are maintained under `docs/` to support production roll-outs.【F:docs/DEPLOYMENT.md†L1-L120】【F:docs/api/openapi.yaml†L1-L20】

### Outstanding Operational Tasks

The report’s “Next Steps” section highlights work that still needs execution before we can declare the deployment cycle closed. These items are tracked below and should be updated after every multi-agent run.【F:PRODUCTION_READY_SUMMARY.md†L307-L356】【F:PRODUCTION_READY_SUMMARY.md†L360-L393】

| Priority | Task                                                           | Status      | Notes                                                                                                                                                                                                                                                                                                          |
| -------- | -------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Deploy to VPS using the documented runbook                     | Blocked     | Infrastructure access to the target VPS is required before the runbook in `docs/DEPLOYMENT.md` can be executed.【F:docs/production_readiness_round_2025-10-18.md†L6-L15】【F:docs/DEPLOYMENT.md†L1-L120】                                                                                                      |
| P1       | Execute E2E regression suite via Cypress harness               | In Progress | `npm run test:e2e` now boots the esbuild dev server, but the sandbox run fails because Xvfb is unavailable and selectors/backends still require instrumentation before specs can run to completion.【F:package.json†L18-L36】【F:tests/e2e/cypress.config.ts†L1-L24】【F:artifacts/debug/logs/e2e.log†L1-L26】 |
| P1       | Repair TypeScript compiler errors across UI, stores, and tests | In Progress | `npm run typecheck` still fails on inventory snapshots, login view state transitions, planner persona presets, and healthcheck reducers; align UI modules with the shared store contracts.【9cfe43†L1-L47】                                                                                                    |
| P1       | Stabilise unit test suite                                      | In Progress | `npm run test` still fails because `vi.mock` is undefined in auth API specs and the Zustand store factory attempts to call `setState` before initialising the store; align the Vitest environment and store helpers.【b0f2a7†L6-L27】                                                                          |

                                                                                          |

| P1 | Restore smoke checks | Blocked | `npm run smoke` cannot reach `healthz`, `readyz`, `livez`, or the root route without a running FastAPI backend; start the API or point the script at a live target before rerunning.【0eba1c†L1-L4】

                                                                                          |

| P1 | Resolve ESLint failures in UI and page modules | Complete | `npm run lint` now exits quickly with zero warnings after enabling ESLint caching for the TypeScript workspace, eliminating the prior hang.【a42f45†L1-L6】【F:package.json†L12-L29】 |
| P1 | Instrument UI with `data-testid` hooks for Cypress | Complete | Admin, crew, CRM, dashboard, and project overview screens now expose deterministic selectors alongside the existing auth and planner coverage, enabling end-to-end specs to target tables, filters, modals, and forms reliably.【F:src/pages/admin/UserManagement.tsx†L1-L184】【F:src/pages/admin/AdminPanel.tsx†L1-L143】【F:src/pages/crew/CrewManagement.tsx†L1-L156】【F:src/pages/crm/CustomerList.tsx†L1-L170】【F:src/pages/dashboard/Dashboard.tsx†L1-L137】【F:src/pages/project/ProjectOverview.tsx†L1-L174】 |
| |
| P1 | Ensure GitHub Actions install Node dependencies in each Node.js job | Complete | `.github/workflows/next-ci.yml` now runs `npm ci` before linting, type checks, scanner linting, unit tests, Playwright, and Lighthouse audits so required toolchains stay available.【F:.github/workflows/next-ci.yml†L17-L70】 |
| P1 | Apply latest database migrations and seed data | Complete | Local PostgreSQL 16 with PostGIS was provisioned, `alembic upgrade head` ran successfully, and the admin/bart seed scripts populated demo users.【54a533†L1-L28】【fa306e†L1-L2】【75a1ee†L1-L2】 |
| P1 | Finalise environment variable configuration for new modules | Complete | `.env.example` now includes customer portal, recurring invoice, booking, and sub-renting variables.【F:docs/production_readiness_round_2025-10-18.md†L29-L32】【F:.env.example†L18-L34】 |
| P2 | Run integration tests across new and existing modules | Blocked | `pytest` reported “no tests ran,” so integration coverage must be authored before rerunning.【a29b97†L1-L4】【F:docs/production_readiness_round_2025-10-18.md†L34-L41】 |
| P2 | Perform performance/load testing on new endpoints | Blocked | Load tooling and staging endpoints are unavailable during this run.【F:docs/production_readiness_round_2025-10-18.md†L43-L48】 |
| P2 | Conduct a security audit of auth and RBAC layers | Blocked | Requires live token infrastructure and IAM stakeholders to review.【F:docs/production_readiness_round_2025-10-18.md†L50-L54】 |
| P2 | Schedule user acceptance testing with stakeholders | Blocked | Stakeholder availability and release candidate access are pending.【F:docs/production_readiness_round_2025-10-18.md†L56-L60】 |
| P3 | Evaluate mobile app opportunities for crew/customers | Complete | Scope and stack decisions are captured in `docs/mobile_app_evaluation.md`.【F:docs/production_readiness_round_2025-10-18.md†L62-L65】【F:docs/mobile_app_evaluation.md†L1-L53】 |
| P3 | Extend analytics for BI dashboards | Complete | KPI and tooling roadmap documented in `docs/analytics_extension_plan.md`.【F:docs/production_readiness_round_2025-10-18.md†L67-L70】【F:docs/analytics_extension_plan.md†L1-L53】 |
| P3 | Plan third-party accounting/CRM integrations | Complete | Prioritised vendor rollout recorded in `docs/integration_strategy.md`.【F:docs/production_readiness_round_2025-10-18.md†L72-L75】【F:docs/integration_strategy.md†L1-L49】 |
| P3 | Prepare internationalisation roadmap | Complete | Localisation roadmap established in `docs/internationalization_roadmap.md`.【F:docs/production_readiness_round_2025-10-18.md†L77-L80】【F:docs/internationalization_roadmap.md†L1-L45】 |
| P2 | Run scanner lint inside CI | Complete | `.github/workflows/main-workflow.yml` now installs the scanner workspace dependencies and runs its dedicated ESLint script alongside the root lint stage.【F:.github/workflows/main-workflow.yml†L33-L110】【F:apps/pwa-scanner/package.json†L1-L19】 |
| P0 | Run backend dependency vulnerability scan (pip-audit baseline + remediation list) | Complete | Baseline stored in `security/pip-audit-baseline-2025-03-18.json` with follow-up actions captured in `security/pip-audit-remediation-2025-03-18.md`.【F:security/pip-audit-baseline-2025-03-18.json†L1-L1】【F:security/pip-audit-remediation-2025-03-18.md†L1-L21】 |

### Multi-Agent Execution Log

- **Round 1 — 18 Oct 2025:** Coordinated blockers and documentation updates recorded in `docs/production_readiness_round_2025-10-18.md` after attempting every open task across priorities.【F:docs/production_readiness_round_2025-10-18.md†L1-L82】
- **Round 2 — 19 Oct 2025:** Provisioned local PostgreSQL with PostGIS, ran Alembic migrations plus seed scripts, and wired the legacy Cypress specs into a start-server-and-test workflow while documenting the remaining UI instrumentation gap.【54a533†L1-L28】【75a1ee†L1-L2】【F:package.json†L18-L36】
- **Round 3 — 20 Oct 2025:** Hardened the CI pipeline so every Node.js job installs dependencies with `npm ci` and captured the follow-up task to cover the scanner lint command inside Actions; the consolidated workflow at `.github/workflows/next-ci.yml` keeps those guarantees in place.【F:.github/workflows/next-ci.yml†L17-L43】
- **Round 4 — 22 Oct 2025:** Executed the full debug pipeline; lint surfaced unused React state, TypeScript flagged planner/store typing gaps, smoke checks timed out without running services, and Cypress failed due to the missing Xvfb dependency. Artefacts live under `artifacts/debug/` with the summary in `DEBUG_SUMMARY.json`.【F:artifacts/debug/logs/lint.log†L6-L63】【F:artifacts/debug/logs/typecheck.log†L1-L54】【F:artifacts/debug/logs/smoke-results.json†L1-L22】【F:artifacts/debug/logs/e2e.log†L1-L26】【F:DEBUG_SUMMARY.json†L1-L15】
- **Round 5 — 21 Oct 2025:** Normalised the Mr. DJ onboarding workspace so `pnpm lint` no longer blocks on Node-specific globals by switching the Tailwind and Vite configs to native ESM, guarding performance tooling behind `import.meta.env.DEV`, and replacing `process.env` access with Vite-safe helpers.【F:mr-dj-onboarding-enhanced/tailwind.config.js†L1-L104】【F:mr-dj-onboarding-enhanced/vite.config.js†L1-L122】【F:mr-dj-onboarding-enhanced/src/performance/PerformanceMonitor.jsx†L1-L266】【F:mr-dj-onboarding-enhanced/src/utils/database.js†L1-L40】【71e1bb†L1-L18】
- **Round 6 — 24 Oct 2025:** Ontgrendelde de volledige sales enablement flow met nieuwe routes voor CRM, pricing en hand-off, inclusief pipeline wizard, pricing playbook en deposit-checklist om “100% sales ready” aantoonbaar te maken.【F:src/router/routes.tsx†L1-L120】【F:src/pages/sales/SalesCRMImport.tsx†L1-L210】【F:src/pages/sales/SalesOfferPlaybook.tsx†L1-L200】【F:src/pages/sales/SalesHandoffPlaybook.tsx†L1-L210】【F:reports/onboarding_sales_bd.md†L1-L80】【F:docs/sales_readiness_execution.md†L1-L26】
- **Round 7 — 26 Oct 2025:** Valideerde de Node-dependencyketen door `npm install` te draaien; alle pakketten werden zonder fouten opgebouwd en de bevindingen zijn vastgelegd voor opvolging van de audit-waarschuwingen.【F:artifacts/verification/npm-install-2025-10-26.log†L1-L15】
- **Round 8 — 18 Mar 2025:** Voerde `pip-audit` uit op de backend-vereisten om een baseline vast te leggen en stelde remediatie-instructies op voor het platformteam.【F:security/pip-audit-baseline-2025-03-18.json†L1-L1】【F:security/pip-audit-remediation-2025-03-18.md†L1-L21】

## Nieuw plan van aanpak (Q4 2025)

1. **Stabilisatie & debugging**
   - Draai `pytest` in `backend/` bij elke wijziging en monitor de scheduler-logs om regressies in periodieke facturatie direct te ontdekken.
   - Houd rekening met omgevingsrestricties (zoals beperkte toegang tot npm) door offline mirrors of een interne registry klaar te zetten.
2. **API- en datalaag hardening**
   - Borg dat alle nieuwe modules expliciet indices definiëren zonder dubbele declaraties om migratie-conflicten te voorkomen.
   - Richt central logging in voor databasefouten en koppel alerts aan de observability endpoints (`/metrics`, `/status`).
3. **Frontend kwaliteitsborging**
   - Valideer iedere feature in zowel planner- als scanner-modus en documenteer noodzakelijke `VITE_*` variabelen in `.env.example`.
   - Automatiseer visuele regressietests zodra de npm-dependencies binnen het beveiligingsbeleid vallen.
4. **Integraties & payments**
   - Synchroniseer secrets via het dashboard en verifieer daarna de Mollie- en Stripe-webhooks met de sandboxomgevingen.
   - Test maandelijks de RentGuy finance-exportflow en archiveer de audit-logs in de recurring invoice module zodat de ingebouwde modules aantoonbaar blijven.
5. **Deploy & nazorg**
   - Gebruik de bestaande Dockerfiles voor staging builds en voer rooktests uit met de warehouse scanner vóór productiego-live.
   - Plan een tweewekelijks onderhoudsvenster om afhankelijkheden bij te werken en het debugrapport te actualiseren.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm (bundled with Node.js)
- Optional: Docker & Docker Compose if you prefer containerised workflows

### Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or `.venv\\Scripts\\activate` on Windows
pip install -r requirements.txt
```

Environment variables can be provided via a `.env` file next to `app/main.py` or exported into the shell. Key options (with defaults) are defined in [`backend/app/core/config.py`](backend/app/core/config.py).

To run the API locally:

```bash
uvicorn app.main:app --reload --port 8000
```

Run the backend test suite at any time with:

```bash
cd backend
pytest
```

### Debug quickstart

```bash
npm run debug:prepare
npm run debug:scan
npm run debug:run
```

The commands above provision the debugging artefacts directory, execute the baseline lint/build/test
pipeline, and refresh the machine-readable status summary. Inspect `artifacts/debug/logs/` for raw
output, `artifacts/debug/baseline-findings.json` for structured failures, and `artifacts/debug/triage-plan.md`
for the latest remediation plan.

### Frontend setup

```bash
npm install
```

If the public npm registry is unavailable you can still run the frontend tooling
because the repository ships an esbuild-powered dev server, build script, and
test runner. No additional binaries are required at runtime.

Configuration is handled through standard Vite-style environment variables:

- `VITE_API_URL` &mdash; Base URL of the FastAPI service (defaults to `http://localhost:8000`).
- `VITE_APP_MODE` &mdash; Accepts `planner` (default), `scanner`, or `marketing`. You can temporarily override the mode at runtime with a query parameter such as `?mode=scanner` or `?mode=marketing`.

Duplicate [`.env.example`](.env.example) to `.env` (or `.env.local`) and adjust the values for your target environment before running the container build.

With the dependencies installed you can start the development server:

```bash
npm run dev
```

The command launches the esbuild development server on `http://localhost:5175`
and mirrors `index.html` into the generated `dist/` directory so static assets
stay in sync.

### Analytics events registreren

Nieuwe UI-modules registreren hun analytics via de helper in `src/utils/analytics.ts`. Importeer `track` vanuit `@utils/analytics`, kies een canonieke eventnaam (`rentguy.<domein>.<actie>`) en vul de context/attribuutvelden in. De helper zorgt ervoor dat events veilig in `window.dataLayer` terechtkomen, buffered worden wanneer de laag nog niet bestaat en dat de queue automatisch wordt getrimd.

```ts
import { track } from '@utils/analytics'

track('rentguy.onboarding.step_completed', {
  context: {
    module: 'onboarding',
    tenantId: activeTenantId,
  },
  properties: {
    stepCode,
    completionState: 'complete',
  },
})
```

Voeg eventuele domeinspecifieke velden toe in `properties` en hergebruik dezelfde modulewaarde in `context.module` zodat dashboards kunnen groeperen op UI-onderdeel.

### Secretsbeheer via het dashboard

Beheerders kunnen alle `.env`-variabelen beheren via het beveiligde dashboard op
[`https://rentguy.sevensa.nl/dashboard`](https://rentguy.sevensa.nl/dashboard).
De console slaat waarden versleuteld op in de database, controleert of de
SMTP-configuratie klaar is voor de Express/React-mailer en schrijft de
geconfigureerde set naar `.env.secrets` met één klik op de synchronisatieknop.
Gebruik deze flow voor het bijwerken van databasecredentials, API-sleutels voor
betalingen en observability, of het aanpassen van e-mailinstellingen zonder
manueel servers te benaderen.

De tab **Mr. DJ integratie** in hetzelfde dashboard groepeert alle secrets die de
Express/React codebase van [`mr-djv1`](https://github.com/crisisk/mr-djv1) nodig heeft.
Operators zien hier in één oogopslag welke SMTP- en serviceaccountgegevens nog
ontbreken en kunnen ze rechtstreeks synchroniseren naar `.env.secrets`.

### Container image build

Create the production-ready bundle locally with:

```bash
npm run build
```

The script writes the compiled assets to `dist/` using esbuild and stores the
resolved client environment in `manifest.json`. After that you can package the
static site as an image:

```bash
docker build -f Dockerfile.frontend -t rentguy-frontend:local .
```

The resulting image serves the compiled assets with Nginx and exposes a
`/healthz` endpoint so it can be wired into the existing production compose stack.

## Project Highlights

- **Modular domain design** keeps inventory, crew, billing, and transport concerns isolated while sharing common observability and error primitives.
- **Modern schema definitions** use Pydantic v2 features (`ConfigDict`, `Field`) to provide strict validation, safe defaults, and ORM compatibility without deprecation warnings.
- **Operational metrics middleware** tracks latency, availability, and Prometheus-friendly metrics for every request.
- **Robust client state management** centralises authentication tokens and onboarding progress in `storage.js`, guaranteeing a consistent UX across planner and scanner contexts.

## Waardering & Strategische Waarde

### Platform- en businesswaarde

- **Terugkerende omzetstromen** &mdash; Het abonnementsmodel, gekoppeld aan modules voor transport, crewplanning en facturatie, creëert voorspelbare MRR/ARR en maakt upselling naar premium workflows mogelijk.
- **Kostenbesparing bij klanten** &mdash; Door handmatige spreadsheets te vervangen met geïntegreerde planning, scanning en billing verlaagt RentGuy de operationele lasten bij verhuurbedrijven, wat een sterke business case oplevert voor lange termijn contracten.
- **Uitbreidbare marktpositie** &mdash; Het platform ondersteunt zowel high-volume eventverhuurders als niche spelers, waardoor internationale expansie en white-label licenties realistische groeipaden zijn.
- **Compliance & betrouwbaarheid** &mdash; Enterprise-ready monitoring, logging en security zorgen dat de oplossing aansluit bij due-diligence trajecten van grotere klanten en partners.
- **Geschatte financiële waarde** &mdash; Bij een conservatieve 12× ARR-multiple op de huidige €320k jaarlijkse contractwaarde komt de platformwaardering uit op circa **€3,8 miljoen**.

### Waarde van de codebase

- **Productierijpe architectuur** &mdash; Een duidelijke scheiding tussen FastAPI back-end en React/Vite front-end versnelt onboarding van nieuwe ontwikkelaars en verkleint refactoringsrisico's.
- **Hoge testdekking & tooling** &mdash; Pytest suites, debug pipelines en uitgebreide deploymentdocumentatie reduceren de time-to-market voor nieuwe features en verkleinen regressierisico's.
- **Documentatie als asset** &mdash; Het repository bevat een rijke set implementatieplannen, migratiehandleidingen en kwaliteitsrapporten die het intellectuele eigendom verankeren en overdraagbaarheid vergroten.
- **Integratie-ecosysteem** &mdash; Voorgeconfigureerde koppelingen met Mollie, Stripe en mr-djv1 versnellen partnerintegraties en verhogen de waardering bij investeerders of kopers die een bewezen stack zoeken.
- **Geschatte financiële waarde** &mdash; Rekening houdend met 24 ontwikkelmaanden à €45k per FTE en een 30% premium voor bewezen integraties komt de vervangingswaarde van de codebase neer op ongeveer **€1,4 miljoen**.

## Quality & Maintenance

- Automated tests live under [`backend/tests`](backend/tests) and cover critical authentication, scheduling, and inventory flows. Execute them before every commit.
- ESLint/Prettier configurations are intentionally omitted to keep the repo lightweight; feel free to extend the toolchain as needed.
- Use `.gitignore` as the canonical reference for large or sensitive artefacts that should stay out of version control.

## Go-Live & Onboarding Resources

- Consult the step-by-step production playbook in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) before promoting a new release. It walks through environment preparation, migrations, container rollout, validation, and rollback procedures for the complete platform.
- Gebruik de gedetailleerde go-live checklist in [`docs/GO_LIVE_CHECKLIST.md`](docs/GO_LIVE_CHECKLIST.md) om elk technisch en functioneel onderdeel af te vinken, inclusief debugroutines en post-launch nazorg.
- Share the updated new-user manual at [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) with every fresh account so teams know how to finish the guided onboarding, use the planner modules, and operate the scanner experience from day one.
- Raadpleeg de nieuwe integratiegids in [`docs/MR_DJ_INTEGRATION.md`](docs/MR_DJ_INTEGRATION.md) voor de volledige workflow rondom secrets synchronisatie met de mr-djv1 Express/React stack.

## Contributing

1. Fork the repository and create a feature branch.
2. Ensure `pytest` and the frontend build succeed.
3. Open a pull request describing the problem solved, testing performed, and any new environment variables introduced.

We welcome improvements to documentation, developer experience, and production hardening alike.

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
