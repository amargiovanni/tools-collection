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

  test('tab indentation uses tab characters in output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><child>x</child></root>')
    await page.locator('select').selectOption('tab')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/\t<child>/, { timeout: 5000 })
  })

  test('4-space indentation uses 4 spaces per level', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><child>x</child></root>')
    await page.locator('select').selectOption('4')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/    <child>/, { timeout: 5000 })
  })

  test('XML attributes are preserved in formatted output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<root><item id="1" class="main">value</item></root>')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/id="1"/, { timeout: 5000 })
    await expect(output).toHaveValue(/class="main"/)
    await expect(page.getByText('Valid XML')).toBeVisible()
  })

  test('nested XML structure is correctly indented', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('<a><b><c>deep</c></b></a>')
    await page.getByRole('button', { name: 'Format XML' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    const value = await output.inputValue()
    const lines = value.split(/\r?\n/).filter(l => l.trim())
    // Should have at least 5 lines: <a>, <b>, <c>deep</c>, </b>, </a>
    expect(lines.length).toBeGreaterThanOrEqual(5)
    // Verify nesting preserved
    await expect(output).toHaveValue(/<a>/, { timeout: 5000 })
    await expect(output).toHaveValue(/<b>/)
    await expect(output).toHaveValue(/<c>deep<\/c>/)
  })
})
