import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('AES Key Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/aes-key-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates an AES-256 key by default', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate AES Key' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(2, { timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"] p').first()).toHaveText(/^[0-9A-F]{64}$/)
  })

  test('can switch to AES-128 and generate a shorter key', async ({ page }) => {
    await page.getByLabel('Key size:').selectOption('128')
    await page.getByRole('button', { name: 'Generate AES Key' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(2, { timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"] p').first()).toHaveText(/^[0-9A-F]{32}$/)
  })
})
