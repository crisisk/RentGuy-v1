import { test, expect } from '@playwright/test'

const personas = [
  {
    name: 'CFO',
    credentials: { user: 'rentguy', password: 'rentguy' },
    checklistExpectations: ['Activeer finance insights'],
  },
  {
    name: 'Compliance',
    credentials: { user: 'bart', password: 'mr-dj' },
    checklistExpectations: ['Upload veiligheidsdossier'],
  },
  {
    name: 'Support',
    credentials: { user: 'bart', password: 'mr-dj' },
    checklistExpectations: ['Koppel ticketing'],
  },
]

test.describe('Onboarding happy paths', () => {
  for (const persona of personas) {
    test(`persona ${persona.name} kan onboarding doorlopen`, async ({ page }) => {
      await page.goto(process.env.E2E_BASE_URL ?? 'http://localhost:5173')

      await page.getByLabel('E-mailadres of gebruikersnaam').fill(persona.credentials.user)
      await page.getByLabel('Wachtwoord').fill(persona.credentials.password)
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login') && resp.ok()),
        page.getByRole('button', { name: /Inloggen/i }).click(),
      ])

      await page.waitForResponse(resp => resp.url().includes('/api/v1/auth/me'))
      await page.waitForSelector('text=Onboarding cockpit')

      for (const expectation of persona.checklistExpectations) {
        await expect(page.getByRole('heading', { name: expectation })).toBeVisible()
      }

      const snoozeButton = page.getByRole('button', { name: /Later doorgaan/i })
      await expect(snoozeButton).toBeVisible()
      await page.getByRole('button', { name: /Voortgang verversen/i }).click({ force: true })
    })
  }
})

test.describe('Onboarding edge cases', () => {
  test('toont foutmelding bij onboarding API storing', async ({ page }) => {
    await page.route('**/api/v1/onboarding/steps', route => route.fulfill({ status: 503, body: 'Service unavailable' }))
    await page.goto(process.env.E2E_BASE_URL ?? 'http://localhost:5173')
    await page.getByLabel('E-mailadres of gebruikersnaam').fill('bart')
    await page.getByLabel('Wachtwoord').fill('mr-dj')
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/auth/login')),
      page.getByRole('button', { name: /Inloggen/i }).click(),
    ])
    await expect(page.getByRole('alert')).toContainText('onboarding niet beschikbaar')
  })
})
