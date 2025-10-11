import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const PICKLIST_READY_SELECTOR = '[data-testid="picklist-ready"]';
const SCAN_INPUT_SELECTOR = '[data-testid="scanner-input"]';

test.describe('Wouter – Pick/Pack/Load', () => {
  test('should guide warehouse crew through error-free pick and scan', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Scanner PWA endpoints not yet available in staging environment.');

    await page.goto(frontendPath('crew'));
    flowTimer.mark('crew-pwa-loaded');

    await test.step('Assess crew PWA accessibility', async () => {
      const audit = await runA11yAudit(page, 'crew-pwa-home');
      testInfo.attach('axe-wouter-crew', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThan(4);
    });

    await test.step('Confirm picklist availability', async () => {
      await expect(page.locator(PICKLIST_READY_SELECTOR)).toBeVisible();
      flowTimer.mark('picklist-ready');
    });

    await test.step('Simulate barcode scan', async () => {
      await page.locator(SCAN_INPUT_SELECTOR).fill('RG-ITEM-0001');
      flowTimer.mark('item-scanned');
    });
  });
});
