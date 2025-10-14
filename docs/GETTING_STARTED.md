# Getting Started

This guide helps new contributors spin up the RentGuy Enterprise Platform locally with the same guardrails that run in CI.

## Prerequisites

- Node.js 20 (ships with npm)
- Python 3.11+
- PostgreSQL 15+ (Docker Compose alternative available)
- Redis 7+
- Optional: Docker & Docker Compose for the full stack experience

## Initial Setup

1. Clone the repository and install JavaScript dependencies:

   ```bash
   git clone https://github.com/crisisk/RentGuy-v1.git
   cd RentGuy-v1
   npm install
   ```

2. Create a Python virtual environment for the FastAPI backend:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Seed environment variables:

   ```bash
   cp .env.example .env
   cp .env.production.template .env.production
   ```

   Populate the Vite variables documented in [docs/QUALITY_GATES.md](QUALITY_GATES.md) and backend secrets using OpenBao.

4. Run database migrations:

   ```bash
   alembic upgrade head
   ```

5. Launch the services:

   - **Backend**

     ```bash
     uvicorn app.main:app --reload --port 8000
     ```

   - **Frontend**

     ```bash
     cd ..
     npm run dev
     ```

## Quality Guardrails

Before opening a pull request run the full quality suite:

```bash
npm run quality:all
```

This command runs linting, type-checking, duplication scans, dependency analysis, complexity checks, tests (with coverage), and regenerates the quality report. All gates must pass locally prior to CI.

## Troubleshooting

- Verify Docker containers are healthy by running `docker compose ps` when using the compose stack.
- If `npm run typecheck` fails due to missing type definitions, ensure `npm install` completed without warnings and run `npm run ci:type-sanity` to remove unused exports.
- Coverage artefacts are created in `coverage/`. Delete the directory if the summary becomes stale.
