import { test, expect } from '@playwright/test'

test.describe('Timestamp Converter', () => {
  test('converts Unix timestamp and shows result cards', async ({ page }) => {
    await page.goto('/en/tools/timestamp-converter/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.locator('[data-testid="input"]').fill('1700000000')
    await page.getByRole('button', { name: 'Convert' }).click()

    const resultCards = page.locator('[data-testid="result-card"]')
    await expect(resultCards).toHaveCount(5)
  })
})
