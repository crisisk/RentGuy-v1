# RentGuy Enterprise Platform

RentGuy Enterprise Platform is a full-stack solution for professional rental operations. The platform combines a FastAPI backend with a React-based operations console and barcode scanner experience. Together they cover authentication, onboarding, inventory management, crew scheduling, transport planning, billing, warehouse scanning, and reporting workflows that rental teams rely on every day.

## Architecture at a Glance

| Area | Description |
| ---- | ----------- |
| Backend | `backend/` contains a FastAPI service with modular routers per domain (auth, inventory, projects, crew, transport, billing, warehouse, reporting, observability). Metrics, structured logging, and rich error handling are enabled out of the box. |
| Frontend | React single-page app components live at the repository root. The Vite entry point (`src/main.tsx`) conditionally renders the planner UI or the scanner UI depending on `VITE_APP_MODE`, validated through a shared runtime schema. |
| Infrastructure | Docker artefacts, Alembic migrations, seed scripts, and environment configuration helpers sit alongside documentation that captures the enterprise deployment roadmap. |

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
- `VITE_APP_MODE` &mdash; Set to `scanner` to boot directly into the barcode scanner view. Any other value renders the planner dashboard.

Duplicate [`.env.example`](.env.example) to `.env` (or `.env.local`) and adjust the values for your target environment before running the container build.

With the dependencies installed you can start the development server:

```bash
npm run dev
```

The command launches the esbuild development server on `http://localhost:5175`
and mirrors `index.html` into the generated `dist/` directory so static assets
stay in sync.

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
