import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const OVERDUE_TILE_SELECTOR = '[data-testid="overdue-invoices"]';
const EXPORT_BUTTON_SELECTOR = '[data-testid="export-invoices"]';

test.describe('CFO – Billing & Collections', () => {
  test('should expose risk signals and collection levers instantly', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Finance dashboard not yet represented in codebase.');

    await page.goto(frontendPath('app', 'finance'));
    flowTimer.mark('finance-view-loaded');

    await test.step('Accessibility audit for finance overview', async () => {
      const audit = await runA11yAudit(page, 'finance-dashboard');
      testInfo.attach('axe-cfo-finance', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThan(5);
    });

    await test.step('Validate overdue invoices surfacing', async () => {
      await expect(page.locator(OVERDUE_TILE_SELECTOR)).toBeVisible();
      flowTimer.mark('overdue-visible');
    });

    await test.step('Confirm export CTA available', async () => {
      await expect(page.locator(EXPORT_BUTTON_SELECTOR)).toBeEnabled();
      flowTimer.mark('export-ready');
    });
  });
});
