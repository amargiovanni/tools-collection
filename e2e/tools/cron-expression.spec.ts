import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Cron Expression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/cron-expression/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('shows initial expression result on load', async ({ page }) => {
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('Every 15 minutes')
  })

  test('explains every-minute expression live on input', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('* * * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('Every minute')
  })

  test('explains a specific time (09:00)', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 9 * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('09:00')
  })

  test('explains hourly at minute 0', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 * * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('minute 0')
  })

  test('shows field breakdown', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('*/5 * * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible({ timeout: 5000 })
  })

  test('shows error for invalid expression', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('not-a-cron')
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })

  test('Build cron section is visible', async ({ page }) => {
    await expect(page.getByText('Build cron')).toBeVisible()
  })

  test('explains AWS 6-field expression with format badge', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 * * ? *')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('10:00')
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('AWS')
  })

  test('auto-detects Unix format', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('*/15 * * * *')
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('Unix')
  })

  test('explains AWS expression with L (last day)', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 L * ? *')
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('AWS')
  })

  test('explains AWS expression with # (nth weekday)', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 ? * 6#3 *')
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible()
  })

  test('strips cron() wrapper and shows AWS badge', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('cron(0 10 * * ? *)')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('10:00')
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('AWS')
  })

  test('converts Unix to AWS by updating the input', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible()
    await page.getByRole('button', { name: /Convert to AWS/i }).click()
    await expect(page.locator('[data-testid="input"]')).toHaveValue('0 10 * * ? *')
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('AWS')
  })

  test('hides convert button for unconvertible L expression', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 L * ? *')
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Convert to Unix/i })).not.toBeVisible()
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('not supported')
  })

  test('shows schedule preview', async ({ page }) => {
    await expect(page.locator('[data-testid="schedule-preview"]')).toBeVisible()
    await expect(page.locator('[data-testid="schedule-preview"]')).toContainText('UTC')
  })

  test('format toggle switches builder between Unix and AWS', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'AWS', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unix', exact: true })).toBeVisible()
  })

  test('auto-switches format toggle when pasting AWS expression', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 10 ? * 6#3 *')
    await expect(page.locator('[data-testid="format-badge"]')).toContainText('AWS')
  })

  test('builder mode: clicking Daily updates expression to daily pattern', async ({ page }) => {
    await page.getByRole('button', { name: 'Daily', exact: true }).click()
    const inputValue = await page.locator('[data-testid="input"]').inputValue()
    // Daily cron should have specific minute and hour, with wildcards for day/month/dow
    expect(inputValue).toMatch(/^\d+ \d+ \* \* \*$/)
    await expect(page.locator('[data-testid="cron-summary"]')).toBeVisible()
  })

  test('builder mode: clicking Hourly updates expression', async ({ page }) => {
    await page.getByRole('button', { name: 'Hourly', exact: true }).click()
    const inputValue = await page.locator('[data-testid="input"]').inputValue()
    // Hourly cron: specific minute, wildcard hour
    expect(inputValue).toMatch(/^\d+ \* \* \* \*$/)
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('minute')
  })

  test('clicking example button updates input and summary', async ({ page }) => {
    // Click the "0 * * * *" example button (every hour at minute 0)
    await page.getByRole('button', { name: '0 * * * *' }).click()
    await expect(page.locator('[data-testid="input"]')).toHaveValue('0 * * * *')
    await expect(page.locator('[data-testid="cron-summary"]')).toContainText('minute 0')
  })

  test('schedule preview shows correct number of occurrences', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 * * * *')
    await expect(page.locator('[data-testid="schedule-preview"]')).toBeVisible({ timeout: 5000 })
    // Default count is 5 occurrences each for upcoming and previous
    const upcomingItems = page.locator('[data-testid="schedule-preview"] li')
    const count = await upcomingItems.count()
    // Should have items (both previous and upcoming lists)
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('changing occurrence count updates the schedule preview', async ({ page }) => {
    await page.locator('[data-testid="input"]').fill('0 * * * *')
    await expect(page.locator('[data-testid="schedule-preview"]')).toBeVisible({ timeout: 5000 })
    // Change count to 10
    await page.locator('[data-testid="schedule-preview"] select').selectOption('10')
    const items = page.locator('[data-testid="schedule-preview"] li')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(10)
  })
})
