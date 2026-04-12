import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Email Extractor', () => {
  test('extracts emails from text', async ({ page }) => {
    await toolTest(page, {
      toolId: 'email-extractor',
      input: 'contact test@example.com here',
      action: 'Extract Emails',
      expectOutputContains: 'test@example.com',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'email-extractor',
      input: '',
      action: 'Extract Emails',
      expectError: 'Please enter some input',
    })
  })

  test('extracts multiple emails from text', async ({ page }) => {
    await page.goto('/en/tools/email-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill(
      'Send to alice@example.com and bob@test.org for more info'
    )
    await page.getByRole('button', { name: 'Extract Emails' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/alice@example\.com/, { timeout: 5000 })
    await expect(output).toHaveValue(/bob@test\.org/)
  })

  test('ignores text without emails', async ({ page }) => {
    await page.goto('/en/tools/email-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill('no emails here just plain text')
    await page.getByRole('button', { name: 'Extract Emails' }).click()
    // Either shows empty output or a "no results" message
    const output = page.locator('[data-testid="output-panel"] textarea')
    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(output.or(statusMessage)).toBeVisible({ timeout: 5000 })
  })

  test('extracts email with subdomain', async ({ page }) => {
    await toolTest(page, {
      toolId: 'email-extractor',
      input: 'user@mail.example.co.uk',
      action: 'Extract Emails',
      expectOutputContains: 'user@mail.example.co.uk',
    })
  })

  test('remove duplicates toggle deduplicates emails', async ({ page }) => {
    await page.goto('/en/tools/email-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    // Ensure remove duplicates is checked
    await page.getByLabel('Remove duplicate emails').check()
    await page.locator('[data-testid="textarea"]').first().fill(
      'a@test.com b@test.com a@test.com c@test.com a@test.com'
    )
    await page.getByRole('button', { name: 'Extract Emails' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    // Should only have 3 unique emails
    expect(lines).toHaveLength(3)
  })

  test('email count badge shows correct number', async ({ page }) => {
    await page.goto('/en/tools/email-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.locator('[data-testid="textarea"]').first().fill(
      'one@example.com two@example.com three@example.com'
    )
    await page.getByRole('button', { name: 'Extract Emails' }).click()
    // Badge should show "Found: 3" (or equivalent text with "3")
    await expect(page.getByText(/:\s*3/)).toBeVisible({ timeout: 5000 })
  })

  test('extracts many emails from mixed content', async ({ page }) => {
    await page.goto('/en/tools/email-extractor/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
    const input = [
      'Contact us at info@company.com for sales.',
      'Support: help@support.org, billing@support.org',
      'CEO: ceo@bigcorp.io | CTO: cto@bigcorp.io',
    ].join('\n')
    await page.locator('[data-testid="textarea"]').first().fill(input)
    await page.getByRole('button', { name: 'Extract Emails' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines.length).toBeGreaterThanOrEqual(5)
    expect(value).toContain('info@company.com')
    expect(value).toContain('cto@bigcorp.io')
  })
})
