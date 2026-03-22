import { test, expect, type Page } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('JSON Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/json-formatter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('formats JSON and shows Valid JSON badge', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('{"a":1}')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).toHaveValue(/a/, { timeout: 5000 })
    await expect(page.getByText('Valid JSON')).toBeVisible()
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'json-formatter',
      input: '',
      action: 'Format JSON',
      expectError: 'Please enter some input',
    })
  })

  test('shows error for invalid JSON', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('{not valid json}')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Valid JSON', { exact: true })).not.toBeVisible()
  })

  test('preserves all keys in formatted output', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('{"name":"Alice","age":30}')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/name/, { timeout: 5000 })
    await expect(output).toHaveValue(/Alice/)
    await expect(output).toHaveValue(/age/)
    await expect(output).toHaveValue(/30/)
  })

  test('formats nested JSON object', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('{"a":{"b":{"c":1}}}')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/\n/, { timeout: 5000 })
    await expect(page.getByText('Valid JSON')).toBeVisible()
  })

  test('formats JSON array', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').first().fill('[1,2,3]')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(page.getByText('Valid JSON')).toBeVisible({ timeout: 5000 })
  })
})
