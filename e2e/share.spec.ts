import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('URL shareable state', () => {
  test('Share button is present on tool pages', async ({ page }) => {
    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible()
  })

  test('Share button copies URL with ?s= param to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('Hello World')

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()

    const url = await page.evaluate(() => navigator.clipboard.readText())
    expect(url).toMatch(/[?&]s=/)
  })

  test('navigating to a shared URL restores tool state', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('round-trip test')
    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())

    const page2 = await context.newPage()
    await page2.goto(sharedUrl, { waitUntil: 'networkidle' })
    await waitForHydration(page2)
    await page2.waitForTimeout(200)

    await expect(page2.locator('[data-testid="textarea"]').first()).toHaveValue('round-trip test')
    await page2.close()
  })

  test('Share button shows idle label initially (not "Not available")', async ({ page }) => {
    await page.goto('/en/tools/convert-case/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    const btn = page.getByRole('button', { name: /share/i })
    await expect(btn).toBeVisible()
    await expect(btn).not.toHaveText(/not available/i)
    await expect(btn).not.toHaveText(/unavailable/i)
  })

  test('Convert Case restores input and caseType from shared URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/en/tools/convert-case/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('hello world')
    await page.selectOption('select', 'upper')

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())

    const page2 = await context.newPage()
    await page2.goto(sharedUrl, { waitUntil: 'networkidle' })
    await waitForHydration(page2)
    await page2.waitForTimeout(200)

    await expect(page2.locator('[data-testid="textarea"]').first()).toHaveValue('hello world')
    await expect(page2.locator('select')).toHaveValue('upper')
    await page2.close()
  })

  test('JSON Formatter restores input and indent from shared URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('{"a":1}')
    await page.selectOption('select', '4')

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())

    const page2 = await context.newPage()
    await page2.goto(sharedUrl, { waitUntil: 'networkidle' })
    await waitForHydration(page2)
    await page2.waitForTimeout(200)

    await expect(page2.locator('[data-testid="textarea"]').first()).toHaveValue('{"a":1}')
    await expect(page2.locator('select')).toHaveValue('4')
    await page2.close()
  })
})
