import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Timestamp Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/timestamp-converter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('converts Unix timestamp and shows 5 result cards', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('1700000000')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
  })

  test('shows ISO 8601 format for 1700000000', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('1700000000')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText(/2023-11-14/)).toBeVisible()
  })

  test('shows Unix milliseconds for 1700000000', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('1700000000')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText('1700000000000')).toBeVisible()
  })

  test('Use Current Timestamp button fills the input', async ({ page }) => {
    await page.getByRole('button', { name: 'Use Current Timestamp' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    const inputValue = await page.locator('[data-testid="input"]').inputValue()
    expect(Number(inputValue)).toBeGreaterThan(1700000000)
  })

  test('shows error for non-numeric input', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('not-a-timestamp')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('epoch 0 converts to 1970-01-01', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText(/1970-01-01/)).toBeVisible()
  })

  test('result card labels include ISO 8601 and UTC', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('1700000000')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText('ISO 8601')).toBeVisible()
    await expect(page.getByText('UTC')).toBeVisible()
  })

  test('Use Current Timestamp button produces ISO output with current year', async ({ page }) => {
    await page.getByRole('button', { name: 'Use Current Timestamp' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    const currentYear = new Date().getFullYear().toString()
    // ISO 8601 card should contain the current year
    const isoCard = page.locator('[data-testid="result-card"]').nth(2)
    await expect(isoCard).toContainText(currentYear)
  })

  test('ISO 8601 output for epoch 0 is exactly 1970-01-01T00:00:00.000Z', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText('1970-01-01T00:00:00.000Z')).toBeVisible()
  })

  test('UTC output for epoch 0 contains Thu, 01 Jan 1970', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0')
    await page.getByRole('button', { name: 'Convert' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(5, { timeout: 5000 })
    await expect(page.getByText(/Thu, 01 Jan 1970/)).toBeVisible()
  })
})
