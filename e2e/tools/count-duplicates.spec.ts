import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Count Duplicates', () => {
  test('counts duplicate lines in input', async ({ page }) => {
    await page.goto('/en/tools/count-duplicates/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('a\nb\na')

    const button = page.getByRole('button', { name: 'Analyze' })
    await button.click()

    await expect(page.getByRole('cell', { name: '2' })).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'count-duplicates',
      input: '',
      action: 'Analyze',
      expectError: 'Please enter some input',
    })
  })
})
