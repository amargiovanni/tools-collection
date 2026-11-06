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

  test('Share button copies a URL with the state in the #s= fragment', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('Hello World')

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()

    const url = await page.evaluate(() => navigator.clipboard.readText())
    // The fragment never reaches the server; a ?s= query would.
    expect(new URL(url).hash).toMatch(/^#s=/)
    expect(new URL(url).searchParams.has('s')).toBe(false)
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
    const requested: string[] = []
    page2.on('request', (req) => requested.push(req.url()))
    await page2.goto(sharedUrl, { waitUntil: 'networkidle' })
    await waitForHydration(page2)
    await page2.waitForTimeout(200)

    await expect(page2.locator('[data-testid="textarea"]').first()).toHaveValue('round-trip test')
    // No request carried the shared state to the server.
    expect(requested.filter((u) => /[?&]s=/.test(u))).toEqual([])
    await page2.close()
  })

  test('a legacy ?s= link still restores, then the state leaves the query', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill('legacy link')
    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()
    const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()))
    const state = shared.hash.slice('#s='.length) || shared.searchParams.get('s')
    const legacy = `${shared.origin}${shared.pathname}?s=${state}`

    const page2 = await context.newPage()
    await page2.goto(legacy, { waitUntil: 'networkidle' })
    await waitForHydration(page2)
    await expect(page2.locator('[data-testid="textarea"]').first()).toHaveValue('legacy link')
    const now = new URL(page2.url())
    expect(now.searchParams.has('s')).toBe(false)
    expect(now.hash).toMatch(/^#s=/)
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
