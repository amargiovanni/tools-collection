import { test, expect } from '@playwright/test'

test.describe('Hash Generator', () => {
  test('generates hashes and shows result cards', async ({ page }) => {
    await page.goto('/en/tools/hash-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()

    const resultCards = page.locator('[data-testid="result-card"]')
    await expect(resultCards).toHaveCount(3, { timeout: 5000 })
  })
})
