import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const manual = JSON.parse(readFileSync('src/config/manual-pages.json', 'utf8')) as {
  file: string
  tools: Record<string, number>
}

// The PDF manual is reachable from the home page (hero and footer) and from
// every tool page, where the link opens the PDF on that tool's page.
test.describe('User manual', () => {
  test('the PDF is served from the site', async ({ request }) => {
    const res = await request.get(manual.file)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/pdf')
    const body = await res.body()
    expect(body.subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('home links the manual in the hero and in the footer', async ({ page }) => {
    await page.goto('/it/')
    const links = page.locator(`a[href="${manual.file}"]`)
    await expect(links).toHaveCount(2)
    await expect(page.locator('.hero').locator(`a[href="${manual.file}"]`)).toContainText('Manuale utente')
    await expect(page.locator('footer.foot').locator(`a[href="${manual.file}"]`)).toBeVisible()
    await expect(links.first()).toHaveAttribute('type', 'application/pdf')
    await expect(links.first()).toHaveAttribute('hreflang', 'en')
  })

  test('a tool page deep-links to its own page of the manual', async ({ page }) => {
    await page.goto('/en/tools/base64/')
    const deep = page.locator('.tool-head').locator(`a[href="${manual.file}#page=${manual.tools.base64}"]`)
    await expect(deep).toBeVisible()
    await expect(deep).toHaveAccessibleName(/User manual p\. \d+ \(PDF, in English\)/)
    await expect(deep).toHaveAttribute('target', '_blank')
    await expect(page.locator('.tool-foot').locator(`a[href="${manual.file}"]`)).toBeVisible()
  })
})
