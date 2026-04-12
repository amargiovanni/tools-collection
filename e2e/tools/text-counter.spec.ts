import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
}

test.describe('Text Counter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/text-counter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('updates statistics live while typing', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('Hello world. Hello again!')

    await expect(page.locator('[data-testid="text-counter-stat-characters"]')).toContainText('25')
    await expect(page.locator('[data-testid="text-counter-stat-words"]')).toContainText('4')
    await expect(page.locator('[data-testid="text-counter-stat-sentences"]')).toContainText('2')
    await expect(page.locator('[data-testid="text-counter-stat-reading-time"]')).toContainText('2 sec')
    await expect(page.locator('[data-testid="text-counter-keywords"]')).toContainText('hello x2')
  })

  test('supports quick text actions', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('Mixed Case')
    await page.getByRole('button', { name: 'Uppercase' }).click()
    await expect(textarea).toHaveValue('MIXED CASE')
    await page.getByRole('button', { name: 'Lowercase' }).click()
    await expect(textarea).toHaveValue('mixed case')
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(textarea).toHaveValue('')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(textarea).toHaveValue('mixed case')
  })

  test('shows correct character count including spaces', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('abc def')
    await expect(page.locator('[data-testid="text-counter-stat-characters"]')).toContainText('7', { timeout: 5000 })
    await expect(page.locator('[data-testid="text-counter-stat-characters-no-spaces"]')).toContainText('6', { timeout: 5000 })
  })

  test('shows correct word count', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('one two three four five')
    await expect(page.locator('[data-testid="text-counter-stat-words"]')).toContainText('5', { timeout: 5000 })
  })

  test('shows correct sentence count', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('First sentence. Second sentence! Third?')
    await expect(page.locator('[data-testid="text-counter-stat-sentences"]')).toContainText('3', { timeout: 5000 })
  })

  test('shows correct paragraph count', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.')
    await expect(page.locator('[data-testid="text-counter-stat-paragraphs"]')).toContainText('3', { timeout: 5000 })
  })

  test('shows reading time for longer text', async ({ page }) => {
    // Generate text with enough words to produce a meaningful reading time
    const words = Array.from({ length: 250 }, (_, i) => `word${i}`)
    await page.locator('[data-testid="textarea"]').first().fill(words.join(' '))
    await expect(page.locator('[data-testid="text-counter-stat-reading-time"]')).toContainText('1 min', { timeout: 5000 })
  })

  test('empty input shows zero counts', async ({ page }) => {
    await expect(page.locator('[data-testid="text-counter-stat-characters"]')).toContainText('0', { timeout: 5000 })
    await expect(page.locator('[data-testid="text-counter-stat-words"]')).toContainText('0', { timeout: 5000 })
    await expect(page.locator('[data-testid="text-counter-stat-sentences"]')).toContainText('0', { timeout: 5000 })
  })
})
