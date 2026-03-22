import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Diff Checker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/diff-checker/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('detects differences between two texts', async ({ page }) => {
    await page.locator('[data-testid="textarea-original"]').fill('line1\nline2')
    await page.locator('[data-testid="textarea-modified"]').fill('line1\nline3')
    await page.getByRole('button', { name: 'Compare Texts' }).click()
    await expect(page.getByText('Additions')).toBeVisible()
  })

  test('reports no differences for identical texts', async ({ page }) => {
    await page.locator('[data-testid="textarea-original"]').fill('same')
    await page.locator('[data-testid="textarea-modified"]').fill('same')
    await page.getByRole('button', { name: 'Compare Texts' }).click()
    await expect(page.getByText('No differences found')).toBeVisible()
  })

  test('shows deletions when lines are removed', async ({ page }) => {
    await page.locator('[data-testid="textarea-original"]').fill('line1\nline2\nline3')
    await page.locator('[data-testid="textarea-modified"]').fill('line1\nline3')
    await page.getByRole('button', { name: 'Compare Texts' }).click()
    await expect(page.getByText('Deletions')).toBeVisible({ timeout: 5000 })
  })

  test('shows error when both fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Compare Texts' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('both textarea fields are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="textarea-original"]')).toBeVisible()
    await expect(page.locator('[data-testid="textarea-modified"]')).toBeVisible()
  })
})
