import { test } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Domain Extractor', () => {
  test('extracts domains from URLs', async ({ page }) => {
    await toolTest(page, {
      toolId: 'domain-extractor',
      input: 'https://example.com/path\nhttps://sub.test.org/',
      action: 'Extract Domains',
      expectOutputContains: 'example.com',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'domain-extractor',
      input: '',
      action: 'Extract Domains',
      expectError: 'Please enter some input',
    })
  })
})
