import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Password Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/password-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates non-empty output', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty()
  })

  test('default generates 5 passwords (5 lines)', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines).toHaveLength(5)
  })

  test('each generated password is at least 16 chars (default length)', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim().length).toBeGreaterThanOrEqual(16)
    }
  })

  test('different generates produce different passwords', async ({ page }) => {
    const output = page.locator('[data-testid="output-panel"] textarea')
    await page.getByRole('button', { name: 'Generate Password' }).click()
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const first = await output.inputValue()

    await page.getByRole('button', { name: 'Generate Password' }).click()
    const second = await output.inputValue()

    expect(first).not.toBe(second)
  })

  test('character set checkboxes are visible', async ({ page }) => {
    await expect(page.getByLabel('Uppercase (A-Z)')).toBeVisible()
    await expect(page.getByLabel('Lowercase (a-z)')).toBeVisible()
    await expect(page.getByLabel('Numbers (0-9)')).toBeVisible()
    await expect(page.getByLabel('Symbols (!@#$%)')).toBeVisible()
    await expect(page.getByLabel('Simple mode')).toBeVisible()
    await expect(page.getByLabel('Avoid ambiguous characters')).toBeVisible()
  })

  test('shows error when all character sets unchecked', async ({ page }) => {
    await page.getByLabel('Uppercase (A-Z)').uncheck()
    await page.getByLabel('Lowercase (a-z)').uncheck()
    await page.getByLabel('Numbers (0-9)').uncheck()
    await page.getByLabel('Symbols (!@#$%)').uncheck()
    await page.getByRole('button', { name: 'Generate Password' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('output panel has a copy button after generation', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Password' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).not.toBeEmpty({ timeout: 5000 })
    await expect(page.locator('[data-testid="output-panel"] button')).toBeVisible()
  })

  test('simple mode enables avoid ambiguous characters by default', async ({ page }) => {
    await page.getByLabel('Simple mode').check()
    await expect(page.getByLabel('Avoid ambiguous characters')).toBeChecked()
  })

  test('avoid ambiguous characters removes confusing characters', async ({ page }) => {
    await page.getByLabel('Symbols (!@#$%)').uncheck()
    await page.getByLabel('Avoid ambiguous characters').check()
    await page.getByRole('button', { name: 'Generate Password' }).click()

    const value = await page.locator('[data-testid="output-panel"] textarea').inputValue()
    expect(value).not.toMatch(/[O0oIl1]/)
  })

  test('length slider changes password length to 32', async ({ page }) => {
    const slider = page.locator('input[type="range"]')
    await slider.fill('32')
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim().length).toBe(32)
    }
  })

  test('count field boundary: setting count to 1 generates exactly 1 password', async ({ page }) => {
    const countInput = page.getByLabel('Number of passwords:')
    await countInput.fill('1')
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines).toHaveLength(1)
  })

  test('uppercase-only generates only uppercase characters', async ({ page }) => {
    await page.getByLabel('Lowercase (a-z)').uncheck()
    await page.getByLabel('Numbers (0-9)').uncheck()
    await page.getByLabel('Symbols (!@#$%)').uncheck()
    await page.getByLabel('Uppercase (A-Z)').check()
    await page.getByRole('button', { name: 'Generate Password' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim()).toMatch(/^[A-Z]+$/)
    }
  })
})
