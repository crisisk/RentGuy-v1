import { test, expect } from '@playwright/test';
// Tom's Test Suite
test.describe('Tom - Technicus Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.getByTestId('login-username').fill('tom');
    await page.getByTestId('login-password').fill('techPassword');
    await page.getByTestId('login-submit').click();
  });
  test('View project details with crew information', async ({ page }) => {
    await page.getByTestId('project-list').first().click();
    
    const projectDetailsSection = page.getByTestId('project-details');
    await expect(projectDetailsSection).toBeVisible();
    
    const crewInfoSection = page.getByTestId('crew-info');
    await expect(crewInfoSection).toBeVisible();
    await expect(crewInfoSection.getByTestId('crew-member')).toHaveCount(3);
  });
  test('Check equipment list for project', async ({ page }) => {
    await page.getByTestId('project-list').first().click();
    
    const equipmentList = page.getByTestId('equipment-list');
    await expect(equipmentList).toBeVisible();
    
    const equipmentItems = equipmentList.getByTestId('equipment-item');
    await expect(equipmentItems).toHaveCountGreaterThan(0);
  });
  test('Add crew notes to project', async ({ page }) => {
    await page.getByTestId('project-list').first().click();
    
    const crewNotesInput = page.getByTestId('crew-notes-input');
    await crewNotesInput.fill('Additional equipment needed for location setup');
    
    const saveNotesButton = page.getByTestId('save-crew-notes');
    await saveNotesButton.click();
    
    await expect(page.getByTestId('crew-notes-success')).toBeVisible();
  });
});
// Carla's Test Suite
test.describe('Carla - Client Relations Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers');
    await page.getByTestId('login-username').fill('carla');
    await page.getByTestId('login-password').fill('clientPassword');
    await page.getByTestId('login-submit').click();
  });
  test('Browse customer list', async ({ page }) => {
    const customerList = page.getByTestId('customer-list');
    await expect(customerList).toBeVisible();
    
    const customerItems = customerList.getByTestId('customer-item');
    await expect(customerItems).toHaveCountGreaterThan(0);
  });
  test('Create new customer', async ({ page }) => {
    const newCustomerButton = page.getByTestId('new-customer-button');
    await newCustomerButton.click();
    const createCustomerForm = page.getByTestId('customer-create-form');
    await createCustomerForm.getByTestId('customer-name').fill('John Doe');
    await createCustomerForm.getByTestId('customer-email').fill('john.doe@example.com');
    await createCustomerForm.getByTestId('customer-phone').fill('1234567890');
    const submitButton = createCustomerForm.getByTestId('submit-customer');
    await submitButton.click();
    await expect(page.getByTestId('customer-create-success')).toBeVisible();
  });
  test('View customer details', async ({ page }) => {
    const firstCustomer = page.getByTestId('customer-list').getByTestId('customer-item').first();
    await firstCustomer.click();
    const customerDetailsSection = page.getByTestId('customer-details');
    await expect(customerDetailsSection).toBeVisible();
    
    await expect(customerDetailsSection.getByTestId('customer-name')).toBeVisible();
    await expect(customerDetailsSection.getByTestId('customer-contact')).toBeVisible();
  });
  test('Log activity for customer', async ({ page }) => {
    const firstCustomer = page.getByTestId('customer-list').getByTestId('customer-item').first();
    await firstCustomer.click();
    const activityLogButton = page.getByTestId('log-activity-button');
    await activityLogButton.click();
    const activityModal = page.getByTestId('activity-log-modal');
    await activityModal.getByTestId('activity-type').selectOption('Call');
    await activityModal.getByTestId('activity-notes').fill('Discussed project timeline');
    const saveActivityButton = activityModal.getByTestId('save-activity');
    await saveActivityButton.click();
    await expect(page.getByTestId('activity-log-success')).toBeVisible();
  });
});
