import { test, expect } from '@playwright/test'

test.describe('Regex Tester', () => {
  test('matches pattern with case-insensitive flag', async ({ page }) => {
    await page.goto('/en/tools/regex-tester/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const patternInput = page.locator('[data-testid="input"]')
    await patternInput.fill('test')

    const caseFlag = page.getByLabel('Ignore Case (i)')
    await caseFlag.check()

    const textarea = page.locator('[data-testid="textarea"]')
    await textarea.fill('Test test TEST')

    const button = page.getByRole('button', { name: 'Test Regex' })
    await button.click()

    await expect(page.getByText('Matches found: 3')).toBeVisible()
  })

  test('shows error on empty pattern', async ({ page }) => {
    await page.goto('/en/tools/regex-tester/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const button = page.getByRole('button', { name: 'Test Regex' })
    await button.click()

    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(statusMessage).toBeVisible()
  })
})
