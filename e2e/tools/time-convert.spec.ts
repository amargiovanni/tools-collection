import { test, expect } from '@playwright/test'

test.describe('Time Convert', () => {
  test('converts seconds and shows result cards', async ({ page }) => {
    await page.goto('/en/tools/time-convert/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.locator('[data-testid="input"]').fill('3600')
    await page.getByRole('button', { name: 'Convert Time' }).click()

    const resultCards = page.locator('[data-testid="result-card"]')
    await expect(resultCards).toHaveCount(6)
  })
})
