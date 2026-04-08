import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
}

test.describe('Text Counter', () => {
  test('updates statistics live while typing', async ({ page }) => {
    await page.goto('/en/tools/text-counter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

    await page.locator('[data-testid="textarea"]').first().fill('Hello world. Hello again!')

    await expect(page.locator('[data-testid="text-counter-stat-characters"]')).toContainText('25')
    await expect(page.locator('[data-testid="text-counter-stat-words"]')).toContainText('4')
    await expect(page.locator('[data-testid="text-counter-stat-sentences"]')).toContainText('2')
    await expect(page.locator('[data-testid="text-counter-stat-reading-time"]')).toContainText('2 sec')
    await expect(page.locator('[data-testid="text-counter-keywords"]')).toContainText('hello x2')
  })

  test('supports quick text actions', async ({ page }) => {
    await page.goto('/en/tools/text-counter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)

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
})
