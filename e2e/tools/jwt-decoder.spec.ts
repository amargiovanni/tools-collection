import { test, expect, type Page } from '@playwright/test'

// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":9999999999}
const VALID_JWT_FUTURE_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// Payload: {"sub":"test","iat":1000000000,"exp":1000000001} — expired 2001
const VALID_JWT_PAST_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxMDAwMDAwMDAwLCJleHAiOjEwMDAwMDAwMDF9' +
  '.signature'

// Payload: {"sub":"test","iat":1000000000} — no exp
const VALID_JWT_NO_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxMDAwMDAwMDAwfQ' +
  '.signature'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('JWT Decoder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/jwt-decoder/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('decodes a valid JWT and shows header, payload, signature cards', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const cards = page.locator('[data-testid="result-card"]')
    await expect(cards).toHaveCount(3, { timeout: 5000 })
  })

  test('header card contains alg and typ fields', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const headerCard = page.locator('[data-testid="result-card"]').first()
    await expect(headerCard).toContainText('HS256')
    await expect(headerCard).toContainText('JWT')
  })

  test('payload card contains sub and name fields', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const payloadCard = page.locator('[data-testid="result-card"]').nth(1)
    await expect(payloadCard).toContainText('1234567890')
    await expect(payloadCard).toContainText('John Doe')
  })

  test('shows VALID badge for JWT with future expiry', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    await expect(page.locator('[data-testid="expiry-badge"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="expiry-badge"]')).toContainText('VALID')
  })

  test('shows EXPIRED badge for JWT with past expiry', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_PAST_EXP)
    await expect(page.locator('[data-testid="expiry-badge"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="expiry-badge"]')).toContainText('EXPIRED')
  })

  test('shows no expiry badge for JWT without exp claim', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_NO_EXP)
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    await expect(page.locator('[data-testid="expiry-badge"]')).not.toBeAttached()
  })

  test('shows error for invalid JWT format', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill('not.a.jwt.with.too.many.parts')
    const error = page.locator('[data-testid="status-message"]')
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  test('shows nothing for empty input', async ({ page }) => {
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="status-message"]')).not.toBeVisible()
  })

  test('shows "not verified" disclaimer below signature', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    await expect(page.getByText(/not verified/i)).toBeVisible({ timeout: 5000 })
  })

  test('expiry badge shows time remaining for valid JWT', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    await expect(page.getByText(/expires in/i)).toBeVisible({ timeout: 5000 })
  })

  test('expiry badge shows elapsed time for expired JWT', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_PAST_EXP)
    await expect(page.getByText(/expired .+ ago/i)).toBeVisible({ timeout: 5000 })
  })

  test('header card shows alg as HS256 and typ as JWT', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const headerCard = page.locator('[data-testid="result-card"]').first()
    await expect(headerCard).toBeVisible({ timeout: 5000 })
    // Verify the header JSON content includes both alg and typ fields
    await expect(headerCard).toContainText('"alg"')
    await expect(headerCard).toContainText('"HS256"')
    await expect(headerCard).toContainText('"typ"')
    await expect(headerCard).toContainText('"JWT"')
  })

  test('payload card shows iat and exp numeric fields', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const payloadCard = page.locator('[data-testid="result-card"]').nth(1)
    await expect(payloadCard).toBeVisible({ timeout: 5000 })
    await expect(payloadCard).toContainText('"iat"')
    await expect(payloadCard).toContainText('1516239022')
    await expect(payloadCard).toContainText('"exp"')
    await expect(payloadCard).toContainText('9999999999')
  })

  test('JWT without exp claim shows no expiry badge but still decodes', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_NO_EXP)
    // Should still show 3 cards (header, payload, signature)
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(3, { timeout: 5000 })
    // Payload should contain iat but not exp
    const payloadCard = page.locator('[data-testid="result-card"]').nth(1)
    await expect(payloadCard).toContainText('"iat"')
    await expect(payloadCard).toContainText('1000000000')
    // No expiry badge should be present
    await expect(page.locator('[data-testid="expiry-badge"]')).not.toBeAttached()
  })

  test('signature card shows hex-encoded value', async ({ page }) => {
    await page.locator('[data-testid="textarea"]').fill(VALID_JWT_FUTURE_EXP)
    const signatureCard = page.locator('[data-testid="result-card"]').nth(2)
    await expect(signatureCard).toBeVisible({ timeout: 5000 })
    // Signature hex should be a hex string (lowercase letters and digits)
    const text = await signatureCard.textContent()
    expect(text).toMatch(/[0-9a-f]{10,}/)
  })
})
