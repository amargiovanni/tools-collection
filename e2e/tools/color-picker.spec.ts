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

  test('shows HSL output for #FF5733', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FF5733')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    // RGB(255, 87, 51) -> HSL(11, 100%, 60%)
    await expect(page.getByText(/hsl\(11, 100%, 60%\)/)).toBeVisible()
  })

  test('parses HSL input directly', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('hsl(11, 100%, 60%)')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('#FF5733')).toBeVisible()
  })

  test('shows RGBA output for #FF5733', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FF5733')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('rgba(255, 87, 51, 1)')).toBeVisible()
  })

  test('specific RGB values for pure red #FF0000', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#FF0000')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('rgb(255, 0, 0)')).toBeVisible()
    await expect(page.getByText('hsl(0, 100%, 50%)')).toBeVisible()
    await expect(page.getByText('rgba(255, 0, 0, 1)')).toBeVisible()
  })

  test('specific RGB values for pure green #00FF00', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#00FF00')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('rgb(0, 255, 0)')).toBeVisible()
    await expect(page.getByText('hsl(120, 100%, 50%)')).toBeVisible()
  })

  test('specific RGB values for pure blue #0000FF', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('#0000FF')
    await page.getByRole('button', { name: 'Convert Color' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(4, { timeout: 5000 })
    await expect(page.getByText('rgb(0, 0, 255)')).toBeVisible()
    await expect(page.getByText('hsl(240, 100%, 50%)')).toBeVisible()
  })
})
