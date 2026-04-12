import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Remove Line Breaks', () => {
  test('removes line breaks and joins with space', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-line-breaks',
      input: 'a\nb\nc',
      action: 'Remove Line Breaks',
      expectOutput: 'a b c',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-line-breaks',
      input: '',
      action: 'Remove Line Breaks',
      expectError: 'Please enter some input',
    })
  })

  test('handles single line (no breaks to remove)', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-line-breaks',
      input: 'single line',
      action: 'Remove Line Breaks',
      expectOutput: 'single line',
    })
  })

  test.describe('replacement options', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/tools/remove-line-breaks/', { waitUntil: 'networkidle' })
      await waitForHydration(page)
    })

    test('removes multiple consecutive line breaks', async ({ page }) => {
      await page.locator('[data-testid="textarea"]').first().fill('hello\n\nworld')
      await page.getByRole('button', { name: 'Remove Line Breaks' }).click()
      const output = page.locator('[data-testid="output-panel"] textarea')
      const value = await output.inputValue()
      expect(value).not.toContain('\n')
      expect(value).toContain('hello')
      expect(value).toContain('world')
    })

    test('custom replacement joins lines with a custom string', async ({ page }) => {
      await page.locator('[data-testid="textarea"]').first().fill('a\nb\nc')

      // Select the "Custom:" option from the replacement dropdown
      const select = page.locator('[data-testid="select"]')
      await select.selectOption('custom')

      // Fill the custom value input that appears
      const customInput = page.locator('[data-testid="input"]')
      await customInput.fill(' | ')

      await page.getByRole('button', { name: 'Remove Line Breaks' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('a | b | c', { timeout: 5000 })
    })

    test('nothing replacement concatenates lines without separator', async ({ page }) => {
      await page.locator('[data-testid="textarea"]').first().fill('a\nb\nc')

      const select = page.locator('[data-testid="select"]')
      await select.selectOption('none')

      await page.getByRole('button', { name: 'Remove Line Breaks' }).click()

      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue('abc', { timeout: 5000 })
    })
  })
})
