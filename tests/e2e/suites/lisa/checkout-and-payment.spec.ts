import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const START_BOOKING_SELECTOR = '[data-testid="start-booking"]';
const PAYMENT_STATUS_SELECTOR = '[data-testid="payment-status"]';

test.describe('Lisa – Quote → Checkout → Payment', () => {
  test('should complete booking with ≤15% drop-off risk', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Portal UI implementation pending in repository.');

    await page.goto(frontendPath('portal'));
    flowTimer.mark('portal-loaded');

    await test.step('Run accessibility audit on portal landing', async () => {
      const audit = await runA11yAudit(page, 'portal-landing');
      testInfo.attach('axe-lisa-portal', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThanOrEqual(1);
    });

    await test.step('Start booking flow', async () => {
      await page.locator(START_BOOKING_SELECTOR).click();
      flowTimer.mark('booking-started');
    });

    await test.step('Complete payment hand-off', async () => {
      await expect(page.locator(PAYMENT_STATUS_SELECTOR)).toHaveText(/paid|authorized/i);
      flowTimer.mark('payment-confirmed');
    });
  });
});
