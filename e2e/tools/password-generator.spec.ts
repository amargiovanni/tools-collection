import { test, expect } from '@playwright/test'

test.describe('Password Generator', () => {
  test('generates a password', async ({ page }) => {
    await page.goto('/en/tools/password-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.getByRole('button', { name: 'Generate Password' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty()
    const value = await output.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })
})
