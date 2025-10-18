import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const INVENTORY_SEARCH_SELECTOR = '[data-testid="inventory-search-input"]';
const QUOTE_CONFIRM_SELECTOR = '[data-testid="quote-summary-panel"]';

test.describe('Renske – Inventory → Quote', () => {
  test('should prepare a customer-ready quote within KPI guardrails', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Awaiting stable selectors in the backoffice app.');

    await page.goto(frontendPath('app'));
    flowTimer.mark('app-loaded');

    await test.step('Check accessibility of the landing view', async () => {
      const audit = await runA11yAudit(page, 'backoffice-landing');
      testInfo.attach('axe-renske-inventory', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length, 'No critical accessibility violations').toBe(0);
    });

    await test.step('Search inventory for priority items', async () => {
      await page.locator(INVENTORY_SEARCH_SELECTOR).fill('LED Wall');
      flowTimer.mark('inventory-search-executed');
    });

    await test.step('Review generated quote draft', async () => {
      await expect(page.locator(QUOTE_CONFIRM_SELECTOR)).toBeVisible();
      flowTimer.mark('quote-visible');
    });
  });
});
