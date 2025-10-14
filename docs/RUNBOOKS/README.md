# Runbooks

Operational guides for the RentGuy Enterprise Platform. Each runbook should provide:

1. **Purpose** – when to use the runbook.
2. **Trigger Conditions** – alerts, metrics, or manual signals that warrant the procedure.
3. **Step-by-Step Actions** – commands, dashboards, or manual tasks with expected outcomes.
4. **Rollback/Recovery** – how to revert changes or stabilise the platform.
5. **Ownership** – team or role responsible for execution.

## Existing Runbooks

- `docs/OPERATIONS.md`: high-level operations checklist and contact tree.
- `docs/TROUBLESHOOTING.md`: common failure scenarios with mitigation steps.
- `docs/DEPLOYMENT.md`: deployment playbook including Docker Compose workflows.

## Authoring New Runbooks

1. Create a new Markdown file under this directory (e.g., `docs/RUNBOOKS/resume-api.md`).
2. Follow the template above and include command outputs or screenshots as needed.
3. Link the runbook from the relevant architecture or onboarding documentation.
4. Update `docs/QUALITY_SUMMARY.md` by running `npm run quality:report` so documentation metrics remain accurate.
