import { test, expect } from "@playwright/test";
test.describe("Bart (Manager) Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email"]', 'bart@example.com');
    await page.fill('[data-testid="password"]', 'manager123');
    await page.click('[data-testid="submit"]');
    await page.waitForURL(/dashboard/);
  });
  test("should load dashboard with project stats", async ({ page }) => {
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('total-projects')).toContainText('Projects');
    await expect(page.getByTestId('active-projects')).toBeVisible();
    await expect(page.getByTestId('completed-projects')).toBeVisible();
  });
  test("should filter projects by status", async ({ page }) => {
    await page.selectOption('[data-testid="project-status-filter"]', 'active');
    await expect(page.getByTestId('project-item')).toHaveCount(3);
    
    await page.selectOption('[data-testid="project-status-filter"]', 'completed');
    await expect(page.getByTestId('project-item')).toHaveCount(1);
  });
  test("should see revenue overview chart", async ({ page }) => {
    await expect(page.getByTestId('revenue-chart')).toBeVisible();
    await expect(page.getByTestId('chart-legend')).toContainText('Revenue');
  });
  test("should navigate to project details", async ({ page }) => {
    await page.click('[data-testid="project-link-1"]');
    await page.waitForURL(/projects\/1/);
    await expect(page.getByTestId('project-title')).toContainText('Project 1');
  });
  test.afterAll(async ({ browser }) => {
    await browser.close();
  });
});
test.describe("Anna (Planner) Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email"]', 'anna@example.com');
    await page.fill('[data-testid="password"]', 'planner123');
    await page.click('[data-testid="submit"]');
    await page.waitForURL(/projects/);
  });
  test("should create new project", async ({ page }) => {
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name"]', 'New Website Launch');
    await page.click('[data-testid="project-submit"]');
    await expect(page.getByTestId('success-notification')).toBeVisible();
  });
  test("should edit project dates", async ({ page }) => {
    await page.click('[data-testid="project-link-1"]');
    await page.click('[data-testid="edit-dates-button"]');
    await page.fill('[data-testid="start-date"]', '2024-03-01');
    await page.fill('[data-testid="end-date"]', '2024-03-15');
    await page.click('[data-testid="save-dates-button"]');
    await expect(page.getByTestId('date-range')).toContainText('Mar 1 - Mar 15');
  });
  test("should view project timeline", async ({ page }) => {
    await page.click('[data-testid="project-link-1"]');
    await page.click('[data-testid="timeline-tab"]');
    await expect(page.getByTestId('timeline-view')).toBeVisible();
  });
  test("should add timeline event", async ({ page }) => {
    await page.click('[data-testid="project-link-1"]');
    await page.click('[data-testid="timeline-tab"]');
    await page.click('[data-testid="add-event-button"]');
    await page.fill('[data-testid="event-title"]', 'Client Review');
    await page.click('[data-testid="event-submit"]');
    await expect(page.getByTestId('timeline-event')).toContainText('Client Review');
  });
  test.afterAll(async ({ browser }) => {
    await browser.close();
  });
});
