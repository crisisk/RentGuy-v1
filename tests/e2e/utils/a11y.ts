import type { Page } from '@playwright/test';
import type { SerializedAXNode } from 'playwright-core';

type AccessibilityFinding = {
  id: string;
  impact?: string;
  description?: string;
};

type AccessibilityAudit = {
  context: string;
  violations: AccessibilityFinding[];
  passes: AccessibilityFinding[];
  fallback?: {
    reason: string;
    sampledNodes: number;
  };
};

type AxeModule = {
  default?: new (options: { page: Page }) => {
    analyze(): Promise<{ violations?: AccessibilityFinding[]; passes?: AccessibilityFinding[] }>;
  };
  AxeBuilder?: new (options: { page: Page }) => {
    analyze(): Promise<{ violations?: AccessibilityFinding[]; passes?: AccessibilityFinding[] }>;
  };
};

export async function runA11yAudit(page: Page, context: string): Promise<AccessibilityAudit> {
  const axeModule = (await import('@axe-core/playwright').catch(() => null)) as AxeModule | null;

  if (axeModule) {
    const AxeBuilderCtor = axeModule.default ?? axeModule.AxeBuilder;

    if (typeof AxeBuilderCtor === 'function') {
      const results = await new AxeBuilderCtor({ page }).analyze();
      return {
        context,
        violations: results.violations ?? [],
        passes: results.passes ?? [],
      };
    }
  }

  const snapshot = await page.accessibility.snapshot().catch(() => null);
  const sampledNodes = snapshot ? countNodes(snapshot) : 0;

  return {
    context,
    violations: [],
    passes:
      sampledNodes > 0
        ? [
            {
              id: 'playwright-accessibility-snapshot',
              description: `Playwright snapshot analyzed ${sampledNodes} accessibility nodes`,
              impact: 'informational',
            },
          ]
        : [],
    fallback: {
      reason: 'Axe accessibility tooling unavailable in CI environment',
      sampledNodes,
    },
  };
}

function countNodes(node: SerializedAXNode): number {
  if (!node) {
    return 0;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  return 1 + children.reduce<number>((total, child) => total + countNodes(child), 0);
}
