import { test, expect } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Remove Line Breaks', () => {
  test('removes line breaks and joins with space', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-line-breaks',
      input: 'a\nb\nc',
      action: 'Remove Line Breaks',
      expectOutput: 'a b c',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'remove-line-breaks',
      input: '',
      action: 'Remove Line Breaks',
      expectError: 'Please enter some input',
    })
  })
})
