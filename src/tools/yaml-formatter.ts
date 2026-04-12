import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type YamlIndent = 2 | 4 | 8

// ---------------------------------------------------------------------------
// Internal YAML types
// ---------------------------------------------------------------------------
type YamlValue = string | number | boolean | null | YamlValue[] | YamlMap
interface YamlMap {
  [key: string]: YamlValue
}

// ---------------------------------------------------------------------------
// YAML Parser
// ---------------------------------------------------------------------------

interface ParseContext {
  lines: string[]
  index: number
}

/** Safely read a line from context, returning empty string if out of bounds. */
function lineAt(ctx: ParseContext, i: number): string {
  return ctx.lines[i] ?? ''
}

/** Current line from the context. */
function currentLine(ctx: ParseContext): string {
  return lineAt(ctx, ctx.index)
}

function isNumeric(s: string): boolean {
  if (s === '') return false
  if (/^0x[0-9a-fA-F]+$/.test(s)) return true
  if (/^0o[0-7]+$/.test(s)) return true
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)
}

function parseScalar(raw: string): YamlValue {
  if (raw === '' || raw === 'null' || raw === 'Null' || raw === 'NULL' || raw === '~') {
    return null
  }
  if (raw === 'true' || raw === 'True' || raw === 'TRUE') return true
  if (raw === 'false' || raw === 'False' || raw === 'FALSE') return false
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    const inner = raw.slice(1, -1)
    if (raw.startsWith('"')) {
      return inner.replace(/\\(n|t|r|\\|"|\/|0|a|b|f|v|e|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})/g, (_, ch: string) => {
        switch (ch) {
          case 'n': return '\n'
          case 't': return '\t'
          case 'r': return '\r'
          case '\\': return '\\'
          case '"': return '"'
          case '/': return '/'
          case '0': return '\0'
          case 'a': return '\x07'
          case 'b': return '\b'
          case 'f': return '\f'
          case 'v': return '\v'
          case 'e': return '\x1b'
          default:
            if (ch.startsWith('x') || ch.startsWith('u') || ch.startsWith('U')) {
              return String.fromCodePoint(parseInt(ch.slice(1), 16))
            }
            return '\\' + ch
        }
      })
    }
    return inner
  }
  if (isNumeric(raw)) {
    const n = Number(raw)
    if (!Number.isNaN(n)) return n
  }
  if (raw === '.inf' || raw === '.Inf' || raw === '.INF') return Infinity
  if (raw === '-.inf' || raw === '-.Inf' || raw === '-.INF') return -Infinity
  if (raw === '.nan' || raw === '.NaN' || raw === '.NAN') return NaN
  return raw
}

function getIndentLevel(line: string): number {
  const match = line.match(/^( *)/)
  return match && match[1] ? match[1].length : 0
}

function stripComment(line: string): string {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i)
    if (ch === "'" && !inDouble) inSingle = !inSingle
    else if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === '#' && !inSingle && !inDouble) {
      if (i === 0 || line.charAt(i - 1) === ' ' || line.charAt(i - 1) === '\t') {
        return line.slice(0, i).trimEnd()
      }
    }
  }
  return line
}

function parseFlowSequence(raw: string): YamlValue[] {
  const inner = raw.slice(1, -1).trim()
  if (inner === '') return []
  const items: YamlValue[] = []
  let depth = 0
  let inSingle = false
  let inDouble = false
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    const ch = inner.charAt(i)
    if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === "'" && !inDouble) inSingle = !inSingle
    if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{') depth++
      else if (ch === ']' || ch === '}') depth--
    }
    if (ch === ',' && depth === 0 && !inSingle && !inDouble) {
      items.push(parseInlineValue(current.trim()))
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim() !== '') {
    items.push(parseInlineValue(current.trim()))
  }
  return items
}

function parseFlowMapping(raw: string): YamlMap {
  const inner = raw.slice(1, -1).trim()
  if (inner === '') return {}
  const result: YamlMap = {}
  let depth = 0
  let inSingle = false
  let inDouble = false
  let current = ''
  const pairs: string[] = []
  for (let i = 0; i < inner.length; i++) {
    const ch = inner.charAt(i)
    if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === "'" && !inDouble) inSingle = !inSingle
    if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{') depth++
      else if (ch === ']' || ch === '}') depth--
    }
    if (ch === ',' && depth === 0 && !inSingle && !inDouble) {
      pairs.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim() !== '') {
    pairs.push(current.trim())
  }
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':')
    if (colonIdx === -1) continue
    const key = pair.slice(0, colonIdx).trim()
    const val = pair.slice(colonIdx + 1).trim()
    result[key] = parseInlineValue(val)
  }
  return result
}

function parseInlineValue(raw: string): YamlValue {
  if (raw.startsWith('[') && raw.endsWith(']')) return parseFlowSequence(raw)
  if (raw.startsWith('{') && raw.endsWith('}')) return parseFlowMapping(raw)
  return parseScalar(raw)
}

function collectMultilineScalar(ctx: ParseContext, baseIndent: number, style: '|' | '>'): string {
  const collected: string[] = []
  let contentIndent = -1
  while (ctx.index < ctx.lines.length) {
    const line = currentLine(ctx)
    if (line.trim() === '') {
      collected.push('')
      ctx.index++
      continue
    }
    const indent = getIndentLevel(line)
    if (indent <= baseIndent) break
    if (contentIndent === -1) {
      contentIndent = indent
    }
    collected.push(line.slice(contentIndent))
    ctx.index++
  }
  while (collected.length > 0 && collected[collected.length - 1] === '') {
    collected.pop()
  }
  if (style === '|') {
    return collected.join('\n')
  }
  let result = ''
  for (let i = 0; i < collected.length; i++) {
    const cur = collected[i] ?? ''
    const prev = i > 0 ? (collected[i - 1] ?? '') : ''
    if (cur === '') {
      result += '\n'
    } else if (i > 0 && prev !== '') {
      result += ' ' + cur
    } else {
      result += cur
    }
  }
  return result
}

function parseValue(ctx: ParseContext, baseIndent: number): YamlValue {
  if (ctx.index >= ctx.lines.length) return null

  const line = currentLine(ctx)
  const stripped = stripComment(line).trimStart()

  if (stripped.startsWith('- ') || stripped === '-') {
    return parseSequence(ctx, getIndentLevel(line))
  }

  if (stripped.startsWith('[') && stripped.endsWith(']')) {
    ctx.index++
    return parseFlowSequence(stripped)
  }
  if (stripped.startsWith('{') && stripped.endsWith('}')) {
    ctx.index++
    return parseFlowMapping(stripped)
  }

  return parseMapping(ctx, baseIndent)
}

function parseSequence(ctx: ParseContext, seqIndent: number): YamlValue[] {
  const items: YamlValue[] = []
  while (ctx.index < ctx.lines.length) {
    const line = currentLine(ctx)
    if (line.trim() === '' || line.trim().startsWith('#')) {
      ctx.index++
      continue
    }
    const indent = getIndentLevel(line)
    if (indent < seqIndent) break
    if (indent > seqIndent) break

    const stripped = stripComment(line).trimStart()
    if (!stripped.startsWith('-')) break

    const afterDash = stripped.slice(1).trim()
    ctx.index++

    if (afterDash === '' || afterDash === '|' || afterDash === '>') {
      if (afterDash === '|' || afterDash === '>') {
        items.push(collectMultilineScalar(ctx, indent, afterDash as '|' | '>'))
      } else {
        if (ctx.index < ctx.lines.length) {
          const nextLine = currentLine(ctx)
          if (nextLine.trim() !== '' && getIndentLevel(nextLine) > indent) {
            items.push(parseValue(ctx, indent))
          } else {
            items.push(null)
          }
        } else {
          items.push(null)
        }
      }
    } else if (afterDash.includes(': ') || afterDash.endsWith(':')) {
      const mappingIndent = indent + 2
      const tempLines: string[] = [' '.repeat(mappingIndent) + afterDash]
      while (ctx.index < ctx.lines.length) {
        const nextLine = currentLine(ctx)
        if (nextLine.trim() === '' || nextLine.trim().startsWith('#')) {
          ctx.index++
          continue
        }
        if (getIndentLevel(nextLine) > indent) {
          tempLines.push(nextLine)
          ctx.index++
        } else {
          break
        }
      }
      const subCtx: ParseContext = { lines: tempLines, index: 0 }
      items.push(parseMapping(subCtx, mappingIndent))
    } else {
      items.push(parseInlineValue(afterDash))
    }
  }
  return items
}

function parseMapping(ctx: ParseContext, expectedIndent: number): YamlMap {
  const result: YamlMap = {}
  let mapIndent = -1

  while (ctx.index < ctx.lines.length) {
    const line = currentLine(ctx)

    if (line.trim() === '' || line.trim().startsWith('#')) {
      ctx.index++
      continue
    }

    const indent = getIndentLevel(line)

    if (mapIndent === -1) {
      if (indent < expectedIndent) break
      mapIndent = indent
    }

    if (indent < mapIndent) break
    if (indent > mapIndent) break

    const stripped = stripComment(line).trimStart()

    const colonIdx = stripped.indexOf(': ')
    const isKeyOnly = stripped.endsWith(':') && !stripped.includes(': ')

    if (colonIdx === -1 && !isKeyOnly) {
      break
    }

    let key: string
    let valueStr: string

    if (isKeyOnly) {
      key = stripped.slice(0, -1).trim()
      valueStr = ''
    } else {
      key = stripped.slice(0, colonIdx).trim()
      valueStr = stripped.slice(colonIdx + 2).trim()
    }

    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1)
    }

    ctx.index++

    if (valueStr === '' || valueStr === '|' || valueStr === '>') {
      if (valueStr === '|' || valueStr === '>') {
        result[key] = collectMultilineScalar(ctx, mapIndent, valueStr as '|' | '>')
      } else {
        if (ctx.index < ctx.lines.length) {
          const nextLine = currentLine(ctx)
          if (nextLine.trim() !== '' && getIndentLevel(nextLine) > mapIndent) {
            result[key] = parseValue(ctx, mapIndent)
          } else {
            result[key] = null
          }
        } else {
          result[key] = null
        }
      }
    } else {
      result[key] = parseInlineValue(valueStr)
    }
  }

  return result
}

function parseYamlDocument(input: string): YamlValue {
  const rawLines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines = rawLines.filter((l) => l.trim() !== '---' && l.trim() !== '...')
  const ctx: ParseContext = { lines, index: 0 }

  while (ctx.index < ctx.lines.length) {
    const trimmed = currentLine(ctx).trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      ctx.index++
      continue
    }
    break
  }

  if (ctx.index >= ctx.lines.length) {
    return null
  }

  const firstLine = currentLine(ctx)
  const firstTrimmed = stripComment(firstLine).trimStart()

  if (firstTrimmed.startsWith('- ') || firstTrimmed === '-') {
    return parseSequence(ctx, getIndentLevel(firstLine))
  }

  if (firstTrimmed.startsWith('[') && firstTrimmed.endsWith(']')) {
    ctx.index++
    return parseFlowSequence(firstTrimmed)
  }
  if (firstTrimmed.startsWith('{') && firstTrimmed.endsWith('}')) {
    ctx.index++
    return parseFlowMapping(firstTrimmed)
  }

  if (!firstTrimmed.includes(': ') && !firstTrimmed.endsWith(':')) {
    ctx.index++
    return parseScalar(firstTrimmed)
  }

  return parseMapping(ctx, 0)
}

// ---------------------------------------------------------------------------
// YAML Serializer
// ---------------------------------------------------------------------------

function serializeYaml(value: YamlValue, indent: number, currentIndent: number = 0): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '.nan'
    if (value === Infinity) return '.inf'
    if (value === -Infinity) return '-.inf'
    return String(value)
  }
  if (typeof value === 'string') {
    return serializeString(value)
  }
  if (Array.isArray(value)) {
    return serializeArray(value, indent, currentIndent)
  }
  return serializeObject(value, indent, currentIndent)
}

function needsQuoting(s: string): boolean {
  if (s === '') return true
  if (s === 'null' || s === 'Null' || s === 'NULL' || s === '~') return true
  if (s === 'true' || s === 'True' || s === 'TRUE') return true
  if (s === 'false' || s === 'False' || s === 'FALSE') return true
  if (s === '.inf' || s === '.Inf' || s === '.INF') return true
  if (s === '-.inf' || s === '-.Inf' || s === '-.INF') return true
  if (s === '.nan' || s === '.NaN' || s === '.NAN') return true
  if (isNumeric(s)) return true
  if (/[:{}\[\],&*?|>!%@`#]/.test(s)) return true
  if (s !== s.trim()) return true
  return false
}

function serializeString(s: string): string {
  if (s.includes('\n')) {
    return '|\n' + s.split('\n').map((line) => '  ' + line).join('\n')
  }
  if (needsQuoting(s)) {
    const escaped = s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
    return `"${escaped}"`
  }
  return s
}

function serializeArray(arr: YamlValue[], indent: number, currentIndent: number): string {
  if (arr.length === 0) return '[]'
  const pad = ' '.repeat(currentIndent)
  const lines: string[] = []
  for (const item of arr) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const innerIndent = currentIndent + indent
      const innerSerialized = serializeYaml(item, indent, innerIndent)
      const objLines = innerSerialized.split('\n')
      const firstObjLine = objLines[0] ?? ''
      lines.push(pad + '- ' + firstObjLine.slice(innerIndent))
      for (let i = 1; i < objLines.length; i++) {
        const ol = objLines[i] ?? ''
        lines.push(pad + '  ' + ol.slice(innerIndent))
      }
    } else if (typeof item === 'string' && item.includes('\n')) {
      lines.push(pad + '- |')
      for (const sLine of item.split('\n')) {
        lines.push(pad + '  ' + sLine)
      }
    } else {
      const serialized = serializeYaml(item, indent, currentIndent + indent)
      lines.push(pad + '- ' + serialized)
    }
  }
  return lines.join('\n')
}

function serializeObject(obj: YamlMap, indent: number, currentIndent: number): string {
  const keys = Object.keys(obj)
  if (keys.length === 0) return '{}'
  const pad = ' '.repeat(currentIndent)
  const lines: string[] = []
  for (const key of keys) {
    const value: YamlValue = obj[key] ?? null
    const keyStr = needsQuoting(key) && typeof parseScalar(key) !== 'string'
      ? `"${key}"`
      : key.includes(': ') || key.includes('#') || key === ''
        ? `"${key}"`
        : key
    if (value === null) {
      lines.push(pad + keyStr + ': null')
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(pad + keyStr + ': |')
      for (const sLine of value.split('\n')) {
        lines.push(pad + ' '.repeat(indent) + sLine)
      }
    } else if (typeof value === 'object' && value !== null) {
      const isEmpty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0
      if (isEmpty) {
        const inline = Array.isArray(value) ? '[]' : '{}'
        lines.push(pad + keyStr + ': ' + inline)
      } else {
        lines.push(pad + keyStr + ':')
        const nested = serializeYaml(value, indent, currentIndent + indent)
        lines.push(nested)
      }
    } else {
      const serialized = serializeYaml(value, indent, currentIndent + indent)
      lines.push(pad + keyStr + ': ' + serialized)
    }
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

function yamlValueToJson(value: YamlValue): unknown {
  if (value === null) return null
  if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(yamlValueToJson)
  }
  const obj: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    obj[k] = yamlValueToJson(v)
  }
  return obj
}

function jsonToYamlValue(value: unknown): YamlValue {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(jsonToYamlValue)
  if (typeof value === 'object') {
    const result: YamlMap = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = jsonToYamlValue(v)
    }
    return result
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Minify: compact JSON-like representation
// ---------------------------------------------------------------------------

function minifyValue(value: YamlValue): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
    return `"${escaped}"`
  }
  if (Array.isArray(value)) {
    return '[' + value.map(minifyValue).join(', ') + ']'
  }
  const pairs = Object.entries(value).map(([k, v]) => {
    const keyStr = needsQuoting(k) ? `"${k}"` : k
    return keyStr + ': ' + minifyValue(v ?? null)
  })
  return '{' + pairs.join(', ') + '}'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function validateYaml(input: string): Result<boolean> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  try {
    parseYamlDocument(input)
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid YAML'
    return err('INVALID_YAML', message)
  }
}

export function formatYaml(input: string, indent: YamlIndent): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  try {
    const parsed = parseYamlDocument(input)
    const formatted = serializeYaml(parsed, indent, 0)
    return ok(formatted)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid YAML'
    return err('INVALID_YAML', message)
  }
}

export function minifyYaml(input: string): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  try {
    const parsed = parseYamlDocument(input)
    return ok(minifyValue(parsed))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid YAML'
    return err('INVALID_YAML', message)
  }
}

export function yamlToJson(input: string, indent: number = 2): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  try {
    const parsed = parseYamlDocument(input)
    const json = yamlValueToJson(parsed)
    return ok(JSON.stringify(json, null, indent))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid YAML'
    return err('INVALID_YAML', message)
  }
}

export function jsonToYaml(input: string, indent: YamlIndent = 2): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  try {
    const parsed: unknown = JSON.parse(input)
    const yamlVal = jsonToYamlValue(parsed)
    return ok(serializeYaml(yamlVal, indent, 0))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}
