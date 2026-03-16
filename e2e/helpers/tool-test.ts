import { type Page, expect } from '@playwright/test'

export interface ToolTestOptions {
  toolId: string
  input: string
  action: string
  expectOutput?: string
  expectOutputContains?: string
  expectError?: string
}

/**
 * Wait for SolidJS island hydration.
 * Astro SSR renders the HTML but SolidJS event handlers are only attached
 * after hydration completes. We detect hydration by waiting for the
 * `data-hk` attribute (SolidJS hydration key) to be removed from DOM,
 * or by waiting for an Astro hydration marker to disappear.
 * As a fallback, we wait for the main script to execute.
 */
async function waitForHydration(page: Page): Promise<void> {
  // Wait for Astro's astro-island to be marked as hydrated
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    // Once hydrated, the island's component renders real DOM with event listeners
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  // Additional small wait for SolidJS to finish attaching delegated events
  await page.waitForTimeout(300)
}

export async function toolTest(page: Page, options: ToolTestOptions): Promise<void> {
  await page.goto(`/en/tools/${options.toolId}/`, { waitUntil: 'networkidle' })
  await waitForHydration(page)

  const textarea = page.locator('[data-testid="textarea"]').first()
  await textarea.fill(options.input)

  const button = page.getByRole('button', { name: options.action })
  await button.click()

  if (options.expectError) {
    const error = page.locator('[data-testid="status-message"]')
    await expect(error).toBeVisible()
    await expect(error).toContainText(options.expectError)
    return
  }

  if (options.expectOutput) {
    const output = page.locator('[data-testid="output-panel"] textarea')
    await expect(output).toHaveValue(options.expectOutput)
  }

  if (options.expectOutputContains) {
    const output = page.locator('[data-testid="output-panel"] textarea')
    const escaped = options.expectOutputContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await expect(output).toHaveValue(new RegExp(escaped))
  }
}
