import { test, expect } from '@playwright/test'

test.describe('Username Generator', () => {
  test('generates usernames', async ({ page }) => {
    await page.goto('/en/tools/username-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.getByRole('button', { name: 'Generate Usernames' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty()
  })
})
