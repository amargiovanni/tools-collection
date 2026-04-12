import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Username Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/username-generator/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('generates non-empty output', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).not.toBeEmpty({ timeout: 5000 })
  })

  test('default generates 10 usernames', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines).toHaveLength(10)
  })

  test('style select shows all 4 options', async ({ page }) => {
    const select = page.getByLabel('Style:')
    await expect(select.locator('option[value="random"]')).toHaveCount(1)
    await expect(select.locator('option[value="tech"]')).toHaveCount(1)
    await expect(select.locator('option[value="fantasy"]')).toHaveCount(1)
    await expect(select.locator('option[value="cool"]')).toHaveCount(1)
  })

  test('generates different results on each click', async ({ page }) => {
    const output = page.locator('[data-testid="output-panel"] textarea')
    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const first = await output.inputValue()

    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    const second = await output.inputValue()

    expect(first).not.toBe(second)
  })

  test('tech style generates output', async ({ page }) => {
    await page.getByLabel('Style:').selectOption('tech')
    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    await expect(page.locator('[data-testid="output-panel"] textarea')).not.toBeEmpty({ timeout: 5000 })
  })

  test('each style option produces non-empty output', async ({ page }) => {
    const styles = ['random', 'tech', 'fantasy', 'cool']
    for (const style of styles) {
      await page.getByLabel('Style:').selectOption(style)
      await page.getByRole('button', { name: 'Generate Usernames' }).click()
      const output = page.locator('[data-testid="output-panel"] textarea')
      await expect(output).not.toBeEmpty({ timeout: 5000 })
      const value = await output.inputValue()
      const lines = value.split('\n').filter((l) => l.trim() !== '')
      expect(lines.length).toBeGreaterThan(0)
    }
  })

  test('count field changes number of generated usernames', async ({ page }) => {
    const countInput = page.getByLabel('Number of usernames:')
    await countInput.fill('3')
    await page.getByRole('button', { name: 'Generate Usernames' }).click()
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).not.toBeEmpty({ timeout: 5000 })
    const value = await output.inputValue()
    const lines = value.split('\n').filter((l) => l.trim() !== '')
    expect(lines).toHaveLength(3)
  })
})
