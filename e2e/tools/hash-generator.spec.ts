import { test, expect, type Page } from '@playwright/test'

const SHA256_OF_TEST = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Hash Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/hash-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates 3 result cards (SHA-1, SHA-256, SHA-512)', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
  })

  test('shows SHA-1, SHA-256, SHA-512 labels', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    await expect(page.getByText('SHA-1')).toBeVisible()
    await expect(page.getByText('SHA-256')).toBeVisible()
    await expect(page.getByText('SHA-512')).toBeVisible()
  })

  test('SHA-256 of "test" matches known value', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    await expect(page.getByText(SHA256_OF_TEST)).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
  })

  test('different inputs produce different SHA-256 hashes', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    const first = await page.locator('[data-testid="result-card"]').nth(1).textContent()

    await textarea.fill('different')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    const second = await page.locator('[data-testid="result-card"]').nth(1).textContent()

    expect(first).not.toBe(second)
  })

  test('SHA-256 output is a 64-character hex string', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('hello')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    const sha256Card = page.locator('[data-testid="result-card"]').nth(1)
    const text = await sha256Card.textContent()
    expect(text).toMatch(/[0-9a-f]{64}/)
  })
})
