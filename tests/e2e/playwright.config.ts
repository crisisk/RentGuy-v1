import { defineConfig, devices } from '@playwright/test';

const APP_URL_STAGING = process.env.APP_URL_STAGING ?? 'https://staging.rentguy.sevensa.nl';
const APP_URL_PROD = process.env.APP_URL_PROD ?? 'https://rentguy.sevensa.nl';
const DEFAULT_BASE_URL = process.env.BASE_URL ?? APP_URL_STAGING ?? APP_URL_PROD;

export default defineConfig({
  testDir: './suites',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/artifacts/report' }]],
  outputDir: 'tests/e2e/artifacts/results',
  fullyParallel: false,
  use: {
    baseURL: DEFAULT_BASE_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
