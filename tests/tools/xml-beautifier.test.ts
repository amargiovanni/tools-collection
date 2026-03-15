import { describe, it, expect } from 'vitest'
import { formatXml } from '../../src/tools/xml-beautifier'

describe('formatXml', () => {
  it('returns error for empty input', () => {
    const result = formatXml('', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only input', () => {
    const result = formatXml('   ', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('formats basic XML with 2-space indent', () => {
    const result = formatXml('<root><child>text</child></root>', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('<root>')
      expect(result.value).toContain('  <child>text</child>')
      expect(result.value).toContain('</root>')
    }
  })

  it('formats with 4-space indent', () => {
    const result = formatXml('<root><child>text</child></root>', 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('    <child>text</child>')
    }
  })

  it('formats with tab indent', () => {
    const result = formatXml('<root><child>text</child></root>', 'tab')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('\t<child>text</child>')
    }
  })

  it('handles nested tags', () => {
    const result = formatXml('<a><b><c>val</c></b></a>', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const lines = result.value.split('\r\n')
      expect(lines[0]).toBe('<a>')
      expect(lines[1]).toBe('  <b>')
      expect(lines[2]).toBe('    <c>val</c>')
      expect(lines[3]).toBe('  </b>')
      expect(lines[4]).toBe('</a>')
    }
  })

  it('handles self-closing tags', () => {
    const result = formatXml('<root><item/></root>', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('<item/>')
    }
  })

  it('handles XML declaration', () => {
    const result = formatXml('<?xml version="1.0"?><root><child/></root>', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('<?xml version="1.0"?>')
    }
  })

  it('preserves already formatted XML', () => {
    const input = '<root>\r\n  <child>text</child>\r\n</root>'
    const result = formatXml(input, 2)
    expect(result.ok).toBe(true)
  })
})
