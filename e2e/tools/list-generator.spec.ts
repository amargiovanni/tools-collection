import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('List Generator', () => {
  test('converts lines to numbered list', async ({ page }) => {
    await toolTest(page, {
      toolId: 'list-generator',
      input: 'a\nb\nc',
      action: 'Convert',
      expectOutputContains: '1. a',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'list-generator',
      input: '',
      action: 'Convert',
      expectError: 'Please enter some input',
    })
  })

  test('converts lines to bulleted list', async ({ page }) => {
    await page.goto('/en/tools/list-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('a\nb\nc')

    const select = page.locator('[data-testid="select"]')
    await select.selectOption('bulleted')

    const button = page.getByRole('button', { name: 'Convert' })
    await button.click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(/•/)
  })

  test('converts lines to pipe-separated format', async ({ page }) => {
    await page.goto('/en/tools/list-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('a\nb\nc')

    const select = page.locator('[data-testid="select"]')
    await select.selectOption('pipe')

    await page.getByRole('button', { name: 'Convert' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('a | b | c', { timeout: 5000 })
  })

  test('converts lines to comma-separated format', async ({ page }) => {
    await page.goto('/en/tools/list-generator/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island')
      return island !== null && island.children.length > 0
    }, undefined, { timeout: 10000 })
    await page.waitForTimeout(300)

    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('a\nb\nc')

    const select = page.locator('[data-testid="select"]')
    await select.selectOption('comma')

    await page.getByRole('button', { name: 'Convert' }).click()

    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue('a, b, c', { timeout: 5000 })
  })
})
