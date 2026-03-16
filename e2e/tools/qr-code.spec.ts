import { test, expect } from '@playwright/test'

test.describe('QR Code', () => {
  test('generates a QR code from a URL', async ({ page }) => {
    await page.goto('/en/tools/qr-code/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('https://example.com')

    const button = page.getByRole('button', { name: 'Generate QR Code' })
    await button.click()

    const qrImage = page.locator('img[alt="QR Code"]')
    await expect(qrImage).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await page.goto('/en/tools/qr-code/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const button = page.getByRole('button', { name: 'Generate QR Code' })
    await button.click()

    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(statusMessage).toBeVisible()
  })
})
