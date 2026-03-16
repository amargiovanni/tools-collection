import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Remove Duplicate Lines', () => {
  test('removes duplicate lines from input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: 'a\nb\na',
      action: 'Remove Duplicates',
      expectOutput: 'a\nb',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-duplicate-lines',
      input: '',
      action: 'Remove Duplicates',
      expectError: 'Please enter some input',
    })
  })
})
