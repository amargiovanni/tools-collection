import { test } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('URL Encoder', () => {
  test('encodes text to URL format', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: 'hello world',
      action: 'Encode URL',
      expectOutput: 'hello%20world',
    })
  })

  test('decodes URL-encoded text', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: 'hello%20world',
      action: 'Decode URL',
      expectOutput: 'hello world',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: '',
      action: 'Encode URL',
      expectError: 'Please enter some input',
    })
  })

  test('encodes unicode characters correctly', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: 'café résumé',
      action: 'Encode URL',
      expectOutputContains: 'caf%C3%A9',
    })
  })

  test('encodes special URL characters with spaces', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: 'hello world & friends',
      action: 'Encode URL',
      expectOutputContains: 'hello%20world',
    })
  })

  test('decodes already-encoded input correctly', async ({ page }) => {
    await toolTest(page, {
      toolId: 'url-encoder',
      input: 'caf%C3%A9%20r%C3%A9sum%C3%A9',
      action: 'Decode URL',
      expectOutput: 'café résumé',
    })
  })
})
