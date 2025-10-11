import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function runA11yAudit(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).analyze();
  return {
    context,
    violations: results.violations,
    passes: results.passes,
  };
}
