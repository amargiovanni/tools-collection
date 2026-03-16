import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Convert Case', () => {
  test('converts text to uppercase by default', async ({ page }) => {
    await toolTest(page, {
      toolId: 'convert-case',
      input: 'hello world',
      action: 'Convert',
      expectOutput: 'HELLO WORLD',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'convert-case',
      input: '',
      action: 'Convert',
      expectError: 'Please enter some input',
    })
  })

  test('converts text to camelCase', async ({ page }) => {
    await page.goto('/en/tools/convert-case/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('hello world')

    const select = page.locator('[data-testid="select"]')
    await select.selectOption('camel')

    const button = page.getByRole('button', { name: 'Convert' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('helloWorld')
  })
})
