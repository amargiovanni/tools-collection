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
})
