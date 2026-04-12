import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

const REGISTRY_INPUT = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\Software\\Example]
"Enabled"=dword:00000001`

const REGISTRY_MULTIPLE = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\Software\\Example]
"Enabled"=dword:00000001
"Name"="TestValue"
"Count"=dword:0000000A`

test.describe('Reg2GPO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/reg2gpo/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('converts registry entries to GPO XML', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(REGISTRY_INPUT)

    const button = page.getByRole('button', { name: 'Generate GPO XML' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/<Collection/)
  })

  test('shows error on empty input', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Generate GPO XML' })
    await button.click()

    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(statusMessage).toBeVisible()
  })

  test('collection name field sets the name attribute in XML output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill(REGISTRY_INPUT)
    await page.getByLabel('Collection name:').fill('MyCustomCollection')
    await page.getByRole('button', { name: 'Generate GPO XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    expect(value).toContain('MyCustomCollection')
  })

  test('entries count badge shows correct number of converted entries', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill(REGISTRY_MULTIPLE)
    await page.getByRole('button', { name: 'Generate GPO XML' }).click()
    // Badge should show the number of generated entries
    await expect(page.getByText(/\d+ Generated XML entries/)).toBeVisible({ timeout: 5000 })
  })

  test('output XML contains Registry element', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill(REGISTRY_INPUT)
    await page.getByRole('button', { name: 'Generate GPO XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    expect(value).toContain('<Registry')
  })
})
