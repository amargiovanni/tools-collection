import { test, expect, type Page } from '@playwright/test'

const SIMPLE_CSV = 'name,age,city\nAlice,30,Rome\nBob,25,Milan\nCharlie,35,Naples'
const SEMICOLON_CSV = 'product;price;qty\nApple;1.20;100\nBanana;0.50;200'
const QUOTED_CSV = 'name,description\nAlice,"hello, world"\nBob,"say ""hi"""'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('CSV Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/csv-viewer/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('renders table with correct headers from comma-delimited CSV', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('th').filter({ hasText: 'name' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'age' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'city' })).toBeVisible()
  })

  test('renders correct number of data rows', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(3, { timeout: 5000 })
  })

  test('shows row count label', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await expect(page.getByText('3 rows')).toBeVisible({ timeout: 5000 })
  })

  test('cell data is visible', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await expect(page.locator('td').filter({ hasText: 'Alice' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('td').filter({ hasText: 'Rome' })).toBeVisible()
  })

  test('detects semicolon delimiter', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SEMICOLON_CSV)
    await expect(page.locator('th').filter({ hasText: 'product' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('th').filter({ hasText: 'price' })).toBeVisible()
    await expect(page.locator('td').filter({ hasText: 'Apple' })).toBeVisible()
  })

  test('handles quoted fields containing delimiter', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(QUOTED_CSV)
    await expect(page.locator('td').filter({ hasText: 'hello, world' })).toBeVisible({ timeout: 5000 })
  })

  test('handles escaped double quotes inside quoted fields', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(QUOTED_CSV)
    await expect(page.locator('td').filter({ hasText: 'say "hi"' })).toBeVisible({ timeout: 5000 })
  })

  test('clicking column header sorts rows ascending', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await page.locator('th').filter({ hasText: 'name' }).click()
    const firstCell = page.locator('tbody tr').first().locator('td').first()
    await expect(firstCell).toHaveText('Alice', { timeout: 5000 })
  })

  test('clicking column header twice sorts rows descending', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    const nameHeader = page.locator('th').filter({ hasText: 'name' })
    await nameHeader.click()
    await nameHeader.click()
    const firstCell = page.locator('tbody tr').first().locator('td').first()
    await expect(firstCell).toHaveText('Charlie', { timeout: 5000 })
  })

  test('clicking column header third time resets sort order', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    const nameHeader = page.locator('th').filter({ hasText: 'name' })
    await nameHeader.click()
    await nameHeader.click()
    await nameHeader.click()
    // Back to original order — first row should be Alice
    const firstCell = page.locator('tbody tr').first().locator('td').first()
    await expect(firstCell).toHaveText('Alice', { timeout: 5000 })
  })

  test('sorts numeric column numerically (not lexicographically)', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await page.locator('th').filter({ hasText: 'age' }).click()
    // Ascending: 25, 30, 35 → Bob first
    const firstCell = page.locator('tbody tr').first().locator('td').nth(1)
    await expect(firstCell).toHaveText('25', { timeout: 5000 })
  })

  test('Export as JSON button is visible', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(SIMPLE_CSV)
    await expect(page.getByRole('button', { name: /export as json/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows no-data message when input is empty', async ({ page }) => {
    await expect(page.getByText('No data to display')).toBeVisible()
  })
})
