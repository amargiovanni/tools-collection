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

  test('converts multiple shortcodes in one input', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: ':heart: :smile: :thumbsup:',
      action: 'Shortcode → Emoji',
      expectOutputContains: '❤',
    })
  })

  test('handles mixed text and shortcodes', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: 'I :heart: coding',
      action: 'Shortcode → Emoji',
      expectOutputContains: 'coding',
    })
  })

  test('converts emoji back to shortcode (reverse)', async ({ page }) => {
    await toolTest(page, {
      toolId: 'emoji-shortcode',
      input: '\u{1F525}',
      action: 'Emoji \u2192 Shortcode',
      expectOutputContains: ':fire:',
    })
  })
})
