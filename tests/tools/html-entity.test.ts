import { describe, it, expect } from 'vitest'
import { encodeHtmlEntities, decodeHtmlEntities } from '../../src/tools/html-entity'

describe('encodeHtmlEntities', () => {
  it('returns error on empty input', () => {
    const result = encodeHtmlEntities('', { mode: 'minimal' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('encodes basic HTML special characters in minimal mode', () => {
    const result = encodeHtmlEntities('<div class="test">&</div>', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;')
    }
  })

  it('preserves non-special characters in minimal mode', () => {
    const result = encodeHtmlEntities('Hello World 123', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello World 123')
    }
  })

  it('encodes single quotes in minimal mode', () => {
    const result = encodeHtmlEntities("it's", { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('it&apos;s')
    }
  })

  it('uses named entities for known characters in all mode', () => {
    const result = encodeHtmlEntities('\u00a9 2024', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&copy; 2024')
    }
  })

  it('uses numeric entities for unknown non-ASCII characters in all mode', () => {
    const result = encodeHtmlEntities('\u4e16', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&#19990;')
    }
  })

  it('encodes special characters with named entities in all mode', () => {
    const result = encodeHtmlEntities('\u20ac\u00a3\u00a5\u2122', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&euro;&pound;&yen;&trade;')
    }
  })

  it('handles emoji in all mode with numeric entities', () => {
    const result = encodeHtmlEntities('\u{1F600}', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&#128512;')
    }
  })

  it('encodes all five XML special characters', () => {
    const result = encodeHtmlEntities('& < > " \'', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&amp; &lt; &gt; &quot; &apos;')
    }
  })
})

describe('decodeHtmlEntities', () => {
  it('returns error on empty input', () => {
    const result = decodeHtmlEntities('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('decodes named entities', () => {
    const result = decodeHtmlEntities('&lt;div&gt;&amp;&lt;/div&gt;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('<div>&</div>')
    }
  })

  it('decodes decimal numeric entities', () => {
    const result = decodeHtmlEntities('&#60;&#62;&#38;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('<>&')
    }
  })

  it('decodes hex numeric entities (lowercase x)', () => {
    const result = decodeHtmlEntities('&#x3C;&#x3E;&#x26;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('<>&')
    }
  })

  it('decodes hex numeric entities (uppercase X)', () => {
    const result = decodeHtmlEntities('&#X3C;&#X3E;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('<>')
    }
  })

  it('decodes mixed named and numeric entities', () => {
    const result = decodeHtmlEntities('&amp; &#60; &#x3E; &quot;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('& < > "')
    }
  })

  it('decodes common named entities', () => {
    const result = decodeHtmlEntities('&copy; &reg; &trade; &euro; &pound; &yen; &nbsp;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u00a9 \u00ae \u2122 \u20ac \u00a3 \u00a5 \u00a0')
    }
  })

  it('leaves unrecognized named entities as-is', () => {
    const result = decodeHtmlEntities('&foobar;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&foobar;')
    }
  })

  it('handles text with no entities', () => {
    const result = decodeHtmlEntities('Hello World')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello World')
    }
  })

  it('decodes named entities containing digits (sup2)', () => {
    const result = decodeHtmlEntities('&sup2;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u00b2')
    }
  })

  it('decodes named entities containing digits (frac12)', () => {
    const result = decodeHtmlEntities('&frac12;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u00bd')
    }
  })

  it('decodes high Unicode code points', () => {
    const result = decodeHtmlEntities('&#128512;')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u{1F600}')
    }
  })
})

describe('roundtrip', () => {
  it('encode then decode returns original text (minimal mode)', () => {
    const original = '<p class="test">Hello & "world"</p>'
    const encoded = encodeHtmlEntities(original, { mode: 'minimal' })
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeHtmlEntities(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })

  it('encode then decode returns original text (all mode)', () => {
    const original = '\u00a9 2024 \u20ac100'
    const encoded = encodeHtmlEntities(original, { mode: 'all' })
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeHtmlEntities(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })

  it('roundtrips text with mixed content', () => {
    const original = 'Price: \u20ac50 & tax < \u00a310'
    const encoded = encodeHtmlEntities(original, { mode: 'all' })
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeHtmlEntities(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })

  it('roundtrips emoji in all mode', () => {
    const original = 'Hello \u{1F600}\u{1F680}'
    const encoded = encodeHtmlEntities(original, { mode: 'all' })
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeHtmlEntities(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })
})

describe('edge cases', () => {
  it('handles already encoded text in encode', () => {
    const result = encodeHtmlEntities('&amp;', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      // & gets encoded again -> &amp;amp;
      expect(result.value).toBe('&amp;amp;')
    }
  })

  it('handles text with only special characters', () => {
    const result = encodeHtmlEntities('&&&', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&amp;&amp;&amp;')
    }
  })

  it('handles newlines and whitespace', () => {
    const result = encodeHtmlEntities('line1\nline2\ttab', { mode: 'minimal' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('line1\nline2\ttab')
    }
  })

  it('handles Greek letters in all mode', () => {
    const result = encodeHtmlEntities('\u03b1\u03b2\u03b3', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&alpha;&beta;&gamma;')
    }
  })

  it('handles math symbols in all mode', () => {
    const result = encodeHtmlEntities('\u221e\u2260\u2264', { mode: 'all' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('&infin;&ne;&le;')
    }
  })

  it('decodes apos entity', () => {
    const result = decodeHtmlEntities('it&apos;s')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe("it's")
    }
  })
})
