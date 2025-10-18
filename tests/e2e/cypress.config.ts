import { defineConfig } from 'cypress';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supportFile = path.resolve(__dirname, 'support/e2e.ts');

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  retries: process.env.CI ? 1 : 0,
  e2e: {
    specPattern: 'tests/e2e/{auth,crew,crm,finance,projects}.spec.ts',
    supportFile,
    baseUrl: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
    env: {
      sessionStorageKey: 'rentguy-session-token',
      skipRentGuyE2E: process.env.RENTGUY_RUN_FULL_E2E !== '1',
    },
    setupNodeEvents(on, config) {
      on('before:run', details => {
        if (details.specs.length === 0) {
          console.warn('No Cypress specs discovered.');
        }
      });
      return config;
    },
  },
});
