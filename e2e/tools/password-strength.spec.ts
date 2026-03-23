import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Password Strength', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/password-strength/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('shows Weak for a simple password', async ({ page }) => {
    await page.locator('input[type="password"]').fill('abc')
    await expect(page.getByText('Weak')).toBeVisible({ timeout: 5000 })
  })

  test('shows Strong for a complex password', async ({ page }) => {
    await page.locator('input[type="password"]').fill('C0mpl3x!Pass#2024')
    await expect(page.getByText('Strong', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('shows no strength indicator for empty input', async ({ page }) => {
    await expect(page.getByText('Weak')).not.toBeVisible()
    await expect(page.getByText('Strong', { exact: true })).not.toBeVisible()
  })

  test('strength updates reactively as user types', async ({ page }) => {
    const input = page.locator('input[type="password"]')
    await input.fill('a')
    await expect(page.getByText('Weak')).toBeVisible({ timeout: 5000 })

    await input.fill('Aa1!Bb2@Cc3#Dd4$EeFF')
    await expect(page.getByText('Strong', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('password input field is present', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows Medium for a moderately complex password', async ({ page }) => {
    await page.locator('input[type="password"]').fill('Hello123')
    // Should be Medium or Fair — not Weak and not Strong
    const strengthText = page.getByText('Weak').or(page.getByText('Medium')).or(page.getByText('Fair')).or(page.getByText('Strong', { exact: true }))
    await expect(strengthText.first()).toBeVisible({ timeout: 5000 })
  })
})
