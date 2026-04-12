import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Regex Tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/regex-tester/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('matches pattern with case-insensitive flag', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('test')
    await page.getByLabel('Ignore Case (i)').check()
    await page.locator('[data-testid="textarea"]').fill('Test test TEST')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 3')).toBeVisible({ timeout: 5000 })
  })

  test('shows error on empty pattern', async ({ page }) => {
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('finds exact match count without flags', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('hello')
    await page.locator('[data-testid="textarea"]').fill('hello world hello')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 2')).toBeVisible({ timeout: 5000 })
  })

  test('shows zero matches when pattern not found', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('xyz123')
    await page.locator('[data-testid="textarea"]').fill('hello world')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('No matches found')).toBeVisible({ timeout: 5000 })
  })

  test('supports regex metacharacters', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('\\d+')
    await page.locator('[data-testid="textarea"]').fill('abc 123 def 456')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 2')).toBeVisible({ timeout: 5000 })
  })

  test('shows error for invalid regex pattern', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('(unclosed')
    await page.locator('[data-testid="textarea"]').fill('test')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('global flag finds multiple matches', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('cat')
    // Global is checked by default
    await expect(page.getByLabel('Global (g)')).toBeChecked()
    await page.locator('[data-testid="textarea"]').fill('cat sat on cat mat cat')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 3')).toBeVisible({ timeout: 5000 })
  })

  test('case-insensitive flag matches regardless of case', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('ABC')
    await page.getByLabel('Ignore Case (i)').check()
    await page.locator('[data-testid="textarea"]').fill('abc ABC Abc')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 3')).toBeVisible({ timeout: 5000 })
  })

  test('multiline flag makes ^ and $ match line boundaries', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('^start')
    await page.getByLabel('Multiline (m)').check()
    await page.locator('[data-testid="textarea"]').fill('start here\nnot here\nstart again')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    await expect(page.getByText('Matches found: 2')).toBeVisible({ timeout: 5000 })
  })

  test('match count is displayed correctly for complex patterns', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('[aeiou]')
    await page.locator('[data-testid="textarea"]').fill('hello')
    await page.getByRole('button', { name: 'Test Regex' }).click()
    // "hello" has vowels: e, o = 2 matches
    await expect(page.getByText('Matches found: 2')).toBeVisible({ timeout: 5000 })
  })
})
