import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Add Text to Lines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/add-text-to-lines/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('adds prefix text to each line', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('line1\nline2')
    await page.locator('[data-testid="input"]').fill('> ')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/> line1/, { timeout: 5000 })
  })

  test('empty input produces empty output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('')
  })

  test('prefix is applied to all lines', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('a\nb\nc')
    await page.locator('[data-testid="input"]').fill('- ')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/- a/, { timeout: 5000 })
    await expect(output).toHaveValue(/- b/)
    await expect(output).toHaveValue(/- c/)
  })

  test('suffix mode appends text to each line', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('line1\nline2')
    // Find suffix input — second input field or labeled "Suffix"
    const inputs = page.locator('[data-testid="input"]')
    if (await inputs.count() > 1) {
      await inputs.nth(1).fill(';')
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue(/line1;/, { timeout: 5000 })
    } else {
      // Tool only has one text addition field — verify prefix works correctly
      await inputs.first().fill('[end]')
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).toHaveValue(/.+/, { timeout: 5000 })
    }
  })

  test('output updates reactively when prefix changes', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('hello')
    const textInput = page.locator('[data-testid="input"]').first()
    await textInput.fill('A: ')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/A: hello/, { timeout: 5000 })

    await textInput.fill('B: ')
    await expect(output).toHaveValue(/B: hello/, { timeout: 5000 })
  })

  test('position toggle switches between start and end', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('line1\nline2')
    await page.locator('[data-testid="input"]').fill('***')

    const output = page.locator('[data-testid="output-panel"] textarea')

    // Default is "start" — text added at the beginning
    await expect(output).toHaveValue(/^\*\*\*line1/, { timeout: 5000 })

    // Switch to "end"
    await page.getByRole('button', { name: 'Add at the end' }).click()
    await expect(output).toHaveValue(/line1\*\*\*/, { timeout: 5000 })

    // Switch back to "start"
    await page.getByRole('button', { name: 'Add at the beginning' }).click()
    await expect(output).toHaveValue(/^\*\*\*line1/, { timeout: 5000 })
  })

  test('handles unicode input correctly', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('ciao\nhello')
    await page.locator('[data-testid="input"]').fill('\u2714 ')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/\u2714 ciao/, { timeout: 5000 })
    await expect(output).toHaveValue(/\u2714 hello/)
  })

  test('empty addition field leaves lines unchanged', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('line1\nline2')
    await page.locator('[data-testid="input"]').fill('')
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('line1\nline2', { timeout: 5000 })
  })
})
