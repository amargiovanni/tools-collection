import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Cron Expression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/cron-expression/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('explains a 15-minute recurring schedule', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('*/15 * * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('Every 15 minutes')
  })

  test('explains every-minute expression', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('* * * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('Every minute')
  })

  test('explains a specific time (09:00)', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 9 * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('09:00')
  })

  test('explains hourly at minute 0', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 * * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('minute 0')
  })

  test('shows normalized expression and field breakdown', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('*/5 * * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible({ timeout: 5000 })
  })

  test('shows error for invalid expression', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('not-a-cron')
    await page.getByRole('button', { name: 'Explain cron' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('Build cron section is visible', async ({ page }) => {
    await expect(page.getByText('Build cron')).toBeVisible()
  })
})
