import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('PIN Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/pin-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates numeric PINs only', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate PINs' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim()).toMatch(/^\d+$/)
    }
  })

  test('default generates 10 PINs', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate PINs' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines).toHaveLength(10)
  })

  test('default PIN length is 4 digits', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate PINs' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim()).toHaveLength(4)
    }
  })

  test('PIN length setting is respected', async ({ page }) => {
    const lengthInput = page.getByLabel('PIN length:')
    await lengthInput.fill('6')
    await page.getByRole('button', { name: 'Generate PINs' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    for (const line of lines) {
      expect(line.trim()).toHaveLength(6)
    }
  })

  test('output panel has a copy button after generation', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate PINs' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).not.toBeEmpty({ timeout: 5000 })
    await expect(page.locator('[data-testid="output-panel"] button')).toBeVisible()
  })

  test('Avoid duplicates checkbox is visible', async ({ page }) => {
    await expect(page.getByLabel('Avoid duplicates')).toBeVisible()
  })
})
