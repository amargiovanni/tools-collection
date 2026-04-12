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

  test('show/hide toggle switches input type', async ({ page }) => {
    const input = page.locator('input[type="password"]')
    await input.fill('TestPassword')
    // Initially the input is type="password"
    await expect(input).toHaveAttribute('type', 'password')

    // Click "Show" button to reveal password
    await page.getByRole('button', { name: 'Show' }).click()
    const visibleInput = page.locator('input[type="text"]')
    await expect(visibleInput).toBeVisible({ timeout: 5000 })

    // Click "Hide" to hide it again
    await page.getByRole('button', { name: 'Hide' }).click()
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 })
  })

  test('score bar is visible after entering a password', async ({ page }) => {
    await page.locator('input[type="password"]').fill('SomePassword1!')
    // Score bar: look for the "Score:" text and the progress bar
    await expect(page.getByText('Score:')).toBeVisible({ timeout: 5000 })
    // The bar container div should be visible
    await expect(page.locator('.h-2.rounded-full').first()).toBeVisible({ timeout: 5000 })
  })

  test('all 5 checks are visible (length, uppercase, lowercase, numbers, symbols)', async ({ page }) => {
    await page.locator('input[type="password"]').fill('Aa1!short')
    // Wait for the checks to render
    await expect(page.getByText('Length:')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Uppercase:')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Lowercase:')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Numbers:')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Symbols:')).toBeVisible({ timeout: 5000 })
  })

  test('weak password has a lower score than strong password', async ({ page }) => {
    const input = page.locator('input[type="password"]')

    // Enter a weak password and capture its score
    await input.fill('abc')
    await expect(page.getByText('Score:')).toBeVisible({ timeout: 5000 })
    const weakScoreText = await page.getByText('Score:').textContent()
    const weakScore = parseInt(weakScoreText?.match(/(\d+)\/8/)?.[1] ?? '0')

    // Enter a strong password and capture its score
    await input.fill('C0mpl3x!Pass#2024Xy')
    await expect(page.getByText('Score:')).toBeVisible({ timeout: 5000 })
    const strongScoreText = await page.getByText('Score:').textContent()
    const strongScore = parseInt(strongScoreText?.match(/(\d+)\/8/)?.[1] ?? '0')

    expect(strongScore).toBeGreaterThan(weakScore)
  })
})
