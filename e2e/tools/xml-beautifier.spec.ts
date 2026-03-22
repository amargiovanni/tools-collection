import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('XML Beautifier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/xml-beautifier/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('formats XML and shows Valid XML badge', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><item>x</item></root>')
    await page.getByRole('button', { name: 'Format XML' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).toHaveValue(/<item>/, { timeout: 5000 })
    await expect(page.getByText('Valid XML')).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'xml-beautifier',
      input: '',
      action: 'Format XML',
      expectError: 'Please enter some input',
    })
  })

  test('indent select has 3 options (2 spaces, 4 spaces, tab)', async ({ page }) => {
    const select = page.locator('select')
    const options = await select.locator('option').all()
    expect(options.length).toBe(3)
  })

  test('preserves all XML elements in output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><a>1</a><b>2</b></root>')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/<a>/, { timeout: 5000 })
    await expect(output).toHaveValue(/<b>/)
  })

  test('formatted XML has multiple lines (indented)', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><child>value</child></root>')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    const value = await output.inputValue()
    expect(value.split('\n').length).toBeGreaterThan(1)
  })
})
