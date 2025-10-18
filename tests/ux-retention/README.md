# UX Retention Test & Reporting Toolkit

This directory hosts UX and retention automation for the RentGuy platform.

## Current utilities

| Tool | Description | How to run |
| --- | --- | --- |
| `tools/detect_frontend_routes.py` | Scans the repository for the primary frontends (`app`, `portal`, `crew`), extracts component/export metadata, highlights `data-testid` coverage gaps, and suggests Lighthouse targets. | `python tests/ux-retention/tools/detect_frontend_routes.py` |
| `telemetry/mock_telemetry.py` | Seeds mock GA4/Matomo-aligned events for funnels and exports a JSON fixture. | `python tests/ux-retention/telemetry/mock_telemetry.py` |

The script generates structured output in `tests/ux-retention/reports/frontend_map.json` and a human-readable summary in `tests/ux-retention/reports/frontend_map.md`.

Both files are regenerated on each run, making it easy to track frontend coverage over time.

## Playwright scaffolding

Persona-first Playwright suites live in `tests/e2e/suites`. Each flow currently marks scenarios with `test.fixme` until stable selectors and environments are available, but they already:

- Capture time-to-value checkpoints via the shared `FlowTimer` fixture.
- Attach automated axe audits for every landing view.
- Target Chromium, Firefox, and mobile Chromium via `tests/e2e/playwright.config.ts`.

Run the suites locally (once selectors are wired) with:

```bash
npx playwright test -c tests/e2e/playwright.config.ts
```

## Lighthouse CI

The repository now includes a stub `.lighthouserc.json` aligned with the staging environment and KPI thresholds (Perf ≥0.80, A11y ≥0.90, SEO ≥0.90). Results are configured to write into `tests/ux-retention/reports/lighthouse/`.
