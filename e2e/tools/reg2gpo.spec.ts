import { test, expect } from '@playwright/test'

const REGISTRY_INPUT = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\Software\\Example]
"Enabled"=dword:00000001`

test.describe('Reg2GPO', () => {
  test('converts registry entries to GPO XML', async ({ page }) => {
    await page.goto('/en/tools/reg2gpo/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(REGISTRY_INPUT)

    const button = page.getByRole('button', { name: 'Generate GPO XML' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/<Collection/)
  })

  test('shows error on empty input', async ({ page }) => {
    await page.goto('/en/tools/reg2gpo/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const button = page.getByRole('button', { name: 'Generate GPO XML' })
    await button.click()

    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(statusMessage).toBeVisible()
  })
})
