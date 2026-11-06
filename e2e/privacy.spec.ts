import { test, expect } from '@playwright/test'

// Nothing may leave the visitor's browser: every request a page makes goes to
// its own origin. A third-party font or script host receives the visitor's IP
// address and user agent on every page view.
test.describe('Privacy: no third-party requests', () => {
  test('home → tool navigation requests only same-origin resources', async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? 'http://localhost:4321').origin
    const thirdParty: string[] = []
    page.on('request', (req) => {
      const url = new URL(req.url())
      if (url.protocol === 'data:' || url.protocol === 'blob:') return
      if (url.origin !== origin) thirdParty.push(req.url())
    })

    await page.goto('/en/', { waitUntil: 'networkidle' })
    await page.locator('a[href*="/en/tools/base64/"]').click()
    await expect(page).toHaveURL(/\/en\/tools\/base64\//)
    await page.waitForLoadState('networkidle')

    expect(thirdParty).toEqual([])
  })

  test('the CSP allows no third-party font or style host', async ({ page }) => {
    await page.goto('/en/')
    const csp = await page
      .locator('meta[http-equiv="content-security-policy"]')
      .getAttribute('content')
    expect(csp).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/)
  })

  test('the site fonts are self-hosted and actually used', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' })
    // document.fonts.check() is true for a family with no @font-face at all,
    // so force each face to load and require a loaded FontFace for it.
    const loaded = await page.evaluate(async () => {
      const families = ['Inter', 'Space Grotesk', 'JetBrains Mono']
      await Promise.all(families.map((f) => document.fonts.load(`16px "${f}"`)))
      return families.map((family) =>
        [...document.fonts].some(
          (face) => face.family.replace(/["']/g, '') === family && face.status === 'loaded',
        ),
      )
    })
    expect(loaded).toEqual([true, true, true])
  })
})
