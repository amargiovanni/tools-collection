import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Recovery Code Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/recovery-code-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates grouped recovery codes', async ({ page }) => {
    await page.getByLabel('Number of codes:').fill('3')
    await page.getByLabel('Characters per code:').fill('12')
    await page.getByLabel('Group size:').fill('4')
    await page.getByRole('button', { name: 'Generate Recovery Codes' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}\n[A-Z0-9]{4}(-[A-Z0-9]{4}){2}\n[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$/)
  })
})
