import { performance } from 'perf_hooks';
import { test as base } from '@playwright/test';

export class FlowTimer {
  private start = performance.now();
  private checkpoints: Record<string, number> = {};

  mark(label: string) {
    this.checkpoints[label] = performance.now() - this.start;
  }

  result(successLabel: string) {
    return {
      successLabel,
      totalMs: performance.now() - this.start,
      checkpoints: this.checkpoints,
    };
  }
}

export const test = base.extend<{ flowTimer: FlowTimer }>({
  flowTimer: async ({}, use, testInfo) => {
    const timer = new FlowTimer();
    await use(timer);
    testInfo.attach('flow-metrics', {
      body: JSON.stringify(timer.result(testInfo.title), null, 2),
      contentType: 'application/json',
    });
  },
});
