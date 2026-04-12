import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('BitTorrent Magnet Link Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/bittorrent-magnet-link-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates a magnet link from hash and name', async ({ page }) => {
    await page.getByLabel('Info Hash').fill('0123456789abcdef0123456789abcdef01234567')
    await page.getByLabel('Resource Name').fill('Ubuntu ISO')
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty()
    await expect(output).toHaveValue(/magnet:\?xt=/)
    await expect(output).toHaveValue(/dn=Ubuntu\+ISO/)
  })

  test('shows an error for an invalid hash', async ({ page }) => {
    await page.getByLabel('Info Hash').fill('invalid')
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible()
  })

  test('supports hash and name query parameters', async ({ page }) => {
    await page.goto('/en/tools/bittorrent-magnet-link-generator/?hash=0123456789abcdef0123456789abcdef01234567&name=Ubuntu%20ISO', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await expect(page.getByLabel('Info Hash')).toHaveValue('0123456789abcdef0123456789abcdef01234567')
    await expect(page.locator('[data-testid="output-panel"] textarea')).toHaveValue(/dn=Ubuntu\+ISO/)
  })

  test('resource name field populates dn parameter in magnet link', async ({ page }) => {
    await page.getByLabel('Info Hash').fill('abcdef1234567890abcdef1234567890abcdef12')
    await page.getByLabel('Resource Name').fill('Test File')
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    expect(value).toContain('dn=Test+File')
  })

  test('tracker list textarea is pre-filled with defaults', async ({ page }) => {
    const trackers = page.getByLabel('Trackers')
    const value = await trackers.inputValue()
    // Should contain at least one tracker URL
    expect(value.trim().length).toBeGreaterThan(0)
    expect(value).toContain('udp://')
  })

  test('generated magnet link starts with magnet:?xt=urn:btih:', async ({ page }) => {
    const hash = 'abcdef1234567890abcdef1234567890abcdef12'
    await page.getByLabel('Info Hash').fill(hash)
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    expect(value).toMatch(/^magnet:\?xt=urn:btih:/)
    expect(value.toLowerCase()).toContain(hash)
  })

  test('magnet link includes tracker parameters', async ({ page }) => {
    await page.getByLabel('Info Hash').fill('abcdef1234567890abcdef1234567890abcdef12')
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    // Should contain &tr= for tracker parameters
    expect(value).toContain('&tr=')
  })

  test('open link anchor is visible after generation', async ({ page }) => {
    await page.getByLabel('Info Hash').fill('abcdef1234567890abcdef1234567890abcdef12')
    await page.getByRole('button', { name: 'Generate Magnet Link' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).not.toBeEmpty({ timeout: 5000 })
    // The "Open magnet link" anchor should be visible
    const link = page.locator('a[href^="magnet:"]')
    await expect(link).toBeVisible({ timeout: 5000 })
  })
})
