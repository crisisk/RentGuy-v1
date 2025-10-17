import { test, expect } from '@playwright/test';
const FRANK_CREDS = { email: 'frank@finance.com', password: 'frank123' };
const SVEN_CREDS = { email: 'sven@admin.com', password: 'sven123' };
async function login(page, user) {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
}
test.describe('Frank Finance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FRANK_CREDS);
  });
  test('View invoice list', async ({ page }) => {
    await page.click('text=Invoices');
    await expect(page.locator('.invoice-list')).toBeVisible();
  });
  test('Create invoice', async ({ page }) => {
    await page.click('text=Create Invoice');
    await page.fill('#client', 'Client XYZ');
    await page.fill('#amount', '1500');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-alert')).toContainText('created');
    await expect(page.locator('.invoice-item:last-child')).toContainText('Client XYZ');
  });
  test('Filter invoices by status', async ({ page }) => {
    await page.click('text=Invoices');
    await page.selectOption('#status-filter', 'paid');
    await expect(page.locator('.invoice-item')).toHaveCount(2);
  });
  test('Convert quote to invoice', async ({ page }) => {
    await page.click('text=Quotes');
    await page.locator('.quote-item:first-child .convert-btn').click();
    await page.click('text=Confirm Conversion');
    await expect(page.locator('.invoice-details')).toBeVisible();
  });
});
test.describe('Sven Admin Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SVEN_CREDS);
  });
  test('Access admin panel', async ({ page }) => {
    await page.click('text=Admin Dashboard');
    await expect(page.locator('.admin-header')).toBeVisible();
  });
  test('List users', async ({ page }) => {
    await page.click('text=User Management');
    await expect(page.locator('.users-table tbody tr')).toHaveCountGreaterThan(0);
  });
  test('Create user', async ({ page }) => {
    await page.click('text=Add User');
    await page.fill('#email', 'new.user@company.com');
    await page.fill('#name', 'New User');
    await page.click('button[type="submit"]');
    await expect(page.locator('.user-list')).toContainText('New User');
  });
  test('Update user role', async ({ page }) => {
    await page.click('text=User Management');
    const userRow = page.locator('tr:has-text("user@company.com")');
    await userRow.locator('.edit-btn').click();
    await page.selectOption('#role', 'manager');
    await page.click('text=Save Changes');
    await expect(page.locator('.role-badge')).toContainText('Manager');
  });
  test('View system settings', async ({ page }) => {
    await page.click('text=System Settings');
    await expect(page.locator('.settings-form')).toBeVisible();
  });
});
