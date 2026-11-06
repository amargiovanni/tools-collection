import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SAMPLE_HEIC = fileURLToPath(new URL('../fixtures/sample.heic', import.meta.url))

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('HEIC to JPG', () => {
  let consoleMessages: string[]

  test.beforeEach(async ({ page }) => {
    consoleMessages = []
    page.on('console', (msg) => consoleMessages.push(msg.text()))
    await page.goto('/en/tools/heic-to-jpg/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('converts a HEIC photo to JPG under the CSP', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_HEIC)

    const list = page.locator('[data-testid="heic-file-list"]')
    await expect(list.getByText('Converted')).toBeVisible({ timeout: 30000 })
    await expect(list.locator('img[alt="sample.jpg"]')).toBeVisible()
    // Completion is announced to assistive technology, not only shown
    await expect(page.getByRole('status').filter({ hasText: 'sample.heic' })).toContainText('Converted')

    const downloadPromise = page.waitForEvent('download')
    await list.getByRole('button', { name: 'Download sample.jpg' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('sample.jpg')

    // libheif runs as WebAssembly in a blob: worker: the policy must allow both
    expect(consoleMessages.filter((m) => m.includes('Content Security Policy') || m.includes('Refused to'))).toEqual([])
  })

  test('converts several photos and offers a ZIP download', async ({ page }) => {
    const buffer = readFileSync(SAMPLE_HEIC)
    await page.locator('input[type="file"]').setInputFiles([
      { name: 'first.heic', mimeType: 'image/heic', buffer },
      { name: 'second.heic', mimeType: 'image/heic', buffer },
    ])

    const list = page.locator('[data-testid="heic-file-list"]')
    await expect(list.getByText('Converted')).toHaveCount(2, { timeout: 30000 })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download all (ZIP)' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('heic-to-jpg.zip')
  })

  test('rejects files that are not HEIC', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: 'fake.heic',
      mimeType: 'image/heic',
      buffer: Buffer.from('this is not an image'),
    })

    await expect(page.locator('[data-testid="heic-file-list"]').getByText('The file is not a HEIC/HEIF image')).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'fake.heic' })).toContainText('The file is not a HEIC/HEIF image')
  })
})
