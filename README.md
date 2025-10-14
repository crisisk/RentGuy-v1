# RentGuy Enterprise Platform

RentGuy Enterprise Platform is a full-stack solution for professional rental operations. The platform combines a FastAPI backend with a React-based operations console and barcode scanner experience. Together they cover authentication, onboarding, inventory management, crew scheduling, transport planning, billing, warehouse scanning, and reporting workflows that rental teams rely on every day.

## Architecture at a Glance

| Area | Description |
| ---- | ----------- |
| Backend | `backend/` contains a FastAPI service with modular routers per domain (auth, inventory, projects, crew, transport, billing, warehouse, reporting, observability). Metrics, structured logging, and rich error handling are enabled out of the box. |
| Frontend | React single-page app components live at the repository root. The Vite entry point (`src/main.tsx`) conditionally renders the planner UI or the scanner UI depending on `VITE_APP_MODE`, validated through a shared runtime schema. |
| Infrastructure | Docker artefacts, Alembic migrations, seed scripts, and environment configuration helpers sit alongside documentation that captures the enterprise deployment roadmap. |

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

### Frontend setup

```bash
npm install
```

Configuration is handled through standard Vite environment variables:

- `VITE_API_URL` &mdash; Base URL of the FastAPI service (defaults to `http://localhost:8000`).
- `VITE_APP_MODE` &mdash; Set to `scanner` to boot directly into the barcode scanner view. Any other value renders the planner dashboard.

With the dependencies installed you can start the development server:

```bash
npm run dev
```

The app listens on `http://localhost:5175` (configurable in [`vite.config.js`](vite.config.js)).

## Project Highlights

- **Modular domain design** keeps inventory, crew, billing, and transport concerns isolated while sharing common observability and error primitives.
- **Modern schema definitions** use Pydantic v2 features (`ConfigDict`, `Field`) to provide strict validation, safe defaults, and ORM compatibility without deprecation warnings.
- **Operational metrics middleware** tracks latency, availability, and Prometheus-friendly metrics for every request.
- **Robust client state management** centralises authentication tokens and onboarding progress in `storage.js`, guaranteeing a consistent UX across planner and scanner contexts.

## Quality & Maintenance

- Automated tests live under [`backend/tests`](backend/tests) and cover critical authentication, scheduling, and inventory flows. Execute them before every commit.
- ESLint/Prettier configurations are intentionally omitted to keep the repo lightweight; feel free to extend the toolchain as needed.
- Use `.gitignore` as the canonical reference for large or sensitive artefacts that should stay out of version control.

## Contributing

1. Fork the repository and create a feature branch.
2. Ensure `pytest` and the frontend build succeed.
3. Open a pull request describing the problem solved, testing performed, and any new environment variables introduced.

We welcome improvements to documentation, developer experience, and production hardening alike.

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
