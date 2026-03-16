import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('JSON Formatter', () => {
  test('formats JSON and shows validity', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('{"a":1}')

    const button = page.getByRole('button', { name: 'Format JSON' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/a/)

    await expect(page.getByText('Valid JSON')).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'json-formatter',
      input: '',
      action: 'Format JSON',
      expectError: 'Please enter some input',
    })
  })
})
