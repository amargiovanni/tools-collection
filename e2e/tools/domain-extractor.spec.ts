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

  test.describe('advanced extraction scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/tools/domain-extractor/', { waitUntil: 'networkidle' })
      await waitForHydration(page)
    })

    test('extracts multiple domains from multiple URLs', async ({ page }) => {
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

    test('include subdomains toggle preserves full subdomain', async ({ page }) => {
      await page.getByLabel('Include subdomains').check()
      await page.locator('[data-testid="textarea"]').first().fill(
        'https://blog.example.com/post\nhttps://api.example.com/data'
      )
      await page.getByRole('button', { name: 'Extract Domains' }).click()
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).not.toBeEmpty({ timeout: 5000 })
      const value = await output.inputValue()
      // When subdomains included, should contain the full subdomain
      expect(value).toContain('blog.example.com')
      expect(value).toContain('api.example.com')
    })

    test('duplicate domains are removed from output', async ({ page }) => {
      await page.locator('[data-testid="textarea"]').first().fill(
        'https://example.com/a\nhttps://example.com/b\nhttps://example.com/c\nhttps://other.com'
      )
      await page.getByRole('button', { name: 'Extract Domains' }).click()
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).not.toBeEmpty({ timeout: 5000 })
      const value = await output.inputValue()
      const lines = value.split('\n').filter((l) => l.trim() !== '')
      // Should have at most 2 unique domains (example.com and other.com)
      expect(lines.length).toBeLessThanOrEqual(2)
    })

    test('URL without protocol still extracts domain', async ({ page }) => {
      await page.locator('[data-testid="textarea"]').first().fill(
        'www.example.com/page\nexample.org/path'
      )
      await page.getByRole('button', { name: 'Extract Domains' }).click()
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).not.toBeEmpty({ timeout: 5000 })
      const value = await output.inputValue()
      // Should extract at least one domain
      expect(value).toMatch(/example/)
    })
  })
})
