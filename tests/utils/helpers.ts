// === auth.ts ===
import { Page } from '@playwright/test';

export const login = async (page: Page, username: string, password: string) => {
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
  await page.waitForSelector('[data-testid="dashboard"]', { state: 'visible' });
};

export const logout = async (page: Page) => {
  await page.getByTestId('user-menu').click();
  await page.getByTestId('logout-button').click();
  await page.waitForSelector('[data-testid="login-page"]', { state: 'visible' });
};

export const getAuthToken = async (page: Page): Promise<string | null> => {
  return await page.evaluate(() => localStorage.getItem('authToken'));
};

// === selectors.ts ===
export const SELECTORS = {
  LOGIN: {
    USERNAME_INPUT: '[data-testid="username-input"]',
    PASSWORD_INPUT: '[data-testid="password-input"]',
    LOGIN_BUTTON: '[data-testid="login-button"]',
  },
  DASHBOARD: {
    MAIN_CONTENT: '[data-testid="dashboard"]',
    SIDEBAR: '[data-testid="sidebar"]',
  },
  COMMON: {
    LOADING: '[data-testid="loading"]',
    ERROR_MESSAGE: '[data-testid="error-message"]',
  },
};

// === api.ts ===
import { Page } from '@playwright/test';

export const mockApiResponse = async (
  page: Page, 
  route: string, 
  mockData: any, 
  status: number = 200
) => {
  await page.route(`**/${route}`, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
};

export const interceptApiCall = async (
  page: Page, 
  route: string, 
  callback: (request: any) => void
) => {
  await page.route(`**/${route}`, (route) => {
    route.continue();
    callback(route.request());
  });
};

export const resetApiMocks = async (page: Page) => {
  await page.unroute('**/*');
};

// === wait.ts ===
import { Page, expect } from '@playwright/test';

export const waitForElementVisible = async (
  page: Page, 
  selector: string, 
  timeout: number = 5000
) => {
  await page.waitForSelector(selector, { state: 'visible', timeout });
};

export const waitForNetworkIdle = async (
  page: Page, 
  timeout: number = 5000
) => {
  await page.waitForLoadState('networkidle', { timeout });
};

export const expectElementToBeVisible = async (
  page: Page, 
  selector: string
) => {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
};

export const waitForText = async (
  page: Page, 
  selector: string, 
  text: string, 
  timeout: number = 5000
) => {
  await page.waitForFunction(
    (args) => {
      const element = document.querySelector(args.selector);
      return element && element.textContent?.includes(args.text);
    },
    { selector, text },
    { timeout }
  );
};
