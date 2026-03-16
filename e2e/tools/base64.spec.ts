import { test } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Base64', () => {
  test('encodes text to Base64', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: 'Hello',
      action: 'Encode Base64',
      expectOutput: 'SGVsbG8=',
    })
  })

  test('decodes Base64 to text', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: 'SGVsbG8=',
      action: 'Decode Base64',
      expectOutput: 'Hello',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: '',
      action: 'Encode Base64',
      expectError: 'Please enter some input',
    })
  })
})
