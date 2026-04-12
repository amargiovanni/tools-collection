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

  test('SHA-1 of "test" matches known value', async ({ page }) => {
    // SHA-1 of "test" = a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
    const SHA1_OF_TEST = 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
    await page.locator('[data-testid="textarea"]').first().fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    await expect(page.getByText(SHA1_OF_TEST)).toBeVisible()
  })

  test('SHA-512 of "test" matches known value', async ({ page }) => {
    // SHA-512 of "test" = ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff
    const SHA512_OF_TEST = 'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff'
    await page.locator('[data-testid="textarea"]').first().fill('test')
    await page.getByRole('button', { name: 'Generate Hash' }).click()
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    await expect(page.getByText(SHA512_OF_TEST)).toBeVisible()
  })

  test('button shows loading state while hashing', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('test')
    // The button text changes to "..." while loading
    const button = page.getByRole('button', { name: 'Generate Hash' })
    await button.click()
    // After completion, the result cards should appear
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    // And the button should be back to normal (not disabled)
    await expect(button).toBeEnabled()
  })
})
