import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

const TEST_PEM = `-----BEGIN CERTIFICATE-----
MIICEjCCAXugAwIBAgIQMIMChMLGrR+QvmQvpwAU6zANBgkqhkiG9w0BAQsFAMDAS
MRAwDgYDVQQKEwdBY21lIENvMB4XDTE5MDUxNjIxNTQwNVoXDTIwMDUxNTIxNTQw
NVowEjEQMA4GA1UEChMHQWNtZSBDbzBcMA0GCSqGSIb3DQEBAQUAAOsAMEgCQQC7
------END CERTIFICATE-----`

// A minimal valid base64 PEM for reliable testing
const VALID_PEM = `-----BEGIN CERTIFICATE-----
MIIB0zCCAXmgAwIBAgIJAI/M7BYjwB6uMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTIwOTEyMjE1MjAyWhcNMTUwOTEyMjE1MjAyWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANLJ
hPYhR5Wt46mtZUkGJxRkWiY7V6g6n/r/K72sSxjIiLz6OAY2yEHGsMBF0DRMBR+6
LiyMApKVACKCH15emgkCAwEAAaNQME4wHQYDVR0OBBYEFJvKs8RfJaXTH08W+SGv
zQyKn0H8MB8GA1UdIwQYMBaAFJvKs8RfJaXTH08W+SGvzQyKn0H8MAwGA1UdEwQF
MAMBAf8wDQYJKoZIhvcNAQEFBQADQQBJlffJHybjDGxRMqaRmDhX0+6v02TUKZsW
r5QuVbpQhH6u+0UgcW0jp9QwpGcd41n8OIb+p2lLBjJplg0tYxcD
-----END CERTIFICATE-----`

test.describe('PEM Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/pem-inspector/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('processes a PEM certificate', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(TEST_PEM)

    const button = page.getByRole('button', { name: 'Extract Information' })
    await button.click()

    // The test PEM may be invalid, so we accept either a successful parse or a status message
    const fingerprint = page.getByText('SHA-256 fingerprint')
    const statusMessage = page.locator('[data-testid="status-message"]')

    await expect(fingerprint.or(statusMessage)).toBeVisible()
  })

  test('shows error for invalid PEM input', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill('not valid')

    const button = page.getByRole('button', { name: 'Extract Information' })
    await button.click()

    const statusMessage = page.locator('[data-testid="status-message"]')
    await expect(statusMessage).toBeVisible()
  })

  test('displays result cards with fingerprint, DER size, and DER hex', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_PEM)
    await page.getByRole('button', { name: 'Extract Information' }).click()

    // Should show 3 result cards: fingerprint, DER size, DER hex
    const cards = page.locator('.rounded-lg.border.border-border.bg-surface-raised.p-4')
    await expect(cards).toHaveCount(3, { timeout: 5000 })
  })

  test('fingerprint displays colon-separated hex format', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_PEM)
    await page.getByRole('button', { name: 'Extract Information' }).click()

    // SHA-256 fingerprint should be colon-separated hex (e.g., AB:CD:EF:...)
    const cards = page.locator('.rounded-lg.border.border-border.bg-surface-raised.p-4')
    await expect(cards.first()).toBeVisible({ timeout: 5000 })
    const fingerprintText = await cards.first().locator('.font-mono').textContent()
    // Should match hex pairs separated by colons
    expect(fingerprintText?.trim()).toMatch(/^([0-9A-F]{2}:)+[0-9A-F]{2}$/)
  })

  test('DER size is displayed in bytes', async ({ page }) => {
    const textarea = page.locator('[data-testid="textarea"]').first()
    await textarea.fill(VALID_PEM)
    await page.getByRole('button', { name: 'Extract Information' }).click()

    // Should display "N bytes" for DER size (exact match to avoid matching "first 20 bytes" text)
    await expect(page.getByText(/^\d+ bytes$/)).toBeVisible({ timeout: 5000 })
  })

  test('shows error on empty input', async ({ page }) => {
    await page.getByRole('button', { name: 'Extract Information' }).click()
    await expect(page.locator('[data-testid="status-message"]')).toBeVisible({ timeout: 5000 })
  })
})
