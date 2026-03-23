import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Time Convert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/time-convert/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('converts 3600 seconds and shows 6 result cards', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('3600')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(6, { timeout: 5000 })
  })

  test('3600 seconds = 60 minutes', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('3600')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(6, { timeout: 5000 })
    await expect(page.getByText('60', { exact: true })).toBeVisible()
  })

  test('3600 seconds = 1 hour', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('3600')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(6, { timeout: 5000 })
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible()
  })

  test('3600 seconds formats as 01:00:00', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('3600')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(6, { timeout: 5000 })
    await expect(page.getByText('01:00:00')).toBeVisible()
  })

  test('shows error on non-numeric input', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('abc')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('unit select shows all 5 units', async ({ page }) => {
    const select = page.getByLabel('Unit:')
    await expect(select.locator('option[value="ms"]')).toHaveCount(1)
    await expect(select.locator('option[value="s"]')).toHaveCount(1)
    await expect(select.locator('option[value="min"]')).toHaveCount(1)
    await expect(select.locator('option[value="h"]')).toHaveCount(1)
    await expect(select.locator('option[value="d"]')).toHaveCount(1)
  })

  test('60 minutes = 1 hour when input unit is minutes', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('60')
    await page.getByLabel('Unit:').selectOption('min')
    await page.getByRole('button', { name: 'Convert Time' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(6, { timeout: 5000 })
    await expect(page.getByText('01:00:00')).toBeVisible()
  })
})
