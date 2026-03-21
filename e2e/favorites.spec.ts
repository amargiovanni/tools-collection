import { test, expect } from '@playwright/test'

test.describe('Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    // Clear any existing favorites
    await page.evaluate(() => localStorage.removeItem('favorite-tools'))
  })

  test('star button is visible on tool page', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    const favBtn = page.locator('#favorite-toggle')
    await expect(favBtn).toBeVisible()
    // Empty star visible, filled star hidden
    await expect(page.locator('#fav-icon-empty')).toBeVisible()
    await expect(page.locator('#fav-icon-filled')).toBeHidden()
  })

  test('clicking star adds tool to favorites', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await page.locator('#favorite-toggle').click()

    // Filled star visible after click
    await expect(page.locator('#fav-icon-filled')).toBeVisible()
    await expect(page.locator('#fav-icon-empty')).toBeHidden()

    // Verify localStorage
    const favs = await page.evaluate(() => JSON.parse(localStorage.getItem('favorite-tools') ?? '[]'))
    expect(favs).toContain('json-formatter')
  })

  test('clicking star again removes tool from favorites', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    // Add then remove
    await page.locator('#favorite-toggle').click()
    await page.locator('#favorite-toggle').click()

    // Back to empty star
    await expect(page.locator('#fav-icon-empty')).toBeVisible()
    await expect(page.locator('#fav-icon-filled')).toBeHidden()

    const favs = await page.evaluate(() => JSON.parse(localStorage.getItem('favorite-tools') ?? '[]'))
    expect(favs).not.toContain('json-formatter')
  })

  test('favorites section appears in sidebar after starring', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })

    // Sidebar favorites section should be hidden initially
    const sidebarFavs = page.locator('#sidebar-favorites')
    await expect(sidebarFavs).toBeHidden()

    // Star the tool
    await page.locator('#favorite-toggle').click()

    // Sidebar favorites section should now be visible (event-driven update)
    await expect(sidebarFavs).toBeVisible()
    const favLink = sidebarFavs.locator('a[href*="/en/tools/json-formatter/"]')
    await expect(favLink).toBeVisible()
  })

  test('favorite persists across navigation', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await page.locator('#favorite-toggle').click()

    // Navigate to another tool
    await page.goto('/en/tools/base64/', { waitUntil: 'networkidle' })

    // Sidebar should still show the favorite
    const sidebarFavs = page.locator('#sidebar-favorites')
    await expect(sidebarFavs).toBeVisible()
    const favLink = sidebarFavs.locator('a[href*="/en/tools/json-formatter/"]')
    await expect(favLink).toBeVisible()

    // The base64 star should be empty (not favorited)
    await expect(page.locator('#fav-icon-empty')).toBeVisible()
  })

  test('favorites section appears on homepage', async ({ page }) => {
    // Set a favorite via localStorage before navigating
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await page.evaluate(() => localStorage.setItem('favorite-tools', JSON.stringify(['json-formatter'])))

    await page.goto('/en/', { waitUntil: 'networkidle' })

    const homeFavs = page.locator('#home-favorites')
    await expect(homeFavs).toBeVisible()
    const favCard = homeFavs.locator('a[href*="/en/tools/json-formatter/"]')
    await expect(favCard).toBeVisible()
  })

  test('homepage hides favorites section when empty', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    const homeFavs = page.locator('#home-favorites')
    await expect(homeFavs).toBeHidden()
  })

  test('star button has correct aria-label', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    const favBtn = page.locator('#favorite-toggle')

    // Before starring: "Add to favorites"
    await expect(favBtn).toHaveAttribute('aria-label', 'Add to favorites')

    await favBtn.click()

    // After starring: "Remove from favorites"
    await expect(favBtn).toHaveAttribute('aria-label', 'Remove from favorites')
  })
})
