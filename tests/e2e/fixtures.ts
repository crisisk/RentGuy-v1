import { test as baseTest } from '@playwright/test';
import { Page, BrowserContext, chromium } from '@playwright/test';
import { APIRequestContext } from 'playwright-core';
import type { Fixtures } from '@playwright/test';
import { helpers } from './helpers';

/**
 * Custom fixtures extending base Playwright functionality
 */
interface CustomFixtures {
  api: APIRequestContext;
  authenticatedPage: Page;
  mobilePage: Page;
}

export const test = baseTest.extend<CustomFixtures & { page: Page }>({
  // Override default page with custom initialization
  page: async ({ page }, use) => {
    // Set Dutch language and timezone for consistent UI tests
    await page.context().addInitScript(() => {
      window.localStorage.setItem('lng', 'nl');
      window.localStorage.setItem('timezone', 'Europe/Amsterdam');
    });

    // Wait for all network requests to settle
    await page.waitForLoadState('networkidle');
    
    // Check for Zustand hydration
    await page.waitForFunction(() => {
      return window.__ZUSTAND_HYDRATION_COMPLETE__ === true;
    });

    // Check for error messages on page
    await helpers.checkForPageErrors(page);

    await use(page);
  },

  // API context for direct backend calls
  api: async ({}, use) => {
    const apiContext = await chromium.launch().then(browser => 
      browser.newContext().then(context => 
        context.request.newContext({
          baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
          extraHTTPHeaders: {
            'Content-Type': 'application/json',
          }
        })
      )
    );
    
    await use(apiContext);
    await apiContext.dispose();
  },

  // Pre-authenticated page state
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Inject valid auth state
    await helpers.injectZustandState(page, {
      auth: {
        token: 'TEST_TOKEN',
        user: await helpers.createTestUser(page.request)
      }
    });

    await use(page);
    await context.close();
  },

  // Mobile device emulation
  mobilePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      ...devices['iPhone 13 Pro'],
      locale: 'nl-NL'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});

export const fixtures = {
  page: test.page,
  api: test.api,
  authenticatedPage: test.authenticatedPage,
  mobilePage: test.mobilePage
};

// Error handling hooks
test.beforeEach(async ({ page }) => {
  // Fail test on uncaught exceptions
  page.on('pageerror', error => {
    throw new Error(`Page error: ${error.message}`);
  });

  // Fail test on failed network requests
  page.on('requestfailed', request => {
    throw new Error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
});

// After each test cleanup
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.title.replace(/\s+/g, '-')}.png`,
      fullPage: true
    });
  }
});