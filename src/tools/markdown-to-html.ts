import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export interface ConvertOptions {
  readonly gfm: boolean
  readonly linkify: boolean
  readonly breaks: boolean
}

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]!)
}

function escapeAttr(text: string): string {
  return escapeHtml(text)
}

const URL_REGEX = /\bhttps?:\/\/[^\s<>"'()]+[^\s<>"'(),.;:!?]/g

function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (/^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed) || /^\s*vbscript:/i.test(trimmed)) {
    return '#'
  }
  return trimmed
}

const PH_OPEN = '\u0001'
const PH_CLOSE = '\u0002'

interface InlineState {
  readonly gfm: boolean
  readonly linkify: boolean
  readonly placeholders: string[]
}

function reservePlaceholder(state: InlineState, html: string): string {
  const token = `${PH_OPEN}${state.placeholders.length}${PH_CLOSE}`
  state.placeholders.push(html)
  return token
}

function restorePlaceholders(text: string, state: InlineState): string {
  const re = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, 'g')
  return text.replace(re, (_, idx: string) => state.placeholders[Number(idx)] ?? '')
}

function parseInline(input: string, state: InlineState): string {
  let text = input

  text = text.replace(/`([^`\n]+)`/g, (_, code: string) => {
    return reservePlaceholder(state, `<code>${escapeHtml(code)}</code>`)
  })

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt: string, src: string, title?: string) => {
    const safeSrc = sanitizeUrl(src)
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
    return reservePlaceholder(
      state,
      `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(alt)}"${titleAttr}>`,
    )
  })

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label: string, href: string, title?: string) => {
    const safeHref = sanitizeUrl(href)
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
    const inner = parseInline(label, state)
    return reservePlaceholder(state, `<a href="${escapeAttr(safeHref)}"${titleAttr}>${inner}</a>`)
  })

  text = escapeHtml(text)

  if (state.gfm) {
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  }

  text = text.replace(/(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g, '<strong>$2</strong>')
  text = text.replace(/(?<![A-Za-z0-9_])([*_])(?=\S)([^*_\n]+?)(?<=\S)\1(?![A-Za-z0-9_])/g, '<em>$2</em>')

  if (state.linkify) {
    text = text.replace(URL_REGEX, (url) => {
      const safe = sanitizeUrl(url)
      return `<a href="${escapeAttr(safe)}">${escapeHtml(url)}</a>`
    })
  }

  return restorePlaceholders(text, state)
}

interface BlockContext {
  readonly options: ConvertOptions
}

function inlineState(options: ConvertOptions): InlineState {
  return { gfm: options.gfm, linkify: options.linkify, placeholders: [] }
}

function isHr(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3) return false
  return /^(\*\s*\*\s*\*[\s*]*|-\s*-\s*-[\s-]*|_\s*_\s*_[\s_]*)$/.test(trimmed)
}

function isFenceStart(line: string): { lang: string; marker: string } | null {
  const match = line.match(/^\s{0,3}(`{3,}|~{3,})\s*([^\s`~]*)\s*$/)
  if (!match) return null
  return { lang: match[2] ?? '', marker: match[1]! }
}

function isFenceEnd(line: string, marker: string): boolean {
  const trimmed = line.trim()
  if (!/^[`~]+$/.test(trimmed)) return false
  return trimmed[0] === marker[0] && trimmed.length >= marker.length
}

function parseHeading(line: string, ctx: BlockContext): string | null {
  const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
  if (!match) return null
  const level = match[1]!.length
  const inline = parseInline(match[2]!, inlineState(ctx.options))
  return `<h${level}>${inline}</h${level}>`
}

interface ListItem {
  content: string[]
  checked: boolean | null
}

interface ListBlock {
  readonly type: 'ul' | 'ol'
  readonly start: number
  readonly items: ListItem[]
}

function matchListItem(line: string): { ordered: boolean; start: number; rest: string; indent: number } | null {
  const ul = line.match(/^(\s*)([-*+])\s+(.*)$/)
  if (ul) {
    return { ordered: false, start: 1, rest: ul[3]!, indent: ul[1]!.length }
  }
  const ol = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
  if (ol) {
    return { ordered: true, start: parseInt(ol[2]!, 10), rest: ol[3]!, indent: ol[1]!.length }
  }
  return null
}

function renderList(block: ListBlock, ctx: BlockContext): string {
  const tag = block.type
  const startAttr = block.type === 'ol' && block.start !== 1 ? ` start="${block.start}"` : ''
  const items = block.items.map((item) => {
    const text = item.content.join('\n')
    const inline = parseInline(text, inlineState(ctx.options))
    if (ctx.options.gfm && item.checked !== null) {
      const checkedAttr = item.checked ? ' checked' : ''
      return `<li><input type="checkbox" disabled${checkedAttr}> ${inline}</li>`
    }
    return `<li>${inline}</li>`
  })
  return `<${tag}${startAttr}>\n${items.join('\n')}\n</${tag}>`
}

function parseTask(content: string): { checked: boolean; rest: string } | null {
  const match = content.match(/^\[([ xX])\]\s+(.*)$/)
  if (!match) return null
  return { checked: match[1]!.toLowerCase() === 'x', rest: match[2]! }
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('-')) return false
  return /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(trimmed)
}

function renderTable(headerLine: string, alignLine: string, bodyLines: string[], ctx: BlockContext): string {
  const splitRow = (row: string): string[] => {
    let s = row.trim()
    if (s.startsWith('|')) s = s.slice(1)
    if (s.endsWith('|')) s = s.slice(0, -1)
    return s.split('|').map((c) => c.trim())
  }

  const headers = splitRow(headerLine)
  const aligns = splitRow(alignLine).map((cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    if (left) return 'left'
    return null
  })

  const renderCell = (tag: 'th' | 'td', cell: string, align: string | null): string => {
    const inline = parseInline(cell, inlineState(ctx.options))
    const styleAttr = align ? ` style="text-align: ${align}"` : ''
    return `<${tag}${styleAttr}>${inline}</${tag}>`
  }

  const headerHtml = `<tr>${headers.map((h, i) => renderCell('th', h, aligns[i] ?? null)).join('')}</tr>`
  const bodyHtml = bodyLines.map((line) => {
    const cells = splitRow(line)
    return `<tr>${cells.map((c, i) => renderCell('td', c, aligns[i] ?? null)).join('')}</tr>`
  }).join('\n')

  return `<table>\n<thead>\n${headerHtml}\n</thead>\n<tbody>\n${bodyHtml}\n</tbody>\n</table>`
}

export function convertMarkdownToHtml(input: string, options: ConvertOptions): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    const ctx: BlockContext = { options }
    const lines = input.replace(/\r\n?/g, '\n').split('\n')
    const out: string[] = []
    let i = 0

    const flushParagraph = (buf: string[]): void => {
      if (buf.length === 0) return
      const text = buf.join('\n')
      let inline = parseInline(text, inlineState(options))
      if (options.breaks) {
        inline = inline.replace(/\n/g, '<br>\n')
      }
      out.push(`<p>${inline}</p>`)
    }

    let para: string[] = []

    while (i < lines.length) {
      const line = lines[i]!

      if (line.trim() === '') {
        flushParagraph(para)
        para = []
        i++
        continue
      }

      const fence = isFenceStart(line)
      if (fence) {
        flushParagraph(para)
        para = []
        const codeLines: string[] = []
        i++
        while (i < lines.length && !isFenceEnd(lines[i]!, fence.marker)) {
          codeLines.push(lines[i]!)
          i++
        }
        if (i < lines.length) i++
        const langClass = fence.lang ? ` class="language-${escapeAttr(fence.lang)}"` : ''
        out.push(`<pre><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        continue
      }

      if (/^ {4,}/.test(line) && para.length === 0) {
        const codeLines: string[] = []
        while (i < lines.length && (/^ {4,}/.test(lines[i]!) || lines[i]!.trim() === '')) {
          const cur = lines[i]!
          if (cur.trim() === '') {
            codeLines.push('')
          } else {
            codeLines.push(cur.slice(4))
          }
          i++
        }
        while (codeLines.length > 0 && codeLines[codeLines.length - 1] === '') {
          codeLines.pop()
        }
        out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        continue
      }

      const heading = parseHeading(line, ctx)
      if (heading) {
        flushParagraph(para)
        para = []
        out.push(heading)
        i++
        continue
      }

      const next = i + 1 < lines.length ? lines[i + 1]! : null

      if (next !== null && para.length === 0 && /^=+\s*$/.test(next.trim()) && line.trim() !== '') {
        const inline = parseInline(line.trim(), inlineState(options))
        out.push(`<h1>${inline}</h1>`)
        i += 2
        continue
      }
      if (
        next !== null &&
        para.length === 0 &&
        /^-+\s*$/.test(next.trim()) &&
        line.trim() !== '' &&
        !matchListItem(line)
      ) {
        const inline = parseInline(line.trim(), inlineState(options))
        out.push(`<h2>${inline}</h2>`)
        i += 2
        continue
      }

      if (isHr(line)) {
        flushParagraph(para)
        para = []
        out.push('<hr>')
        i++
        continue
      }

      if (/^\s*>\s?/.test(line)) {
        flushParagraph(para)
        para = []
        const quoteLines: string[] = []
        while (i < lines.length && /^\s*>\s?/.test(lines[i]!)) {
          quoteLines.push(lines[i]!.replace(/^\s*>\s?/, ''))
          i++
        }
        const innerResult = convertMarkdownToHtml(quoteLines.join('\n') || ' ', options)
        const inner = innerResult.ok ? innerResult.value : ''
        out.push(`<blockquote>\n${inner}\n</blockquote>`)
        continue
      }

      const listMatch = matchListItem(line)
      if (listMatch) {
        flushParagraph(para)
        para = []
        const block: ListBlock = {
          type: listMatch.ordered ? 'ol' : 'ul',
          start: listMatch.start,
          items: [],
        }
        let currentItem: ListItem | null = null
        while (i < lines.length) {
          const cur = lines[i]!
          if (cur.trim() === '') {
            const peek = i + 1 < lines.length ? lines[i + 1]! : null
            if (peek !== null && matchListItem(peek)) {
              i++
              continue
            }
            break
          }
          const m = matchListItem(cur)
          if (m && (m.ordered === listMatch.ordered)) {
            const taskInfo = options.gfm ? parseTask(m.rest) : null
            currentItem = {
              content: [taskInfo ? taskInfo.rest : m.rest],
              checked: taskInfo ? taskInfo.checked : null,
            }
            block.items.push(currentItem)
            i++
            continue
          }
          if (currentItem && /^\s+/.test(cur)) {
            currentItem.content.push(cur.trim())
            i++
            continue
          }
          break
        }
        out.push(renderList(block, ctx))
        continue
      }

      if (options.gfm && next !== null && line.includes('|') && isTableSeparator(next)) {
        flushParagraph(para)
        para = []
        const headerLine = line
        const alignLine = next
        const bodyLines: string[] = []
        i += 2
        while (i < lines.length && lines[i]!.trim() !== '' && lines[i]!.includes('|')) {
          bodyLines.push(lines[i]!)
          i++
        }
        out.push(renderTable(headerLine, alignLine, bodyLines, ctx))
        continue
      }

      para.push(line.trim())
      i++
    }

    flushParagraph(para)

    return ok(out.join('\n\n'))
  } catch {
    return err('CONVERT_ERROR', 'Error: unable to convert the markdown')
  }
}
