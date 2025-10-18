import { Page, APIRequestContext } from '@playwright/test';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Utility functions for end-to-end testing
 */
export const helpers = {
  /**
   * Create a test user through API
   * @param api API request context
   * @returns Created user object
   */
  createTestUser: async (api: APIRequestContext) => {
    try {
      const response = await api.post('/users', {
        data: {
          email: `testuser+${Date.now()}@rentguy.nl`,
          password: 'Test1234!',
          name: 'Test Gebruiker'
        }
      });

      if (!response.ok()) {
        throw new Error(`Failed to create user: ${response.status()} - ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Inject Zustand state directly into the page
   * @param page Playwright page object
   * @param state Partial Zustand state to inject
   */
  injectZustandState: async (page: Page, state: Record<string, unknown>) => {
    await page.evaluate((stateString: string) => {
      const state = JSON.parse(stateString);
      window.__ZUSTAND_INITIAL_STATE__ = {
        ...window.__ZUSTAND_INITIAL_STATE__,
        ...state
      };
    }, JSON.stringify(state));
  },

  /**
   * Check for error messages in the page
   * @param page Playwright page object
   */
  checkForPageErrors: async (page: Page) => {
    const errorElements = await page.locator('[data-testid="error-message"], .error-message').all();
    if (errorElements.length > 0) {
      const errorMessages = await Promise.all(
        errorElements.map(element => element.textContent())
      );
      throw new Error(`Page contains errors: ${errorMessages.filter(Boolean).join(', ')}`);
    }
  },

  /**
   * Format date in Dutch locale
   * @param date Date object or string
   * @param formatString Date format string
   * @returns Formatted date string
   */
  formatDateDutch: (date: Date | string, formatString = 'dd-MM-yyyy') => {
    return format(new Date(date), formatString, { locale: nl });
  },

  /**
   * Handle API errors with proper typing
   * @param response API response
   */
  handleApiError: async (response: { ok: () => boolean; status: () => number; text: () => Promise<string> }) => {
    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status()}: ${errorBody}`);
    }
  }
};

/**
 * Test scenarios for helpers:
 * 
 * 1. createTestUser:
 *    - Should create user with unique email
 *    - Should throw error on duplicate email
 * 
 * 2. injectZustandState:
 *    - Should merge with existing state
 *    - Should persist through navigation
 * 
 * 3. checkForPageErrors:
 *    - Should detect error messages in DOM
 *    - Should ignore hidden error elements
 * 
 * 4. formatDateDutch:
 *    - Should format date as dd-MM-yyyy
 *    - Should use Dutch month names
 * 
 * 5. handleApiError:
 *    - Should throw on 4xx/5xx status
 *    - Should include status code in error
 */