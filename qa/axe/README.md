# Axe Accessibility Checks

## Aanpak
1. Start de Vite app lokaal:
   ```bash
   npm install
   npm run dev -- --host
   ```
2. Voer Axe scans uit met Playwright + `@axe-core/playwright`:
   ```bash
   npx playwright test tests/e2e/onboarding.spec.ts --project=chromium --grep "accessibility"
   ```
3. Voeg aparte accessibility spec toe (voorbeeld):
   ```ts
   import AxeBuilder from '@axe-core/playwright'

   test('login voldoet aan WCAG 2.2 AA', async ({ page }) => {
     await page.goto(process.env.E2E_BASE_URL ?? 'http://localhost:5173')
     const accessibilityScanResults = await new AxeBuilder({ page })
       .include('#root')
       .disableRules(['color-contrast'])
       .analyze()
     expect(accessibilityScanResults.violations).toEqual([])
   })
   ```
4. Rapporteer resultaten via `npx axe-linter --rules wcag22aa` of integreer in CI.

## CLI Commandos
- `npx playwright test --config=playwright.config.ts`
- `npx lhci autorun --config=qa/lighthouse/lighthouserc.json`

