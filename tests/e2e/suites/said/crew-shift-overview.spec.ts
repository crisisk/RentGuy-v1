import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { frontendPath } from '../../utils/environment';

const SHIFT_BOARD_SELECTOR = '[data-testid="shift-board"]';
const CHECKLIST_SELECTOR = '[data-testid="crew-checklist"]';

test.describe('Said – Crew Shift Overview', () => {
  test('should surface actionable shift data with live updates', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Crew scheduling UI not discoverable yet in repository.');

    await page.goto(frontendPath('crew', 'schedule'));
    flowTimer.mark('crew-schedule-loaded');

    await test.step('Run accessibility audit on crew schedule', async () => {
      const audit = await runA11yAudit(page, 'crew-schedule');
      testInfo.attach('axe-said-schedule', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThan(5);
    });

    await test.step('Verify shift board visibility', async () => {
      await expect(page.locator(SHIFT_BOARD_SELECTOR)).toBeVisible();
      flowTimer.mark('shift-board-visible');
    });

    await test.step('Confirm checklist accessibility', async () => {
      await expect(page.locator(CHECKLIST_SELECTOR)).toBeVisible();
      flowTimer.mark('checklist-visible');
    });
  });
});
