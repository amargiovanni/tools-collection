import { test, expect, type Page } from '@playwright/test'

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island')
    return island !== null && island.children.length > 0
  }, undefined, { timeout: 10000 })
  await page.waitForTimeout(300)
}

test.describe('Number Base Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/tools/number-base-converter/', { waitUntil: 'networkidle' })
    await waitForHydration(page)
  })

  test('all four input fields are visible', async ({ page }) => {
    await expect(page.getByLabel('Decimal', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Hexadecimal')).toBeVisible()
    await expect(page.getByLabel('Binary')).toBeVisible()
    await expect(page.getByLabel('Octal')).toBeVisible()
  })

  test('typing decimal 255 fills hex ff, binary 11111111, octal 377', async ({ page }) => {
    await page.getByLabel('Decimal', { exact: true }).fill('255')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('ff')
    await expect(page.getByLabel('Binary')).toHaveValue('11111111')
    await expect(page.getByLabel('Octal')).toHaveValue('377')
  })

  test('typing hex ff fills decimal 255, binary 11111111, octal 377', async ({ page }) => {
    await page.getByLabel('Hexadecimal').fill('ff')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('255')
    await expect(page.getByLabel('Binary')).toHaveValue('11111111')
    await expect(page.getByLabel('Octal')).toHaveValue('377')
  })

  test('typing binary 11111111 fills decimal 255, hex ff, octal 377', async ({ page }) => {
    await page.getByLabel('Binary').fill('11111111')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('255')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('ff')
    await expect(page.getByLabel('Octal')).toHaveValue('377')
  })

  test('typing octal 377 fills decimal 255, hex ff, binary 11111111', async ({ page }) => {
    await page.getByLabel('Octal').fill('377')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('255')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('ff')
    await expect(page.getByLabel('Binary')).toHaveValue('11111111')
  })

  test('clearing input clears all other fields', async ({ page }) => {
    await page.getByLabel('Decimal', { exact: true }).fill('255')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('ff')
    await page.getByLabel('Decimal', { exact: true }).fill('')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('')
    await expect(page.getByLabel('Binary')).toHaveValue('')
    await expect(page.getByLabel('Octal')).toHaveValue('')
  })

  test('invalid binary digit shows error border on that field', async ({ page }) => {
    await page.getByLabel('Binary').fill('2')
    const binaryInput = page.getByLabel('Binary')
    await expect(binaryInput).toHaveClass(/border-red-500/)
  })

  test('invalid hex digit shows error border on that field', async ({ page }) => {
    await page.getByLabel('Hexadecimal').fill('g')
    const hexInput = page.getByLabel('Hexadecimal')
    await expect(hexInput).toHaveClass(/border-red-500/)
  })

  test('handles zero correctly', async ({ page }) => {
    await page.getByLabel('Decimal', { exact: true }).fill('0')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('0')
    await expect(page.getByLabel('Binary')).toHaveValue('0')
    await expect(page.getByLabel('Octal')).toHaveValue('0')
  })

  test('handles large number (beyond MAX_SAFE_INTEGER)', async ({ page }) => {
    await page.getByLabel('Decimal', { exact: true }).fill('9007199254740993')
    await expect(page.getByLabel('Hexadecimal')).not.toHaveValue('')
    await expect(page.getByLabel('Binary')).not.toHaveValue('')
  })

  test('uppercase hex input converts correctly', async ({ page }) => {
    await page.getByLabel('Hexadecimal').fill('FF')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('255')
  })

  test('hex a1b2 converts to decimal 41394', async ({ page }) => {
    await page.getByLabel('Hexadecimal').fill('a1b2')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('41394')
    await expect(page.getByLabel('Binary')).toHaveValue('1010000110110010')
    await expect(page.getByLabel('Octal')).toHaveValue('120662')
  })

  test('binary 10101010 converts to decimal 170, hex aa, octal 252', async ({ page }) => {
    await page.getByLabel('Binary').fill('10101010')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('170')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('aa')
    await expect(page.getByLabel('Octal')).toHaveValue('252')
  })

  test('octal 755 converts to decimal 493, hex 1ed, binary 111101101', async ({ page }) => {
    await page.getByLabel('Octal').fill('755')
    await expect(page.getByLabel('Decimal', { exact: true })).toHaveValue('493')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('1ed')
    await expect(page.getByLabel('Binary')).toHaveValue('111101101')
  })

  test('large number beyond MAX_SAFE_INTEGER converts correctly via BigInt', async ({ page }) => {
    // 2^64 = 18446744073709551616
    await page.getByLabel('Decimal', { exact: true }).fill('18446744073709551616')
    await expect(page.getByLabel('Hexadecimal')).toHaveValue('10000000000000000')
    await expect(page.getByLabel('Octal')).not.toHaveValue('')
    await expect(page.getByLabel('Binary')).not.toHaveValue('')
  })
})
