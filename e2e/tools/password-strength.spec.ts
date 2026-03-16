import { test, expect } from '@playwright/test'

test.describe('Password Strength', () => {
  test('shows Weak for a simple password', async ({ page }) => {
    await page.goto('/en/tools/password-strength/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const input = page.locator('input[type="password"]')
    await input.fill('abc')

    await expect(page.getByText('Weak')).toBeVisible({ timeout: 5000 })
  })

  test('shows Strong for a complex password', async ({ page }) => {
    await page.goto('/en/tools/password-strength/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const input = page.locator('input[type="password"]')
    await input.fill('C0mpl3x!Pass#2024')

    await expect(page.getByText('Strong', { exact: true })).toBeVisible({ timeout: 5000 })
  })
})
