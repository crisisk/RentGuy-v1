import { test, expect, type Page, type BrowserContext } from '@playwright/test';
test.describe('Nadia (Newbie) Tests', () => {
  let page: Page;
  let context: BrowserContext;
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });
  test('First login experience', async () => {
    await page.goto('/login');
    await page.fill('#email', 'nadia@example.com');
    await page.fill('#password', 'securepassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Welcome, Nadia!')).toBeVisible();
  });
  test('Onboarding flow', async () => {
    await page.goto('/onboarding');
    const steps = await page.locator('.onboarding-step').count();
    
    for (let i = 0; i < steps; i++) {
      await expect(page.locator(`.step-progress >> nth=${i}`)).toHaveClass('active');
      await page.click('button:has-text("Next")');
    }
    
    await expect(page.locator('text=Onboarding Complete!')).toBeVisible();
  });
  test('Simple customer form submission', async () => {
    await page.goto('/customers/new');
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-notification')).toBeVisible();
  });
  test('Error message clarity', async () => {
    await page.goto('/customers/new');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toHaveText([
      'Name is required',
      'Valid email is required'
    ]);
  });
});
test.describe('David (Developer) Tests', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });
  test('API health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });
  test('Network request validation', async () => {
    await page.goto('/customers');
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/customers')),
      page.click('button:has-text("Refresh Data")')
    ]);
    
    expect(request.method()).toBe('GET');
    expect(request.headers()['authorization']).toContain('Bearer');
  });
  test('Console error checks', async () => {
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') messages.push(msg.text());
    });
    await page.goto('/');
    expect(messages).toHaveLength(0);
  });
  test('Performance metrics', async () => {
    await page.goto('/dashboard');
    const metrics = await page.evaluate(() => JSON.stringify(window.performance));
    const perfEntries = JSON.parse(metrics).timing;
    expect(perfEntries.loadEventEnd - perfEntries.navigationStart).toBeLessThan(2000);
    expect(perfEntries.domContentLoadedEventEnd - perfEntries.navigationStart).toBeLessThan(1500);
  });
});
