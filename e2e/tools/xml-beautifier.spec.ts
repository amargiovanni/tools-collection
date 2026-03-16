import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('XML Beautifier', () => {
  test('formats XML and shows validity', async ({ page }) => {
    await page.goto('/en/tools/xml-beautifier/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('<root><item>x</item></root>')

    const button = page.getByRole('button', { name: 'Format XML' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/<item>/)

    await expect(page.getByText('Valid XML')).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'xml-beautifier',
      input: '',
      action: 'Format XML',
      expectError: 'Please enter some input',
    })
  })
})
