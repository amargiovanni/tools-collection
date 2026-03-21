import { test, expect } from '@playwright/test'

test.describe('Cron Expression', () => {
  test('explains a simple recurring schedule', async ({ page }) => {
    await page.goto('/en/tools/cron-expression/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.locator('[data-testid="input"]').fill('*/15 * * * *')
    await page.getByRole('button', { name: 'Explain cron' }).click()

    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('Every 15 minutes')
  })
})
