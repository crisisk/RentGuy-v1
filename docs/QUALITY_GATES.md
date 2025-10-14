# Quality Gates

The CI pipeline enforces the following minimum thresholds. Pull requests must meet or exceed them locally before seeking review.

| Metric | Gate | How to Measure | Remediation Guidance |
| --- | --- | --- | --- |
| Type Safety | ≥ 95% | `npm run typecheck`, `npm run ci:type-sanity`, and evidence in `quality-report.json` | Convert JavaScript modules to TypeScript, enable strict typing on APIs, remove unused exports. |
| Error Handling | ≥ 95% | `quality-report.json` evidence + targeted tests | Route I/O failures through `AppError`, cover edge cases with Vitest/Playwright. |
| Code Reusability | ≥ 95% | `npm run dup` report & `quality-report.json` evidence | Extract shared utilities/components, eliminate duplication flagged by jscpd. |
| Maintainability | ≥ 95% | `npm run dep:graph`, `npm run complexity`, ESLint | Break down long files/functions, resolve dependency boundary violations. |
| Documentation | ≥ 95% | Presence of required docs validated by `quality-report.json` | Keep `docs/` runbooks up to date and link new features to architecture notes. |
| Coverage (Lines/Funcs/Branches/Stmts) | ≥ 90% | `npm run test` (Vitest coverage) | Add unit/integration tests targeting untested branches and failure paths. |

## How to Regenerate Reports

```bash
npm run quality:report
```

This command produces `quality-report.json` and `docs/QUALITY_SUMMARY.md`. Commit both files when metrics change.

## Escalation Path

If a gate cannot be met within the scope of the current change:

1. Open an issue describing the gap, affected modules, and proposed remediation.
2. Tag the issue with the relevant metric label (e.g., `quality/type-safety`).
3. Include a temporary justification in the pull request and link to the tracking issue.
4. Schedule the remediation work in the next available iteration.
