// tests/e2e/onboarding_rentguy.spec.ts
import { test, expect } from '@playwright/test'

const inventoryFixture = 'fixtures/inventory_minimal.csv'

test.describe('RentGuy Onboarding', () => {
  test('Planner → create first rentable job with deposit & invoice', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/Work email/i).fill(process.env.TEST_EMAIL ?? 'planner@example.com')
    await page.getByLabel(/Password/i).fill(process.env.TEST_PASSWORD ?? 'SuperSecret123!')
    await page.getByRole('button', { name: /create account/i }).click()

    await page.getByLabel(/Company name/i).fill('Mr-DJ Events')
    await page.getByRole('button', { name: /continue/i }).click()

    await page.goto('/onboarding/inventory')
    await page.setInputFiles('input[type=file]', inventoryFixture)
    await page.getByRole('button', { name: /import/i }).click()
    await expect(page.getByText(/import successful/i)).toBeVisible()

    await page.goto('/jobs/new')
    await page.getByLabel(/Event name/i).fill('Wedding – Breda')
    await page.getByLabel(/Date/i).fill('2025-12-20')
    await page.getByRole('button', { name: /create/i }).click()

    await page.getByRole('button', { name: /add items/i }).click()
    await page.getByText('DJ Set Basic').click()
    await page.getByRole('button', { name: /done/i }).click()
    await page.getByRole('button', { name: /assign crew/i }).click()
    await page.getByText(/Bart \(DJ\)/i).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    await page.getByRole('button', { name: /send quote/i }).click()
    await expect(page.getByText(/quote sent/i)).toBeVisible()
    await page.getByRole('button', { name: /capture deposit/i }).click()
    await expect(page.getByText(/deposit captured/i)).toBeVisible()
    await page.getByRole('button', { name: /generate invoice/i }).click()
    await expect(page.getByText(/invoice (RG-|#|created)/i)).toBeVisible()
  })
})
