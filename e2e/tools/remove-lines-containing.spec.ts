import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Remove Lines Containing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/remove-lines-containing/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('removes lines containing the specified term', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('keep\nremove this\nkeep')
    await page.locator('[data-testid="input"]').fill('remove')
    await page.getByRole('button', { name: 'Remove Lines' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/keep/, { timeout: 5000 })
    await expect(output).not.toHaveValue(/remove/)
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-lines-containing',
      input: '',
      action: 'Remove Lines',
      expectError: 'Please enter some input',
    })
  })

  test('preserves lines not containing the term', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('alpha\nbeta\ngamma\nbeta')
    await page.locator('[data-testid="input"]').fill('beta')
    await page.getByRole('button', { name: 'Remove Lines' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/alpha/, { timeout: 5000 })
    await expect(output).toHaveValue(/gamma/)
    await expect(output).not.toHaveValue(/beta/)
  })

  test('removes all lines if all contain the term', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('abc\nabc\nabc')
    await page.locator('[data-testid="input"]').fill('abc')
    await page.getByRole('button', { name: 'Remove Lines' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    const value = await output.inputValue()
    expect(value.trim()).toBe('')
  })

  test('removes lines matching multiple comma-separated terms', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('apple\nbanana\ncherry\ndate')
    await page.locator('[data-testid="input"]').fill('apple, cherry')
    await page.getByRole('button', { name: 'Remove Lines' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('banana\ndate', { timeout: 5000 })
  })

  test('case-sensitive toggle controls matching behavior', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('Hello\nhello\nHELLO\nworld')
    await page.locator('[data-testid="input"]').fill('hello')

    // By default caseSensitive is false, so all case variants should be removed
    await page.getByRole('button', { name: 'Remove Lines' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('world', { timeout: 5000 })

    // Now enable case-sensitive mode
    const caseSensitiveCheckbox = page.getByLabel('Case sensitive')
    await caseSensitiveCheckbox.check()

    await page.getByRole('button', { name: 'Remove Lines' }).click()
    // Only "hello" (exact case) should be removed, "Hello" and "HELLO" are kept
    await expect(output).toHaveValue('Hello\nHELLO\nworld', { timeout: 5000 })
  })

  test('shows removed and kept badge counts', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('keep1\nremove1\nkeep2\nremove2')
    await page.locator('[data-testid="input"]').fill('remove')
    await page.getByRole('button', { name: 'Remove Lines' }).click()

    // Badge shows removed and kept counts
    await expect(page.locator('text=Removed lines: 2')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Kept lines: 2')).toBeVisible({ timeout: 5000 })
  })
})
