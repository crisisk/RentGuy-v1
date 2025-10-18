import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const ROUTE_BOARD_SELECTOR = '[data-testid="route-board"]';
const CONFLICT_WARNING_SELECTOR = '[data-testid="conflict-warning"]';

test.describe('Inge – Transport Planning', () => {
  test('should visualise time windows and conflicts clearly', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Transport planner UI flagged as missing in frontend map.');

    await page.goto(frontendPath('app', 'transport'));
    flowTimer.mark('transport-view-loaded');

    await test.step('Perform accessibility scan for transport planner', async () => {
      const audit = await runA11yAudit(page, 'transport-planning');
      testInfo.attach('axe-inge-transport', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThan(5);
    });

    await test.step('Ensure route board clarity', async () => {
      await expect(page.locator(ROUTE_BOARD_SELECTOR)).toBeVisible();
      flowTimer.mark('route-board-visible');
    });

    await test.step('Verify conflict warning surfacing', async () => {
      await expect(page.locator(CONFLICT_WARNING_SELECTOR)).toBeVisible();
      flowTimer.mark('conflict-warning-visible');
    });
  });
});
