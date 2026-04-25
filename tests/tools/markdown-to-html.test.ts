import { describe, it, expect } from 'vitest'
import { convertMarkdownToHtml } from '../../src/tools/markdown-to-html'

const opts = { gfm: true, linkify: true, breaks: false }

function convert(input: string, override: Partial<typeof opts> = {}): string {
  const result = convertMarkdownToHtml(input, { ...opts, ...override })
  if (!result.ok) throw new Error(`unexpected error: ${result.error.code}`)
  return result.value
}

describe('convertMarkdownToHtml', () => {
  it('returns error on empty input', () => {
    const result = convertMarkdownToHtml('', opts)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = convertMarkdownToHtml('   \n\n  ', opts)
    expect(result.ok).toBe(false)
  })

  it('renders a simple paragraph', () => {
    expect(convert('Hello world')).toBe('<p>Hello world</p>')
  })

  it('renders ATX headings', () => {
    expect(convert('# H1')).toBe('<h1>H1</h1>')
    expect(convert('## H2')).toBe('<h2>H2</h2>')
    expect(convert('### H3')).toBe('<h3>H3</h3>')
    expect(convert('###### H6')).toBe('<h6>H6</h6>')
  })

  it('renders Setext headings', () => {
    expect(convert('Title\n=====')).toBe('<h1>Title</h1>')
    expect(convert('Subtitle\n--------')).toBe('<h2>Subtitle</h2>')
  })

  it('renders bold and italic', () => {
    expect(convert('**bold**')).toBe('<p><strong>bold</strong></p>')
    expect(convert('__bold__')).toBe('<p><strong>bold</strong></p>')
    expect(convert('*italic*')).toBe('<p><em>italic</em></p>')
    expect(convert('_italic_')).toBe('<p><em>italic</em></p>')
  })

  it('renders bold and italic combined', () => {
    expect(convert('**bold** and *italic*')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>',
    )
  })

  it('renders strikethrough when gfm is enabled', () => {
    expect(convert('~~gone~~')).toBe('<p><del>gone</del></p>')
  })

  it('does not render strikethrough when gfm is disabled', () => {
    const html = convert('~~gone~~', { gfm: false })
    expect(html).not.toContain('<del>')
  })

  it('renders inline code', () => {
    expect(convert('use `code` here')).toBe('<p>use <code>code</code> here</p>')
  })

  it('escapes HTML inside inline code', () => {
    expect(convert('`<script>`')).toBe('<p><code>&lt;script&gt;</code></p>')
  })

  it('renders links', () => {
    expect(convert('[Example](https://example.com)')).toBe(
      '<p><a href="https://example.com">Example</a></p>',
    )
  })

  it('renders images', () => {
    expect(convert('![alt](https://example.com/i.png)')).toBe(
      '<p><img src="https://example.com/i.png" alt="alt"></p>',
    )
  })

  it('sanitizes javascript: link URLs', () => {
    const html = convert('[click](javascript:alert(1))')
    expect(html).toContain('href="#"')
    expect(html).not.toContain('javascript:')
  })

  it('renders unordered lists', () => {
    const html = convert('- one\n- two\n- three')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
    expect(html).toContain('<li>three</li>')
    expect(html).toContain('</ul>')
  })

  it('renders ordered lists', () => {
    const html = convert('1. one\n2. two\n3. three')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('</ol>')
  })

  it('preserves ordered list start value', () => {
    const html = convert('5. five\n6. six')
    expect(html).toContain('<ol start="5">')
  })

  it('renders task lists in gfm mode', () => {
    const html = convert('- [x] done\n- [ ] todo')
    expect(html).toContain('<input type="checkbox" disabled checked>')
    expect(html).toContain('<input type="checkbox" disabled>')
    expect(html).toContain('done')
    expect(html).toContain('todo')
  })

  it('renders blockquotes', () => {
    const html = convert('> quoted text')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<p>quoted text</p>')
    expect(html).toContain('</blockquote>')
  })

  it('renders horizontal rules', () => {
    expect(convert('---')).toBe('<hr>')
    expect(convert('***')).toBe('<hr>')
    expect(convert('___')).toBe('<hr>')
  })

  it('renders fenced code blocks with language', () => {
    const html = convert('```js\nconst x = 1\n```')
    expect(html).toBe('<pre><code class="language-js">const x = 1</code></pre>')
  })

  it('renders fenced code blocks without language', () => {
    const html = convert('```\nplain code\n```')
    expect(html).toBe('<pre><code>plain code</code></pre>')
  })

  it('escapes HTML inside fenced code blocks', () => {
    const html = convert('```\n<script>alert("xss")</script>\n```')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert')
  })

  it('does not interpret markdown inside code fences', () => {
    const html = convert('```\n**not bold**\n```')
    expect(html).toContain('**not bold**')
    expect(html).not.toContain('<strong>')
  })

  it('renders indented code blocks', () => {
    const html = convert('    line1\n    line2')
    expect(html).toBe('<pre><code>line1\nline2</code></pre>')
  })

  it('renders GFM tables', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| a | b |\n| c | d |'
    const html = convert(md)
    expect(html).toContain('<table>')
    expect(html).toContain('<th>H1</th>')
    expect(html).toContain('<th>H2</th>')
    expect(html).toContain('<td>a</td>')
    expect(html).toContain('<td>d</td>')
  })

  it('honors table alignment markers', () => {
    const md = '| L | C | R |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |'
    const html = convert(md)
    expect(html).toContain('style="text-align: left"')
    expect(html).toContain('style="text-align: center"')
    expect(html).toContain('style="text-align: right"')
  })

  it('does not render tables when gfm is disabled', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| a | b |'
    const html = convert(md, { gfm: false })
    expect(html).not.toContain('<table>')
  })

  it('escapes raw HTML in paragraphs', () => {
    const html = convert('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert')
  })

  it('escapes ampersands and quotes', () => {
    const html = convert('A & "B" \'C\'')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
    expect(html).toContain('&#39;')
  })

  it('linkifies bare URLs when enabled', () => {
    const html = convert('Visit https://example.com today')
    expect(html).toContain('<a href="https://example.com">https://example.com</a>')
  })

  it('does not linkify when linkify is disabled', () => {
    const html = convert('Visit https://example.com today', { linkify: false })
    expect(html).not.toContain('<a href="https://example.com">')
  })

  it('does not double-linkify URLs already inside markdown links', () => {
    const html = convert('[click](https://example.com)')
    const matches = html.match(/<a /g) ?? []
    expect(matches.length).toBe(1)
  })

  it('converts line breaks to <br> when breaks option is enabled', () => {
    const html = convert('line1\nline2', { breaks: true })
    expect(html).toContain('<br>')
  })

  it('does not convert single line breaks to <br> by default', () => {
    const html = convert('line1\nline2', { breaks: false })
    expect(html).not.toContain('<br>')
  })

  it('separates paragraphs by blank lines', () => {
    const html = convert('first\n\nsecond')
    expect(html).toContain('<p>first</p>')
    expect(html).toContain('<p>second</p>')
  })

  it('handles a mixed document', () => {
    const md = [
      '# Title',
      '',
      'Some **bold** text and a [link](https://example.com).',
      '',
      '- item 1',
      '- item 2',
      '',
      '```',
      'code',
      '```',
    ].join('\n')
    const html = convert(md)
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<a href="https://example.com">link</a>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<pre><code>code</code></pre>')
  })

  it('does not turn underscores in identifiers into emphasis', () => {
    const html = convert('use my_var_name here')
    expect(html).toContain('my_var_name')
    expect(html).not.toContain('<em>')
  })

  it('handles CRLF line endings', () => {
    const html = convert('line1\r\nline2\r\n\r\nline3')
    expect(html).toContain('<p>line1\nline2</p>')
    expect(html).toContain('<p>line3</p>')
  })
})
