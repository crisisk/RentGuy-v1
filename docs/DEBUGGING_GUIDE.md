# Debugging Guide

This guide explains the debugging workflow that accompanies the automated orchestrator tooling
introduced in this repository. All commands are meant to be executed from the repository root.

## Prerequisites

- Node.js 18 or newer.
- npm configured to install dependencies from a reachable registry mirror. The execution
  environment available in this workspace does not currently allow downloading packages from the
  public npm registry, so provide an offline cache or internal proxy before running the full
  pipeline.
- (Optional) A running development server exposing health endpoints on `http://localhost:3000` if
  you wish to validate the smoke tests locally.

## Orchestrator workflow

1. **Preparation**

   ```bash
   npm run debug:prepare
   ```

   This command creates the `artifacts/debug` directory structure, primes the `DEBUG_SUMMARY.json`
   file, and ensures the triage plan document exists.

2. **Baseline scan**

   ```bash
   npm run debug:scan
   ```

   The scan sequentially executes linting, type-checking, build, database migration, dev server
   boot, smoke validation, unit tests, and end-to-end tests. Logs are persisted under
   `artifacts/debug/logs`. Failures detected during the scan are stored in
   `artifacts/debug/baseline-findings.json`.

3. **Triage loop**

   ```bash
   npm run debug:run
   ```

   The run step reads the baseline findings, updates the triage plan at
   `artifacts/debug/triage-plan.md`, and refreshes `DEBUG_SUMMARY.json` so the current status is
   clear.

## Smoke testing

The smoke script is exposed separately:

```bash
npm run smoke
```

It calls the `/healthz`, `/readyz`, `/livez`, and application root endpoints on `localhost:3000` and
records results in `artifacts/debug/logs/smoke-results.json`.

## Logs & artefacts

- `artifacts/debug/logs/*.log` – raw command output captured by the orchestrator.
- `artifacts/debug/baseline-findings.json` – structured list of failing phases.
- `artifacts/debug/triage-plan.md` – Markdown table describing hypotheses and planned fixes.
- `DEBUG_SUMMARY.json` – machine-readable status indicator for downstream automation.
- `DEBUG_REPORT.md` – human-readable summary of the debugging timeline and applied fixes.

## Troubleshooting

If the orchestrator reports failures when attempting to install dependencies (`npm ERR! code E403`),
configure npm to use a registry mirror accessible from the execution environment or preload the
required packages into a local cache. After addressing network restrictions, re-run the workflow
starting from `npm run debug:prepare` to reset artefacts.
