import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Remove Duplicate Lines', () => {
  test('removes duplicate lines from input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: 'a\nb\na',
      action: 'Remove Duplicates',
      expectOutput: 'a\nb',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: '',
      action: 'Remove Duplicates',
      expectError: 'Please enter some input',
    })
  })

  test('keeps order of first occurrence', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: 'b\na\nb\na',
      action: 'Remove Duplicates',
      expectOutput: 'b\na',
    })
  })

  test('handles input with no duplicates unchanged', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: 'x\ny\nz',
      action: 'Remove Duplicates',
      expectOutput: 'x\ny\nz',
    })
  })

  test('handles multiple occurrences of the same line', async ({ page }) => {
    await page.goto('/en/tools/remove-duplicate-lines/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill('a\na\na\na')
    await page.getByRole('button', { name: 'Remove Duplicates' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('a', { timeout: 5000 })
  })
})
