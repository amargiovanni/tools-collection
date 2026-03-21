import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page shows all tool cards', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    const toolLinks = page.locator('a[href*="/en/tools/"]')
    await expect(toolLinks).toHaveCount(29)
  })

  test('clicking a tool card opens the tool', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    await page.locator('a[href*="/en/tools/base64/"]').click()
    await expect(page).toHaveURL(/\/en\/tools\/base64\//)
    await expect(page.locator('#tool-heading')).toContainText('Base64')
  })

  test('language dropdown switches language', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    await page.locator('[data-lang-dropdown] button').click()
    await page.locator('[data-lang-menu] a[href*="/it/"]').click()
    await expect(page).toHaveURL(/\/it\//)
  })

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    // Wait for CommandPalette island to hydrate
    await page.waitForFunction(() => {
      const island = document.querySelectorAll('astro-island')
      return island.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)
    await page.keyboard.press('Meta+k')
    await expect(page.getByPlaceholder('Search tools...')).toBeVisible()
  })
})
