import { test, expect } from '@playwright/test'

test.describe('Diff Checker', () => {
  test('detects differences between two texts', async ({ page }) => {
    await page.goto('/en/tools/diff-checker/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const original = page.locator('[data-testid="textarea-original"]')
    await original.fill('line1\nline2')

    const modified = page.locator('[data-testid="textarea-modified"]')
    await modified.fill('line1\nline3')

    const button = page.getByRole('button', { name: 'Compare Texts' })
    await button.click()

    await expect(page.getByText('Additions')).toBeVisible()
  })

  test('reports no differences for identical texts', async ({ page }) => {
    await page.goto('/en/tools/diff-checker/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const original = page.locator('[data-testid="textarea-original"]')
    await original.fill('same')

    const modified = page.locator('[data-testid="textarea-modified"]')
    await modified.fill('same')

    const button = page.getByRole('button', { name: 'Compare Texts' })
    await button.click()

    await expect(page.getByText('No differences found')).toBeVisible()
  })
})
