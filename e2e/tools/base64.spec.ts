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

  test('encode/decode round-trip preserves original text', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: 'The quick brown fox jumps over the lazy dog',
      action: 'Encode Base64',
      expectOutput: 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==',
    })
    // Now decode the encoded output back
    await toolTest(page, {
      toolId: 'base64',
      input: 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==',
      action: 'Decode Base64',
      expectOutput: 'The quick brown fox jumps over the lazy dog',
    })
  })

  test('encodes unicode characters correctly', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: 'Ciao mondo! 🌍',
      action: 'Encode Base64',
      expectOutputContains: 'Q2lhbyBtb25kbyE',
    })
  })

  test('encodes special characters (newlines, tabs, quotes)', async ({ page }) => {
    await toolTest(page, {
      toolId: 'base64',
      input: 'line1\nline2\ttab"quote"',
      action: 'Encode Base64',
      expectOutputContains: 'bGluZTE',
    })
  })
})
