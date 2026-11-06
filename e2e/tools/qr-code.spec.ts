import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('QR Code', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/qr-code/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates a QR code from a URL', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://example.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible({ timeout: 5000 })
  })

  test('shows error on empty input', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('generates QR code from plain text', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('Hello World')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible({ timeout: 5000 })
  })

  test('QR code is an actual image element', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://example.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    const img = page.locator('img[alt="QR Code"]')
    await expect(img).toBeVisible({ timeout: 5000 })
    // Verify it has a src attribute
    const src = await img.getAttribute('src')
    expect(src).toBeTruthy()
  })

  test('different inputs generate different QR codes', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://alpha.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    const img = page.locator('img[alt="QR Code"]')
    await expect(img).toBeVisible({ timeout: 5000 })
    const src1 = await img.getAttribute('src')

    await page.locator('[data-testid="textarea"]').first().fill('https://beta.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(img).toBeVisible({ timeout: 5000 })
    const src2 = await img.getAttribute('src')

    expect(src1).not.toBe(src2)
  })

  test('size select changes the output image dimensions', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://example.com')

    // Generate with 200x200
    await page.getByLabel('Size:').selectOption('200')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    const img = page.locator('img[alt="QR Code"]')
    await expect(img).toBeVisible({ timeout: 5000 })
    const width200 = await img.getAttribute('width')
    expect(width200).toBe('200')

    // Generate with 400x400
    await page.getByLabel('Size:').selectOption('400')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(img).toBeVisible({ timeout: 5000 })
    const width400 = await img.getAttribute('width')
    expect(width400).toBe('400')
  })

  test('download button is visible after generating QR code', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://example.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible({ timeout: 5000 })
    // The download button should appear after generation
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible({ timeout: 5000 })
  })

  test('Download PNG saves a real PNG image', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('https://example.com')
    await page.getByRole('button', { name: 'Generate QR Code' }).click()
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible({ timeout: 5000 })
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('qrcode.png')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const bytes = Buffer.concat(chunks)
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })
})
