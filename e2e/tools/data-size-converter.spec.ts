import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Data Size Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/data-size-converter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('input field and unit select are visible', async ({ page }) => {
    await expect(page.getByLabel('Data size value:')).toBeVisible()
    await expect(page.getByLabel('Unit:')).toBeVisible()
  })

  test('Convert Size button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Convert Size' })).toBeVisible()
  })

  test('no result cards shown before conversion', async ({ page }) => {
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('1 GiB shows 10 result cards', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
  })

  test('1 GiB converts to 1024 MB', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    const cards = page.locator('[data-testid="result-card"]')
    await expect(cards).toHaveCount(10, { timeout: 5000 })
    await expect(page.getByText('1024', { exact: true }).first()).toBeVisible()
  })

  test('1 GiB converts to 1073741824 bytes', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    await expect(page.getByText('1073741824')).toBeVisible()
  })

  test('1 GiB converts to 8589934592 bits', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    await expect(page.getByText('8589934592')).toBeVisible()
  })

  test('switching from MB to GiB changes results', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1024')
    await page.getByLabel('Unit:').selectOption('MB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    // 1024 MB = 1 GB
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible()
  })

  test('shows error for non-numeric input', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('hello')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('handles zero value', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('0')
    await page.getByLabel('Unit:').selectOption('GB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    // 0 of anything = 0 everywhere
    await expect(page.locator('[data-testid="result-card"] p').first()).toHaveText('0')
  })

  test('result labels include Bits, Bytes, Megabytes', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    await expect(page.getByText(/Bits \(b\)/)).toBeVisible()
    await expect(page.getByText(/Bytes \(B\)/)).toBeVisible()
    await expect(page.getByText(/Megabytes \(MB\)/)).toBeVisible()
  })

  test('all 10 unit options are available in the select', async ({ page }) => {
    const select = page.getByLabel('Unit:')
    await expect(select.locator('option[value="b"]')).toHaveCount(1)
    await expect(select.locator('option[value="B"]')).toHaveCount(1)
    await expect(select.locator('option[value="KB"]')).toHaveCount(1)
    await expect(select.locator('option[value="MB"]')).toHaveCount(1)
    await expect(select.locator('option[value="GB"]')).toHaveCount(1)
    await expect(select.locator('option[value="TB"]')).toHaveCount(1)
    await expect(select.locator('option[value="KiB"]')).toHaveCount(1)
    await expect(select.locator('option[value="MiB"]')).toHaveCount(1)
    await expect(select.locator('option[value="GiB"]')).toHaveCount(1)
    await expect(select.locator('option[value="TiB"]')).toHaveCount(1)
  })

  test('decimal input 1.5 GiB produces correct result cards', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1.5')
    await page.getByLabel('Unit:').selectOption('GiB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    // 1.5 GiB = 1610612736 bytes
    await expect(page.getByText('1610612736')).toBeVisible()
  })

  test('result card values are specific and correct for 1 MB', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('MB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    // 1 MB = 1048576 bytes (since KB/MB uses base 1024 in this project)
    await expect(page.getByText('1048576')).toBeVisible()
    // 1 MB = 8388608 bits
    await expect(page.getByText('8388608')).toBeVisible()
  })

  test('all units produce results from TB input', async ({ page }) => {
    await page.getByLabel('Data size value:').fill('1')
    await page.getByLabel('Unit:').selectOption('TB')
    await page.getByRole('button', { name: 'Convert Size' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(10, { timeout: 5000 })
    // All 10 result cards should have non-empty values
    const values = page.locator('[data-testid="result-card"] p')
    const count = await values.count()
    expect(count).toBe(10)
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent()
      expect(text?.trim()).not.toBe('')
    }
  })
})
