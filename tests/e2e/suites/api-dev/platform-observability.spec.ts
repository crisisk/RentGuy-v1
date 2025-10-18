import { expect } from '@playwright/test';
import { test } from '../../utils/metrics';
import { runA11yAudit } from '../../utils/a11y';
import { resolveBaseUrl } from '../../utils/environment';

const OPENAPI_LINK_SELECTOR = '[data-testid="openapi-link"]';
const WEBHOOK_STATUS_SELECTOR = '[data-testid="webhook-status"]';

test.describe('API/Dev – Platform Observability', () => {
  test('should expose contracts and webhook health dashboards', async ({ page, flowTimer }, testInfo) => {
    test.fixme(true, 'Developer portal endpoints missing; awaiting API surface.');

    const baseUrl = resolveBaseUrl();
    await page.goto(`${baseUrl}/docs`);
    flowTimer.mark('docs-loaded');

    await test.step('Run accessibility audit for API docs', async () => {
      const audit = await runA11yAudit(page, 'api-docs');
      testInfo.attach('axe-api-docs', {
        body: JSON.stringify(audit, null, 2),
        contentType: 'application/json',
      });
      expect(audit.violations.length).toBeLessThan(10);
    });

    await test.step('Verify OpenAPI contract visibility', async () => {
      await expect(page.locator(OPENAPI_LINK_SELECTOR)).toBeVisible();
      flowTimer.mark('openapi-link-visible');
    });

    await test.step('Confirm webhook diagnostics available', async () => {
      await expect(page.locator(WEBHOOK_STATUS_SELECTOR)).toContainText(/healthy|warning/iu);
      flowTimer.mark('webhook-status-visible');
    });
  });
});
