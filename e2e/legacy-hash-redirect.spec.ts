import { test, expect } from '@playwright/test'

// Old single-page URLs addressed tools by hash (/#json-formatter). The redirect
// must keep serving them, and must leave every other fragment alone: in-page
// anchors and the #s= shared-state fragment on tool pages.
test.describe('Legacy hash redirect', () => {
  test('/#json-formatter redirects to the tool page', async ({ page }) => {
    await page.goto('/#json-formatter')
    await expect(page).toHaveURL(/\/en\/tools\/json-formatter\/$/)
  })

  test('a renamed legacy slug still lands on the new tool', async ({ page }) => {
    await page.goto('/en/#password-checker')
    await expect(page).toHaveURL(/\/en\/tools\/password-strength\/$/)
  })

  test('a tool page keeps its #s= fragment', async ({ page }) => {
    await page.goto('/en/tools/base64/#s=abc')
    await page.waitForLoadState('networkidle')
    expect(new URL(page.url()).pathname).toBe('/en/tools/base64/')
  })

  test('an in-page anchor on a tool page is not treated as a tool slug', async ({ page }) => {
    await page.goto('/en/tools/base64/#main-content')
    await page.waitForLoadState('networkidle')
    expect(new URL(page.url()).pathname).toBe('/en/tools/base64/')
  })
})

test('an in-page anchor on the home page is not treated as a tool slug', async ({ page }) => {
  await page.goto('/en/#main-content')
  await page.waitForLoadState('networkidle')
  expect(new URL(page.url()).pathname).toBe('/en/')
})
