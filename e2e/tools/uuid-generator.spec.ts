import { test, expect, type Page } from '@playwright/test'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('UUID / ULID Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/uuid-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('page loads with one UUID v4, v7 and one ULID visible', async ({ page }) => {
    const codes = page.locator('code')
    await expect(codes).toHaveCount(3, { timeout: 5000 })
  })

  test('Generate button creates a valid UUID v4', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const firstCode = page.locator('code').first()
    const text = await firstCode.textContent()
    expect(text?.trim()).toMatch(UUID_V4_RE)
  })

  test('Generate 10 creates 10 results per type (30 total codes)', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate 10' }).click()
    const codes = page.locator('code')
    await expect(codes).toHaveCount(30, { timeout: 5000 })
  })

  test('UUID v4 section shows valid v4 format', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const firstCode = page.locator('code').first()
    const text = await firstCode.textContent()
    expect(text?.trim()).toMatch(UUID_V4_RE)
  })

  test('UUID v7 section shows valid v7 format', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const secondCode = page.locator('code').nth(1)
    const text = await secondCode.textContent()
    expect(text?.trim()).toMatch(UUID_V7_RE)
  })

  test('ULID section shows valid Crockford Base32 format', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const thirdCode = page.locator('code').nth(2)
    const text = await thirdCode.textContent()
    expect(text?.trim()).toMatch(ULID_RE)
  })

  test('section labels are visible', async ({ page }) => {
    await expect(page.getByText('UUID v4', { exact: true })).toBeVisible()
    await expect(page.getByText('UUID v7', { exact: true })).toBeVisible()
    await expect(page.getByText('ULID', { exact: true })).toBeVisible()
  })

  test('Generate produces different result each time', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const first = await page.locator('code').first().textContent()
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const second = await page.locator('code').first().textContent()
    expect(first?.trim()).not.toBe(second?.trim())
  })

  test('Copy all button is visible for each section', async ({ page }) => {
    const copyAllButtons = page.getByRole('button', { name: /copy all/i })
    await expect(copyAllButtons).toHaveCount(3, { timeout: 5000 })
  })

  test('all generated UUID v4 values match strict v4 regex', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate 10' }).click()
    const codes = page.locator('code')
    await expect(codes).toHaveCount(30, { timeout: 5000 })
    // First 10 codes are UUID v4
    for (let i = 0; i < 10; i++) {
      const text = await codes.nth(i).textContent()
      expect(text?.trim()).toMatch(UUID_V4_RE)
    }
  })

  test('all generated UUID v7 values match strict v7 regex', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate 10' }).click()
    const codes = page.locator('code')
    await expect(codes).toHaveCount(30, { timeout: 5000 })
    // Codes 10-19 are UUID v7
    for (let i = 10; i < 20; i++) {
      const text = await codes.nth(i).textContent()
      expect(text?.trim()).toMatch(UUID_V7_RE)
    }
  })

  test('all generated ULID values match Crockford Base32 regex', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate 10' }).click()
    const codes = page.locator('code')
    await expect(codes).toHaveCount(30, { timeout: 5000 })
    // Codes 20-29 are ULIDs
    for (let i = 20; i < 30; i++) {
      const text = await codes.nth(i).textContent()
      expect(text?.trim()).toMatch(ULID_RE)
    }
  })

  test('Generate 10 button creates exactly 10 entries per section', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate 10' }).click()
    const codes = page.locator('code')
    await expect(codes).toHaveCount(30, { timeout: 5000 })
    // Verify we have 30 non-empty code elements (10 per section)
    for (let i = 0; i < 30; i++) {
      const text = await codes.nth(i).textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('Copy all button is clickable without errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const copyAllButtons = page.getByRole('button', { name: /copy all/i })
    await expect(copyAllButtons).toHaveCount(3, { timeout: 5000 })
    // Click the first Copy all button — should not throw
    await copyAllButtons.first().click()
    // The button should still be visible after clicking
    await expect(copyAllButtons.first()).toBeVisible({ timeout: 5000 })
  })
})
