# Rebuild Status – 2025-10-09

## Backend

- Dependencies defined in `backend/requirements.txt` validated (no external email-validator dependency required anymore).
- Pydantic schemas updated to provide in-project email validation logic (`auth`, `crew`, `onboarding`).
- Project repository layer imports corrected to support modern typing without runtime errors.
- `pytest` executed with `PYTHONPATH=backend pytest -q backend/tests`.

## Frontend

- Planner view refactored to remove the FullCalendar dependency and replaced by a lightweight project planning table with inline editing.
- Production bundle generated via `npm run build` inside `apps/web`.

## Archive integrity

- `scripts/16_verify_new_archives.sh` added to allow quick integrity checks for the archives introduced in the reference commit.

## Remaining follow-up

- Replace the simplified planner UI with a calendar widget once dependency mirroring is available in the execution environment.
