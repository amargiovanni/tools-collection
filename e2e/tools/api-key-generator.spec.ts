import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('API Key Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/api-key-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates prefixed keys', async ({ page }) => {
    await page.getByLabel('Prefix:').fill('sk_test_')
    await page.getByLabel('Random part length:').fill('24')
    await page.getByLabel('Number of keys:').fill('2')
    await page.getByRole('button', { name: 'Generate API Keys' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/^sk_test_.*\nsk_test_.*$/)
  })
})
