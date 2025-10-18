# Quality Summary

Generated at: 2025-10-14T21:37:01.802Z

| Metric | Previous | Current | Δ | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| Type Safety | 67.84 | 67.84 | 0.00 | 95 | ⚠️ |
| Error Handling | 100.00 | 100.00 | 0.00 | 95 | ✅ |
| Code Reusability | 94.16 | 94.16 | 0.00 | 95 | ⚠️ |
| Maintainability | 0.00 | 0.00 | 0.00 | 95 | ⚠️ |
| Documentation | 33.33 | 33.33 | 0.00 | 95 | ⚠️ |

| Coverage Metric | Value | Gate | Status |
| --- | --- | --- | --- |
| Lines | 0.00 | 90.00 | ⚠️ |
| Functions | 0.00 | 90.00 | ⚠️ |
| Branches | 0.00 | 90.00 | ⚠️ |
| Statements | 0.00 | 90.00 | ⚠️ |

**Overall Quality Index:** 59.07 (⚠️)

## Next Actions
- Type Safety below gate (67.84%). Continue Planner migration and share DTOs for scanner payloads.
- Code Reusability below gate (94.16%). Break persona utilities and planner filters into reusable modules.
- Maintainability below gate (0.00%). Introduce dependency boundaries and automated lint/test enforcement in CI.
- Documentation below gate (33.33%). Author onboarding/runbook updates covering scanner offline sync and queue semantics.
- Coverage lines below gate (0.00%).
- Coverage functions below gate (0.00%).
- Coverage branches below gate (0.00%).
- Coverage statements below gate (0.00%).
- Add Vitest suites for `@infra/offline-queue` backoff/flush scenarios and smoke tests for `Scanner`.

