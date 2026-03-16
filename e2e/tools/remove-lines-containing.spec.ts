import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Remove Lines Containing', () => {
  test('removes lines containing the specified term', async ({ page }) => {
    await page.goto('/en/tools/remove-lines-containing/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('keep\nremove this\nkeep')

    const input = page.locator('[data-testid="input"]')
    await input.fill('remove')

    const button = page.getByRole('button', { name: 'Remove Lines' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/keep/)
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-lines-containing',
      input: '',
      action: 'Remove Lines',
      expectError: 'Please enter some input',
    })
  })
})
