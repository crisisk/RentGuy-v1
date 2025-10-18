# Agent Guidelines

## Production Readiness Workflow
- Keep the `README.md` section titled "Production Readiness Tracker" in sync with the latest verification run.
- After each multi-agent execution round, update task statuses (Not Started → In Progress → Blocked/Complete) and document any blockers inline in the tracker table.
- When a task from the tracker is completed, annotate the corresponding note with the evidence source (file path, command output, or ticket reference).
- Avoid duplicating completed implementation work from `PRODUCTION_READY_SUMMARY.md`; only new operational or follow-up actions belong in the tracker.

## Outstanding Tasks (Next Steps from Production Report)
| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P1 | Deploy to VPS using the documented runbook | Blocked | Awaiting production VPS access and secrets bundle to execute the runbook. |
| P1 | Execute E2E regression suite via Cypress harness | In Progress | `npm run test:e2e` now runs Cypress with the dev server, but specs are skipped until UI hooks and backend fixtures are aligned. |
| P1 | Apply latest database migrations and seed data | Complete | Local PostgreSQL 16 with PostGIS is available and the Alembic plus seed scripts were executed successfully. |
| P1 | Finalise environment variable configuration for new modules | Complete | `.env.example` now includes customer portal, recurring invoice, booking, and sub-renting variables. |
| P2 | Run integration tests across new and existing modules | Blocked | `pytest` execution returned no tests; integration coverage must be authored. |
| P2 | Perform performance/load testing on new endpoints | Blocked | Load-testing stack not available during sandbox runs. |
| P2 | Conduct a security audit of auth and RBAC layers | Blocked | Requires live token lifecycle infrastructure and IAM stakeholders. |
| P2 | Schedule user acceptance testing with stakeholders | Blocked | Pending release candidate availability and stakeholder scheduling. |
| P3 | Evaluate mobile app opportunities for crew/customers | Complete | Findings documented in `docs/mobile_app_evaluation.md`. |
| P3 | Extend analytics for BI dashboards | Complete | KPI roadmap captured in `docs/analytics_extension_plan.md`. |
| P3 | Plan third-party accounting/CRM integrations | Complete | Strategy defined in `docs/integration_strategy.md`. |
| P3 | Prepare internationalisation roadmap | Complete | Localisation milestones outlined in `docs/internationalization_roadmap.md`. |
| P1 | Instrument UI with `data-testid` hooks for Cypress | Not Started | Legacy specs reference selectors that are not present in the React components, so runs are skipped until hooks are added. |
| P1 | Provision reproducible PostgreSQL environment for migrations and integration tests | Complete | PostgreSQL 16 with PostGIS has been installed locally; document the bootstrap commands for future operators. |
