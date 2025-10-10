# Next CI Actions
- npm i -D @playwright/test lighthouse axe-core
- npx playwright install
- npx playwright test tests/e2e/onboarding_rentguy.spec.ts
- npx lighthouse https://rentguy.example.com --config-path=qa/lighthouse/lighthouserc.json
