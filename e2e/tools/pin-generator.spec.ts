import { test, expect } from '@playwright/test'

test.describe('PIN Generator', () => {
  test('generates numeric PINs', async ({ page }) => {
    await page.goto('/en/tools/pin-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    await page.getByRole('button', { name: 'Generate PINs' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty()
    const value = await output.inputValue()
    const lines = value.split('\n').filter((line: string) => line.trim() !== '')
    for (const line of lines) {
      expect(line.trim()).toMatch(/^\d+$/)
    }
  })
})
