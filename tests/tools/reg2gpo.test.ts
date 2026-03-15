import { describe, it, expect } from 'vitest'
import {
  convertRegToGpo,
  escapeXml,
  splitKeyPath,
  decodeHexBytes,
  decodeUtf16Le,
  parseHexValue,
} from '../../src/tools/reg2gpo'

describe('escapeXml', () => {
  it('escapes all XML special characters', () => {
    expect(escapeXml('a&b<c>d"e\'f')).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f')
  })

  it('returns plain text unchanged', () => {
    expect(escapeXml('hello world')).toBe('hello world')
  })
})

describe('splitKeyPath', () => {
  it('splits a full registry path', () => {
    const result = splitKeyPath('HKEY_LOCAL_MACHINE\\SOFTWARE\\Test')
    expect(result.hive).toBe('HKLM')
    expect(result.key).toBe('SOFTWARE\\Test')
  })

  it('maps short hive names', () => {
    const result = splitKeyPath('HKCU\\Software\\App')
    expect(result.hive).toBe('HKCU')
    expect(result.key).toBe('Software\\App')
  })

  it('passes through unknown hive names', () => {
    const result = splitKeyPath('UNKNOWN\\Path')
    expect(result.hive).toBe('UNKNOWN')
    expect(result.key).toBe('Path')
  })
})

describe('decodeHexBytes', () => {
  it('decodes comma-separated hex bytes', () => {
    expect(decodeHexBytes('48,65,6c,6c,6f')).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f])
  })

  it('handles empty string', () => {
    expect(decodeHexBytes('')).toEqual([])
  })

  it('handles spaces around commas', () => {
    expect(decodeHexBytes('ff, 00, ab')).toEqual([0xff, 0x00, 0xab])
  })
})

describe('decodeUtf16Le', () => {
  it('decodes UTF-16LE bytes', () => {
    // "Hi" in UTF-16LE: H=0x48,0x00  i=0x69,0x00
    const bytes = [0x48, 0x00, 0x69, 0x00]
    expect(decodeUtf16Le(bytes)).toBe('Hi')
  })

  it('strips trailing null bytes', () => {
    const bytes = [0x48, 0x00, 0x69, 0x00, 0x00, 0x00]
    expect(decodeUtf16Le(bytes)).toBe('Hi')
  })

  it('returns empty string for empty array', () => {
    expect(decodeUtf16Le([])).toBe('')
  })
})

describe('parseHexValue', () => {
  it('parses type 2 as REG_EXPAND_SZ', () => {
    // "A" in UTF-16LE: 0x41, 0x00
    const result = parseHexValue('2', '41,00,00,00')
    expect(result.type).toBe('REG_EXPAND_SZ')
    expect(result.value).toBe('A')
  })

  it('parses type 7 as REG_MULTI_SZ', () => {
    // "A\0B\0\0" in UTF-16LE
    const result = parseHexValue('7', '41,00,00,00,42,00,00,00,00,00')
    expect(result.type).toBe('REG_MULTI_SZ')
    expect(result.value).toContain('A')
    expect(result.value).toContain('B')
  })

  it('parses type b as REG_QWORD', () => {
    const result = parseHexValue('b', '01,00,00,00,00,00,00,00')
    expect(result.type).toBe('REG_QWORD')
    expect(result.value).toBe('1')
  })

  it('returns REG_BINARY for unknown type codes', () => {
    const result = parseHexValue('', '01,02,03')
    expect(result.type).toBe('REG_BINARY')
    expect(result.value).toBe('010203')
  })
})

describe('convertRegToGpo', () => {
  it('returns error for empty input', () => {
    const result = convertRegToGpo('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error when no valid entries found', () => {
    const result = convertRegToGpo('; comment only\n# another comment')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NO_ENTRIES')
    }
  })

  it('converts a simple .reg file with REG_SZ', () => {
    const regContent = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SOFTWARE\\TestApp]
"DisplayName"="My App"
`

    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entriesCount).toBe(1)
      expect(result.value.xml).toContain('<?xml version="1.0" encoding="utf-8"?>')
      expect(result.value.xml).toContain('name="DisplayName"')
      expect(result.value.xml).toContain('type="REG_SZ"')
      expect(result.value.xml).toContain('value="My App"')
      expect(result.value.xml).toContain('hive="HKLM"')
      expect(result.value.xml).toContain('key="SOFTWARE\\TestApp"')
    }
  })

  it('converts DWORD values', () => {
    const regContent = `Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\\Software\\Test]
"Enabled"=dword:00000001
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.xml).toContain('type="REG_DWORD"')
      expect(result.value.xml).toContain('value="1"')
    }
  })

  it('uses custom collection name', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
"Key"="Value"
`
    const result = convertRegToGpo(regContent, 'MyCollection')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.xml).toContain('name="MyCollection"')
    }
  })

  it('uses default collection name when none provided', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
"Key"="Value"
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.xml).toContain('name="Imported_REG"')
    }
  })

  it('handles continuation lines (backslash line continuation)', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
"Binary"=hex:01,02,\\
  03,04
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entriesCount).toBe(1)
      expect(result.value.xml).toContain('type="REG_BINARY"')
    }
  })

  it('skips deletion entries (value = -)', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
"Keep"="yes"
"Remove"=-
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entriesCount).toBe(1)
      expect(result.value.skippedCount).toBe(1)
    }
  })

  it('skips deletion keys (prefixed with -)', () => {
    const regContent = `[-HKEY_LOCAL_MACHINE\\SOFTWARE\\DeleteMe]
[HKEY_LOCAL_MACHINE\\SOFTWARE\\KeepMe]
"Key"="Value"
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entriesCount).toBe(1)
      expect(result.value.skippedCount).toBe(1)
    }
  })

  it('handles default value (@)', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
@="default value"
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.xml).toContain('name="(Default)"')
      expect(result.value.xml).toContain('value="default value"')
    }
  })

  it('escapes XML special characters in values', () => {
    const regContent = `[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]
"Special"="<tag>&amp;"
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.xml).toContain('&lt;tag&gt;&amp;amp;')
    }
  })

  it('handles multiple keys and values', () => {
    const regContent = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SOFTWARE\\App1]
"Name"="App One"
"Version"="1.0"

[HKEY_CURRENT_USER\\Software\\App2]
"Name"="App Two"
`
    const result = convertRegToGpo(regContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entriesCount).toBe(3)
    }
  })
})
