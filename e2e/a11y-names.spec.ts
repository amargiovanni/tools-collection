import { test, expect } from '@playwright/test'

// WCAG 2.5.3 Label in Name: a control's accessible name contains the text a
// sighted user sees on it, so speech-input users can say what they read.
test.describe('Label in name (home top bar)', () => {
  test('the brand link is named with its visible title', async ({ page }) => {
    await page.goto('/en/')
    const brand = page.locator('header a.brand').first()
    await expect(brand).toHaveAccessibleName(/^Online Tools\b/)
  })

  test('the search trigger is named with its visible label only', async ({ page }) => {
    await page.goto('/en/')
    const trigger = page.locator('#home-search-trigger')
    await expect(trigger).toHaveAccessibleName('Search tools...')
    await expect(trigger.locator('.kbd').first()).toHaveAttribute('aria-hidden', 'true')
  })
})

test('the search trigger keeps its name on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/en/')
  await expect(page.locator('#home-search-trigger')).toHaveAccessibleName('Search tools...')
})
