import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

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

  test.describe('case conversion options', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/tools/convert-case/', { waitUntil: 'networkidle' })
      await waitForHydration(page)
    })

    test('converts text to camelCase', async ({ page }) => {
      const textarea = page.locator('[data-testid="textarea"]').first()
      await textarea.fill('hello world')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('camel')

      const button = page.getByRole('button', { name: 'Convert' })
      await button.click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('helloWorld')
    })

    test('converts text to lowercase', async ({ page }) => {
      const textarea = page.locator('[data-testid="textarea"]').first()
      await textarea.fill('HELLO WORLD')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('lower')

      await page.getByRole('button', { name: 'Convert' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('hello world', { timeout: 5000 })
    })

    test('converts text to Title Case', async ({ page }) => {
      const textarea = page.locator('[data-testid="textarea"]').first()
      await textarea.fill('hello world')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('title')

      await page.getByRole('button', { name: 'Convert' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('Hello World', { timeout: 5000 })
    })

    test('converts text to snake_case', async ({ page }) => {
      const textarea = page.locator('[data-testid="textarea"]').first()
      await textarea.fill('hello world')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('snake')

      await page.getByRole('button', { name: 'Convert' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('hello_world', { timeout: 5000 })
    })

    test('converts text to CONSTANT_CASE', async ({ page }) => {
      const textarea = page.locator('[data-testid="textarea"]').first()
      await textarea.fill('hello world')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('constant')

      await page.getByRole('button', { name: 'Convert' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('HELLO_WORLD', { timeout: 5000 })
    })
  })
})
