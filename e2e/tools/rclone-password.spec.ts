import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

// Pre-computed rclone obscured text for "SuperSecret123!"
// IV = "0123456789abcdef", encrypted with rclone's fixed AES-256-CTR key
const VALID_OBSCURED = 'MDEyMzQ1Njc4OWFiY2RlZtSMOjloMCMJQZDr-MZR1Q'

test.describe('Rclone Password Revealer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/rclone-password/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('page loads and shows input field', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })
  })

  test('reveals password from rclone obscured string', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_OBSCURED)

    await page.getByRole('button', { name: 'Reveal Password' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('SuperSecret123!', { timeout: 5000 })
  })

  test('shows error for empty input', async ({ page }) => {
    await page.getByRole('button', { name: 'Reveal Password' }).click()

    const error = page.locator('[data-testid="status-message"]')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('shows error for invalid input', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('not-valid-base64!!!')

    await page.getByRole('button', { name: 'Reveal Password' }).click()

    const error = page.locator('[data-testid="status-message"]')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('output panel shows result after reveal', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_OBSCURED)

    await page.getByRole('button', { name: 'Reveal Password' }).click()

    const outputPanel = page.locator('[data-testid="output-panel"]')
    await expect(outputPanel).toBeVisible({ timeout: 5000 })
    const output = outputPanel.locator('textarea')
    await expect(output).not.toHaveValue('', { timeout: 5000 })
  })

  test('copy button is visible after result', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_OBSCURED)

    await page.getByRole('button', { name: 'Reveal Password' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('SuperSecret123!', { timeout: 5000 })

    // CopyButton renders inside the output-panel when there is a value
    const copyButton = page.locator('[data-testid="output-panel"]').getByRole('button')
    await expect(copyButton).toBeVisible({ timeout: 5000 })
  })
})
