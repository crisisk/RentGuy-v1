# Agent Guidelines

## Production Readiness Workflow
- Keep the `README.md` section titled "Production Readiness Tracker" in sync with the latest verification run.
- After each multi-agent execution round, update task statuses (Not Started → In Progress → Blocked/Complete) and document any blockers inline in the tracker table.
- When a task from the tracker is completed, annotate the corresponding note with the evidence source (file path, command output, or ticket reference).
- Avoid duplicating completed implementation work from `PRODUCTION_READY_SUMMARY.md`; only new operational or follow-up actions belong in the tracker.

## Outstanding Tasks (Next Steps from Production Report)
| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P1 | Deploy to VPS using the documented runbook | Not Started | Execute procedures from `docs/DEPLOYMENT.md` and capture deployment logs. |
| P1 | Execute Playwright E2E regression suite | Not Started | Run against staging and attach the latest Playwright report. |
| P1 | Apply latest database migrations and seed data | Not Started | Coordinate Alembic upgrades with seed scripts; record migration ID. |
| P1 | Finalise environment variable configuration for new modules | Not Started | Ensure `.env` reflects variables listed in `PRODUCTION_READY_SUMMARY.md`. |
| P2 | Run integration tests across new and existing modules | Not Started | Focus on cross-module workflows (projects ↔ billing ↔ transport). |
| P2 | Perform performance/load testing on new endpoints | Not Started | Stress test recurring invoices, booking, and scanning APIs. |
| P2 | Conduct a security audit of auth and RBAC layers | Not Started | Include route guard bypass attempts and token lifecycle review. |
| P2 | Schedule user acceptance testing with stakeholders | Not Started | Secure sign-off artifacts for go-live readiness. |
| P3 | Evaluate mobile app opportunities for crew/customers | Not Started | Produce scope outline and platform decision. |
| P3 | Extend analytics for BI dashboards | Not Started | Define KPIs and tooling for executive reporting. |
| P3 | Plan third-party accounting/CRM integrations | Not Started | Prioritise targets and required API contracts. |
| P3 | Prepare internationalisation roadmap | Not Started | Audit UI copy and determine localisation framework. |
