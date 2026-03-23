import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Count Duplicates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/count-duplicates/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('counts duplicate lines in input', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('a\nb\na')
    await page.getByRole('button', { name: 'Analyze' }).click()
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

  test('counts correctly with multiple duplicates', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('x\nx\nx\ny\ny')
    await page.getByRole('button', { name: 'Analyze' }).click()
    await expect(page.getByRole('cell', { name: '3' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('cell', { name: '2' })).toBeVisible()
  })

  test('shows value "1" for unique lines', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('a\nb\nc')
    await page.getByRole('button', { name: 'Analyze' }).click()
    // All lines appear once - count cells showing 1
    const cells = page.getByRole('cell', { name: '1', exact: true })
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
  })

  test('shows a result table after analysis', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('apple\nbanana\napple')
    await page.getByRole('button', { name: 'Analyze' }).click()
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
  })
})
