import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Configure Playwright for end-to-end testing
 * See https://playwright.dev/docs/test-configuration
 */
const config: PlaywrightTestConfig = defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Fail build on CI if test fails
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,
  
  // Parallelize tests on CI
  workers: process.env.CI ? 4 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5175',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Default viewport
    viewport: { width: 1280, height: 720 },
    
    // Bypass CSP in development
    ignoreHTTPSErrors: true
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  // Web server for production build testing
  webServer: {
    command: process.env.PORT ? `PORT=${process.env.PORT} npm run start:dev` : 'npm run start:dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});

export default config;