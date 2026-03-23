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
})
