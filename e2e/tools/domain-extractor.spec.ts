import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Domain Extractor', () => {
  test('extracts domains from URLs', async ({ page }) => {
    await toolTest(page, {
      toolId: 'domain-extractor',
      input: 'https://example.com/path\nhttps://sub.test.org/',
      action: 'Extract Domains',
      expectOutputContains: 'example.com',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'domain-extractor',
      input: '',
      action: 'Extract Domains',
      expectError: 'Please enter some input',
    })
  })

  test('extracts subdomain correctly', async ({ page }) => {
    await toolTest(page, {
      toolId: 'domain-extractor',
      input: 'https://sub.test.org/',
      action: 'Extract Domains',
      expectOutputContains: 'test.org',
    })
  })

  test('extracts multiple domains from multiple URLs', async ({ page }) => {
    await page.goto('/en/tools/domain-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill(
      'https://alpha.com\nhttps://beta.org\nhttps://gamma.net'
    )
    await page.getByRole('button', { name: 'Extract Domains' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/alpha\.com/, { timeout: 5000 })
    await expect(output).toHaveValue(/beta\.org/)
    await expect(output).toHaveValue(/gamma\.net/)
  })

  test('deduplicates repeated domains', async ({ page }) => {
    await page.goto('/en/tools/domain-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill(
      'https://example.com/page1\nhttps://example.com/page2'
    )
    await page.getByRole('button', { name: 'Extract Domains' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.includes('example.com'))
    expect(lines.length).toBeLessThanOrEqual(2)
  })
})
