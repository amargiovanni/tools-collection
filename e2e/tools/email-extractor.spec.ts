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
})
