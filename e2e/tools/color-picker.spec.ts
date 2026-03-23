import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Color Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/color-picker/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('converts hex color and shows 4 result cards', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FF5733')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
  })

  test('shows RGB representation for #FF5733', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FF5733')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('rgb(255, 87, 51)')).toBeVisible()
  })

  test('shows error for invalid color input', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('not-a-color')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('converts white (#FFFFFF) correctly', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FFFFFF')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
  })

  test('converts black (#000000) correctly', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#000000')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
  })

  test('lowercase hex input works', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#ff5733')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
  })
})
