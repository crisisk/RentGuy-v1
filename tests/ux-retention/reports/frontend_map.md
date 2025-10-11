# Frontend Route & Component Inventory

_Generated: 2025-10-11T07:52:25.225417+00:00 · Source repo: RentGuy-Enterprise-Platform_

## Backoffice Operations App (`app`)

Status: **FOUND**
Root: `apps/web`
Missing expected paths: `app`

Files scanned: 14

### Components detected
- `API_BASE`
- `App` (exported)
- `CountdownBadge` (exported)
- `CredentialHint`
- `LoadingRows`
- `Login` (exported)
- `MetricTile`
- `ObservabilitySummary` (exported)
- `OnboardingOverlay` (exported)
- `PersonaGuidance` (exported)
- `Planner` (exported)
- `RiskBadge`
- `SNOOZE_DURATION_MS`
- `STATUS` (exported)
- `StatusBadge`
- `StepItem`
- `SummaryMetric`
- `TipBanner` (exported)

### Routes detected
- _No route patterns detected_

### data-testid coverage
- _No `data-testid` attributes detected_
- Files with components but missing `data-testid` usage:
  - `apps/web/src/App.jsx`
  - `apps/web/src/Login.jsx`
  - `apps/web/src/ObservabilitySummary.jsx`
  - `apps/web/src/OnboardingOverlay.jsx`
  - `apps/web/src/Planner.jsx`
  - `apps/web/src/TipBanner.jsx`
  - `apps/web/src/api.js`
  - `apps/web/src/useOnboardingProgress.js`

## Client Booking Portal (`portal`)

Status: **MISSING**
Missing expected paths: `apps/portal`, `portal`

No files scanned.

## Crew PWA Scanner (`crew`)

Status: **FOUND**
Root: `apps/pwa-scanner`
Missing expected paths: `crew`

Files scanned: 3

### Components detected
- `API`
- `Scanner` (exported)

### Routes detected
- _No route patterns detected_

### data-testid coverage
- _No `data-testid` attributes detected_
- Files with components but missing `data-testid` usage:
  - `apps/pwa-scanner/src/scanner.jsx`

