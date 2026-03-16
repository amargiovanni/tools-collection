import { test } from '@playwright/test'
import { toolTest } from '../helpers/tool-test'

test.describe('Emoji Shortcode', () => {
  test('converts shortcode to emoji', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: ':heart:',
      action: 'Shortcode → Emoji',
      expectOutputContains: '❤',
    })
  })

  test('converts emoji to shortcode', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: '❤️',
      action: 'Emoji → Shortcode',
      expectOutputContains: ':heart:',
    })
  })

  test('shows error on empty input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: '',
      action: 'Shortcode → Emoji',
      expectError: 'Please enter some input',
    })
  })
})
