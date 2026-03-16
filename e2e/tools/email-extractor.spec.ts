import { test } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Email Extractor', () => {
  test('extracts emails from text', async ({ page }) => {
    await toolTest(page, {
      toolId: 'email-extractor',
      input: 'contact test@example.com here',
      action: 'Extract Emails',
      expectOutputContains: 'test@example.com',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'email-extractor',
      input: '',
      action: 'Extract Emails',
      expectError: 'Please enter some input',
    })
  })
})
