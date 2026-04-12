import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type TomlIndent = 2 | 4 | 'tab'

// ──────────────────────────────────────────────
// TOML Parser
// ──────────────────────────────────────────────

type TomlValue =
  | string
  | number
  | boolean
  | TomlDate
  | TomlValue[]
  | TomlTable

interface TomlDate {
  readonly __tomlDate: true
  readonly raw: string
}

type TomlTable = { [key: string]: TomlValue }

function isTomlDate(v: TomlValue): v is TomlDate {
  return typeof v === 'object' && v !== null && '__tomlDate' in v && (v as TomlDate).__tomlDate === true
}

function isTomlTable(v: TomlValue): v is TomlTable {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !isTomlDate(v)
}

class TomlParseError extends Error {
  readonly line: number
  constructor(message: string, line: number) {
    super(message)
    this.name = 'TomlParseError'
    this.line = line
  }
}

/** Safe accessor for string character that asserts non-undefined */
function charAt(s: string, i: number): string {
  const ch = s[i]
  if (ch === undefined) throw new Error('Unexpected end of string')
  return ch
}

class TomlParser {
  private readonly lines: string[]
  private pos = 0
  private readonly explicitTables = new Set<string>()

  constructor(input: string) {
    this.lines = input.split(/\r?\n/)
  }

  private getLine(idx: number): string {
    const line = this.lines[idx]
    if (line === undefined) throw new TomlParseError('Unexpected end of input', idx + 1)
    return line
  }

  parse(): TomlTable {
    const root: TomlTable = {}
    let currentTable = root

    while (this.pos < this.lines.length) {
      const lineNum = this.pos + 1
      const raw = this.getLine(this.pos)
      const trimmed = raw.trim()
      this.pos++

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) continue

      // Array of tables [[...]]
      if (trimmed.startsWith('[[')) {
        const endIdx = trimmed.indexOf(']]')
        if (endIdx === -1) {
          throw new TomlParseError('Unterminated array-of-tables header', lineNum)
        }
        const afterClose = trimmed.slice(endIdx + 2).trim()
        if (afterClose !== '' && !afterClose.startsWith('#')) {
          throw new TomlParseError('Unexpected content after array-of-tables header', lineNum)
        }
        const keyPath = this.parseKeyPath(trimmed.slice(2, endIdx), lineNum)
        currentTable = this.ensureArrayOfTables(root, keyPath, lineNum)
        continue
      }

      // Table header [...]
      if (trimmed.startsWith('[')) {
        const endIdx = trimmed.indexOf(']')
        if (endIdx === -1) {
          throw new TomlParseError('Unterminated table header', lineNum)
        }
        const afterClose = trimmed.slice(endIdx + 1).trim()
        if (afterClose !== '' && !afterClose.startsWith('#')) {
          throw new TomlParseError('Unexpected content after table header', lineNum)
        }
        const keyPath = this.parseKeyPath(trimmed.slice(1, endIdx), lineNum)
        currentTable = this.ensureTable(root, keyPath, lineNum)
        continue
      }

      // Key = Value
      this.parseKeyValue(currentTable, trimmed, lineNum)
    }

    return root
  }

  private parseKeyPath(raw: string, line: number): string[] {
    const keys: string[] = []
    let i = 0
    const s = raw.trim()

    while (i < s.length) {
      // Skip whitespace
      while (i < s.length && (s[i] === ' ' || s[i] === '\t')) i++

      if (i >= s.length) break

      let key: string
      if (s[i] === '"') {
        const result = this.readBasicString(s, i, line)
        key = result.value
        i = result.end
      } else if (s[i] === "'") {
        const result = this.readLiteralString(s, i, line)
        key = result.value
        i = result.end
      } else {
        const start = i
        while (i < s.length && s[i] !== '.' && s[i] !== ' ' && s[i] !== '\t') {
          const ch = charAt(s, i)
          if (/[a-zA-Z0-9_-]/.test(ch)) {
            i++
          } else {
            throw new TomlParseError(`Invalid character '${ch}' in bare key`, line)
          }
        }
        if (i === start) throw new TomlParseError('Empty key', line)
        key = s.slice(start, i)
      }

      keys.push(key)

      // Skip whitespace
      while (i < s.length && (s[i] === ' ' || s[i] === '\t')) i++

      if (i < s.length) {
        if (s[i] === '.') {
          i++
        } else {
          throw new TomlParseError(`Unexpected character '${s[i] ?? ''}'  in key path`, line)
        }
      }
    }

    if (keys.length === 0) throw new TomlParseError('Empty key path', line)
    return keys
  }

  private parseKeyValue(table: TomlTable, line: string, lineNum: number): void {
    let i = 0
    const keys: string[] = []

    // Parse key (possibly dotted)
    while (true) {
      // Skip whitespace
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

      let key: string
      if (line[i] === '"') {
        const result = this.readBasicString(line, i, lineNum)
        key = result.value
        i = result.end
      } else if (line[i] === "'") {
        const result = this.readLiteralString(line, i, lineNum)
        key = result.value
        i = result.end
      } else {
        const start = i
        while (i < line.length && line[i] !== '=' && line[i] !== '.' && line[i] !== ' ' && line[i] !== '\t') {
          const ch = charAt(line, i)
          if (/[a-zA-Z0-9_-]/.test(ch)) {
            i++
          } else {
            throw new TomlParseError(`Invalid character '${ch}' in bare key`, lineNum)
          }
        }
        if (i === start) throw new TomlParseError('Empty key', lineNum)
        key = line.slice(start, i)
      }
      keys.push(key)

      // Skip whitespace
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

      if (line[i] === '.') {
        i++
        continue
      }
      break
    }

    if (line[i] !== '=') {
      throw new TomlParseError(`Expected '=' after key, got '${line[i] ?? 'EOL'}'`, lineNum)
    }
    i++ // skip '='

    // Skip whitespace
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

    const valueResult = this.parseValue(line, i, lineNum)
    const value = valueResult.value

    // Check for trailing content (skip when value spanned multiple lines,
    // since `end` is a column offset on the closing line, not the opening line)
    if (!valueResult.multiline) {
      let trailing = line.slice(valueResult.end).trim()
      if (trailing.startsWith('#')) trailing = ''
      if (trailing !== '') {
        throw new TomlParseError(`Unexpected content after value: '${trailing}'`, lineNum)
      }
    }

    // Navigate to target table for dotted keys
    let target = table
    for (let k = 0; k < keys.length - 1; k++) {
      const subKey = keys[k]!
      if (!(subKey in target)) {
        target[subKey] = {} as TomlTable
      }
      const next = target[subKey]!
      if (!isTomlTable(next)) {
        throw new TomlParseError(`Key '${subKey}' is not a table`, lineNum)
      }
      target = next
    }

    const finalKey = keys[keys.length - 1]!
    if (finalKey in target) {
      throw new TomlParseError(`Duplicate key '${finalKey}'`, lineNum)
    }
    target[finalKey] = value
  }

  private parseValue(line: string, start: number, lineNum: number): { value: TomlValue; end: number; multiline?: boolean } {
    if (start >= line.length) {
      throw new TomlParseError('Expected value', lineNum)
    }

    const ch = line[start]

    // String values
    if (ch === '"') {
      // Check for multiline basic string
      if (line.slice(start, start + 3) === '"""') {
        return this.readMultilineBasicString(start, lineNum)
      }
      const result = this.readBasicString(line, start, lineNum)
      return { value: result.value, end: result.end }
    }

    if (ch === "'") {
      // Check for multiline literal string
      if (line.slice(start, start + 3) === "'''") {
        return this.readMultilineLiteralString(start, lineNum)
      }
      const result = this.readLiteralString(line, start, lineNum)
      return { value: result.value, end: result.end }
    }

    // Boolean
    if (line.slice(start, start + 4) === 'true') {
      return { value: true, end: start + 4 }
    }
    if (line.slice(start, start + 5) === 'false') {
      return { value: false, end: start + 5 }
    }

    // Array
    if (ch === '[') {
      return this.readArray(line, start, lineNum)
    }

    // Inline table
    if (ch === '{') {
      return this.readInlineTable(line, start, lineNum)
    }

    // Number or date
    return this.readNumberOrDate(line, start, lineNum)
  }

  private readBasicString(s: string, start: number, line: number): { value: string; end: number } {
    let i = start + 1 // skip opening "
    let result = ''

    while (i < s.length) {
      if (s[i] === '\\') {
        i++
        if (i >= s.length) throw new TomlParseError('Unterminated string escape', line)
        switch (s[i]) {
          case 'b': result += '\b'; break
          case 't': result += '\t'; break
          case 'n': result += '\n'; break
          case 'f': result += '\f'; break
          case 'r': result += '\r'; break
          case '"': result += '"'; break
          case '\\': result += '\\'; break
          case 'u': {
            const hex = s.slice(i + 1, i + 5)
            if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new TomlParseError('Invalid unicode escape', line)
            }
            result += String.fromCodePoint(parseInt(hex, 16))
            i += 4
            break
          }
          case 'U': {
            const hex = s.slice(i + 1, i + 9)
            if (hex.length < 8 || !/^[0-9a-fA-F]{8}$/.test(hex)) {
              throw new TomlParseError('Invalid unicode escape', line)
            }
            result += String.fromCodePoint(parseInt(hex, 16))
            i += 8
            break
          }
          default:
            throw new TomlParseError(`Invalid escape sequence '\\${s[i] ?? ''}'`, line)
        }
        i++
        continue
      }

      if (s[i] === '"') {
        return { value: result, end: i + 1 }
      }

      result += s[i]
      i++
    }

    throw new TomlParseError('Unterminated basic string', line)
  }

  private readLiteralString(s: string, start: number, line: number): { value: string; end: number } {
    let i = start + 1 // skip opening '
    while (i < s.length) {
      if (s[i] === "'") {
        return { value: s.slice(start + 1, i), end: i + 1 }
      }
      i++
    }
    throw new TomlParseError('Unterminated literal string', line)
  }

  private readMultilineBasicString(start: number, startLine: number): { value: TomlValue; end: number; multiline: boolean } {
    // Start after the """
    let lineIdx = this.pos - 1 // current line index
    const firstLine = this.getLine(lineIdx)
    const i = start + 3
    let result = ''

    // Check if closing """ is on the same line (after the opening """)
    const restOfFirstLine = firstLine.slice(i)
    const sameLineClose = restOfFirstLine.indexOf('"""')
    if (sameLineClose !== -1) {
      // Closing delimiter on same line: """content"""
      result = restOfFirstLine.slice(0, sameLineClose)
      const endCol = i + sameLineClose + 3
      // No need to advance this.pos since we stay on the same line
      return { value: this.processBasicStringEscapes(result, startLine), end: endCol, multiline: false }
    }

    // If there's a newline right after """, skip it
    if (restOfFirstLine.trim() === '') {
      // Content starts on next line
      lineIdx++
    } else {
      // Content on same line continues to subsequent lines
      result += restOfFirstLine + '\n'
      lineIdx++
    }

    while (lineIdx < this.lines.length) {
      const currentLine = this.getLine(lineIdx)
      const tripleIdx = currentLine.indexOf('"""')
      if (tripleIdx !== -1) {
        result += currentLine.slice(0, tripleIdx)
        this.pos = lineIdx + 1
        const endCol = tripleIdx + 3
        return { value: this.processBasicStringEscapes(result, startLine), end: endCol, multiline: true }
      }
      result += currentLine + '\n'
      lineIdx++
    }
    throw new TomlParseError('Unterminated multiline basic string', startLine)
  }

  private processBasicStringEscapes(s: string, line: number): string {
    let result = ''
    let i = 0
    while (i < s.length) {
      if (s[i] === '\\') {
        i++
        if (i >= s.length) break
        // Line ending backslash
        if (s[i] === '\n' || s[i] === '\r') {
          if (s[i] === '\r' && i + 1 < s.length && s[i + 1] === '\n') i++
          i++
          // Skip whitespace on next line
          while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++
          continue
        }
        switch (s[i]) {
          case 'b': result += '\b'; break
          case 't': result += '\t'; break
          case 'n': result += '\n'; break
          case 'f': result += '\f'; break
          case 'r': result += '\r'; break
          case '"': result += '"'; break
          case '\\': result += '\\'; break
          case 'u': {
            const hex = s.slice(i + 1, i + 5)
            if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new TomlParseError('Invalid unicode escape in multiline string', line)
            }
            result += String.fromCodePoint(parseInt(hex, 16))
            i += 4
            break
          }
          case 'U': {
            const hex = s.slice(i + 1, i + 9)
            if (hex.length < 8 || !/^[0-9a-fA-F]{8}$/.test(hex)) {
              throw new TomlParseError('Invalid unicode escape in multiline string', line)
            }
            result += String.fromCodePoint(parseInt(hex, 16))
            i += 8
            break
          }
          default:
            throw new TomlParseError(`Invalid escape '\\${s[i] ?? ''}'`, line)
        }
        i++
      } else {
        result += s[i]
        i++
      }
    }
    return result
  }

  private readMultilineLiteralString(start: number, startLine: number): { value: TomlValue; end: number; multiline: boolean } {
    let lineIdx = this.pos - 1
    const firstLine = this.getLine(lineIdx)
    const i = start + 3
    let result = ''

    // Check if closing ''' is on the same line (after the opening ''')
    const restOfFirstLine = firstLine.slice(i)
    const sameLineClose = restOfFirstLine.indexOf("'''")
    if (sameLineClose !== -1) {
      result = restOfFirstLine.slice(0, sameLineClose)
      const endCol = i + sameLineClose + 3
      return { value: result, end: endCol, multiline: false }
    }

    if (restOfFirstLine.trim() === '') {
      lineIdx++
    } else {
      result += restOfFirstLine + '\n'
      lineIdx++
    }

    while (lineIdx < this.lines.length) {
      const currentLine = this.getLine(lineIdx)
      const tripleIdx = currentLine.indexOf("'''")
      if (tripleIdx !== -1) {
        result += currentLine.slice(0, tripleIdx)
        this.pos = lineIdx + 1
        const endCol = tripleIdx + 3
        return { value: result, end: endCol, multiline: true }
      }
      result += currentLine + '\n'
      lineIdx++
    }
    throw new TomlParseError('Unterminated multiline literal string', startLine)
  }

  private readArray(line: string, start: number, lineNum: number): { value: TomlValue[]; end: number; multiline?: boolean } {
    const arr: TomlValue[] = []
    let i = start + 1 // skip [
    let currentLine = line
    let currentLineNum = lineNum
    const startingLineNum = lineNum

    const skipWsAndComments = () => {
      while (true) {
        while (i < currentLine.length && (currentLine[i] === ' ' || currentLine[i] === '\t')) i++
        if (i < currentLine.length && currentLine[i] === '#') {
          // rest of line is a comment, move to next line
          i = currentLine.length
        }
        if (i >= currentLine.length && this.pos < this.lines.length) {
          currentLine = this.getLine(this.pos)
          currentLineNum = this.pos + 1
          this.pos++
          i = 0
          continue
        }
        break
      }
    }

    skipWsAndComments()

    if (i < currentLine.length && currentLine[i] === ']') {
      return { value: arr, end: i + 1, multiline: currentLineNum !== startingLineNum ? true : undefined }
    }

    while (true) {
      skipWsAndComments()
      if (i >= currentLine.length) {
        throw new TomlParseError('Unterminated array', currentLineNum)
      }

      const valResult = this.parseValue(currentLine, i, currentLineNum)
      arr.push(valResult.value)
      i = valResult.end

      skipWsAndComments()

      if (i < currentLine.length && currentLine[i] === ',') {
        i++
        skipWsAndComments()
        // Allow trailing comma
        if (i < currentLine.length && currentLine[i] === ']') {
          return { value: arr, end: i + 1, multiline: currentLineNum !== startingLineNum ? true : undefined }
        }
        continue
      }

      if (i < currentLine.length && currentLine[i] === ']') {
        return { value: arr, end: i + 1, multiline: currentLineNum !== startingLineNum ? true : undefined }
      }

      throw new TomlParseError('Expected comma or closing bracket in array', currentLineNum)
    }
  }

  private readInlineTable(line: string, start: number, lineNum: number): { value: TomlTable; end: number } {
    const table: TomlTable = {}
    let i = start + 1 // skip {

    // Skip whitespace
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

    if (i < line.length && line[i] === '}') {
      return { value: table, end: i + 1 }
    }

    while (true) {
      // Skip whitespace
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

      // Parse key
      const keys: string[] = []
      while (true) {
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++
        let key: string
        if (line[i] === '"') {
          const r = this.readBasicString(line, i, lineNum)
          key = r.value
          i = r.end
        } else if (line[i] === "'") {
          const r = this.readLiteralString(line, i, lineNum)
          key = r.value
          i = r.end
        } else {
          const s = i
          while (i < line.length && line[i] !== '=' && line[i] !== '.' && line[i] !== ' ' && line[i] !== '\t' && line[i] !== '}' && line[i] !== ',') {
            i++
          }
          key = line.slice(s, i)
          if (key === '') throw new TomlParseError('Empty key in inline table', lineNum)
        }
        keys.push(key)
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++
        if (line[i] === '.') { i++; continue }
        break
      }

      if (line[i] !== '=') {
        throw new TomlParseError('Expected = in inline table', lineNum)
      }
      i++

      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

      const valResult = this.parseValue(line, i, lineNum)
      i = valResult.end

      // Set value in table (handle dotted keys)
      let target = table
      for (let k = 0; k < keys.length - 1; k++) {
        const kk = keys[k]!
        if (!(kk in target)) {
          target[kk] = {} as TomlTable
        }
        target = target[kk] as TomlTable
      }
      target[keys[keys.length - 1]!] = valResult.value

      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++

      if (i < line.length && line[i] === ',') {
        i++
        continue
      }

      if (i < line.length && line[i] === '}') {
        return { value: table, end: i + 1 }
      }

      throw new TomlParseError('Expected comma or closing brace in inline table', lineNum)
    }
  }

  private readNumberOrDate(line: string, start: number, lineNum: number): { value: TomlValue; end: number } {
    let i = start
    // Collect token until whitespace, comma, ], }, or #
    while (i < line.length && line[i] !== ' ' && line[i] !== '\t' && line[i] !== ',' && line[i] !== ']' && line[i] !== '}' && line[i] !== '#') {
      i++
    }

    const token = line.slice(start, i)

    if (token === '') throw new TomlParseError('Expected value', lineNum)

    // Special float values
    if (token === 'inf' || token === '+inf') return { value: Infinity, end: i }
    if (token === '-inf') return { value: -Infinity, end: i }
    if (token === 'nan' || token === '+nan' || token === '-nan') return { value: NaN, end: i }

    // Date/time patterns
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
    const timeOnlyRegex = /^\d{2}:\d{2}:\d{2}(\.\d+)?$/
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/

    if (dateTimeRegex.test(token) || timeOnlyRegex.test(token) || dateOnlyRegex.test(token)) {
      return { value: { __tomlDate: true, raw: token } as TomlDate, end: i }
    }

    // Number: strip underscores for parsing
    const clean = token.replace(/_/g, '')

    // Hex
    if (clean.startsWith('0x') || clean.startsWith('0X')) {
      if (clean.startsWith('0X')) throw new TomlParseError(`Uppercase prefix '0X' is not allowed; use '0x'`, lineNum)
      const n = parseInt(clean, 16)
      if (isNaN(n)) throw new TomlParseError(`Invalid hex number '${token}'`, lineNum)
      return { value: n, end: i }
    }
    // Octal
    if (clean.startsWith('0o') || clean.startsWith('0O')) {
      if (clean.startsWith('0O')) throw new TomlParseError(`Uppercase prefix '0O' is not allowed; use '0o'`, lineNum)
      const n = parseInt(clean.slice(2), 8)
      if (isNaN(n)) throw new TomlParseError(`Invalid octal number '${token}'`, lineNum)
      return { value: n, end: i }
    }
    // Binary
    if (clean.startsWith('0b') || clean.startsWith('0B')) {
      if (clean.startsWith('0B')) throw new TomlParseError(`Uppercase prefix '0B' is not allowed; use '0b'`, lineNum)
      const n = parseInt(clean.slice(2), 2)
      if (isNaN(n)) throw new TomlParseError(`Invalid binary number '${token}'`, lineNum)
      return { value: n, end: i }
    }

    // Float (has dot or e/E)
    if (clean.includes('.') || clean.includes('e') || clean.includes('E')) {
      const n = parseFloat(clean)
      if (isNaN(n)) throw new TomlParseError(`Invalid float '${token}'`, lineNum)
      return { value: n, end: i }
    }

    // Integer
    // Reject leading zeros per TOML spec (only plain "0" is allowed to start with zero)
    const intPart = clean.startsWith('+') || clean.startsWith('-') ? clean.slice(1) : clean
    if (intPart.length > 1 && intPart.startsWith('0')) {
      throw new TomlParseError(`Leading zeros are not allowed in decimal integers: '${token}'`, lineNum)
    }
    const n = parseInt(clean, 10)
    if (isNaN(n)) throw new TomlParseError(`Invalid number '${token}'`, lineNum)
    return { value: n, end: i }
  }

  private ensureTable(root: TomlTable, keys: string[], line: number): TomlTable {
    const tablePath = keys.join('.')
    if (this.explicitTables.has(tablePath)) {
      throw new TomlParseError(`Duplicate table header '[${tablePath}]'`, line)
    }
    this.explicitTables.add(tablePath)

    let current = root
    for (let ki = 0; ki < keys.length; ki++) {
      const key = keys[ki]!
      if (!(key in current)) {
        current[key] = {} as TomlTable
      }
      const next: TomlValue = current[key]!
      if (Array.isArray(next)) {
        // Navigate into the last element of an array of tables
        current = next[next.length - 1] as TomlTable
      } else if (isTomlTable(next)) {
        current = next
      } else {
        throw new TomlParseError(`Key '${key}' already exists as a non-table value`, line)
      }
    }
    return current
  }

  private ensureArrayOfTables(root: TomlTable, keys: string[], line: number): TomlTable {
    let current = root
    // Navigate through all keys except the last
    for (let ki = 0; ki < keys.length - 1; ki++) {
      const key = keys[ki]!
      if (!(key in current)) {
        current[key] = {} as TomlTable
      }
      const next: TomlValue = current[key]!
      if (Array.isArray(next)) {
        current = next[next.length - 1] as TomlTable
      } else if (isTomlTable(next)) {
        current = next
      } else {
        throw new TomlParseError(`Key '${key}' already exists as a non-table value`, line)
      }
    }

    const lastKey = keys[keys.length - 1]!
    if (!(lastKey in current)) {
      current[lastKey] = [] as TomlValue[]
    }
    const arr = current[lastKey]
    if (!Array.isArray(arr)) {
      throw new TomlParseError(`Key '${lastKey}' is not an array of tables`, line)
    }
    const newTable: TomlTable = {}
    arr.push(newTable)
    return newTable
  }
}

function parseToml(input: string): TomlTable {
  const parser = new TomlParser(input)
  return parser.parse()
}

// ──────────────────────────────────────────────
// TOML Serializer
// ──────────────────────────────────────────────

function needsQuoting(key: string): boolean {
  if (key === '') return true
  return !/^[a-zA-Z0-9_-]+$/.test(key)
}

function quoteKey(key: string): string {
  if (needsQuoting(key)) {
    return '"' + escapeBasicString(key) + '"'
  }
  return key
}

function escapeBasicString(s: string): string {
  let result = ''
  for (const ch of s) {
    switch (ch) {
      case '\\': result += '\\\\'; break
      case '"': result += '\\"'; break
      case '\b': result += '\\b'; break
      case '\t': result += '\\t'; break
      case '\n': result += '\\n'; break
      case '\f': result += '\\f'; break
      case '\r': result += '\\r'; break
      default: {
        const code = ch.codePointAt(0)
        if (code !== undefined && code < 0x20 && code !== 0x09) {
          result += '\\u' + code.toString(16).padStart(4, '0')
        } else {
          result += ch
        }
      }
    }
  }
  return result
}

function serializeValue(value: TomlValue): string {
  if (typeof value === 'string') {
    return '"' + escapeBasicString(value) + '"'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    if (Object.is(value, Infinity)) return 'inf'
    if (Object.is(value, -Infinity)) return '-inf'
    if (Number.isNaN(value)) return 'nan'
    if (Number.isInteger(value)) return value.toString()
    return value.toString()
  }
  if (isTomlDate(value)) {
    return value.raw
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map(serializeValue)
    return '[' + items.join(', ') + ']'
  }
  if (isTomlTable(value)) {
    // Inline table
    const pairs: string[] = []
    for (const [k, v] of Object.entries(value)) {
      pairs.push(quoteKey(k) + ' = ' + serializeValue(v))
    }
    return '{' + pairs.join(', ') + '}'
  }
  return String(value)
}

function serializeToml(table: TomlTable, _indent: TomlIndent): string {
  const lines: string[] = []

  function writeTable(obj: TomlTable, prefix: string[]): void {
    // First, write simple key-value pairs at this level
    const simpleKeys: string[] = []
    const tableKeys: string[] = []
    const arrayOfTableKeys: string[] = []

    for (const key of Object.keys(obj)) {
      const val: TomlValue = obj[key]!
      if (isTomlTable(val)) {
        tableKeys.push(key)
      } else if (Array.isArray(val) && val.length > 0 && isTomlTable(val[0]!)) {
        arrayOfTableKeys.push(key)
      } else {
        simpleKeys.push(key)
      }
    }

    for (const key of simpleKeys) {
      lines.push(quoteKey(key) + ' = ' + serializeValue(obj[key]!))
    }

    // Write sub-tables
    for (const key of tableKeys) {
      const newPrefix = [...prefix, quoteKey(key)]
      if (lines.length > 0) lines.push('')
      lines.push('[' + newPrefix.join('.') + ']')
      writeTable(obj[key] as TomlTable, newPrefix)
    }

    // Write arrays of tables
    for (const key of arrayOfTableKeys) {
      const arr = obj[key] as TomlTable[]
      const newPrefix = [...prefix, quoteKey(key)]
      for (const item of arr) {
        if (lines.length > 0) lines.push('')
        lines.push('[[' + newPrefix.join('.') + ']]')
        writeTable(item, newPrefix)
      }
    }
  }

  writeTable(table, [])
  return lines.join('\n') + '\n'
}

// ──────────────────────────────────────────────
// JSON Conversion Helpers
// ──────────────────────────────────────────────

function tomlToJsonValue(value: TomlValue): unknown {
  if (isTomlDate(value)) return value.raw
  if (Array.isArray(value)) return value.map(tomlToJsonValue)
  if (isTomlTable(value)) {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = tomlToJsonValue(v)
    }
    return result
  }
  return value
}

function jsonToTomlValue(value: unknown, line: number): TomlValue {
  if (value === null || value === undefined) {
    throw new TomlParseError('TOML does not support null values', line)
  }
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.map((v) => jsonToTomlValue(v, line))
  }
  if (typeof value === 'object') {
    const table: TomlTable = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      table[k] = jsonToTomlValue(v, line)
    }
    return table
  }
  throw new TomlParseError(`Unsupported JSON value type: ${typeof value}`, line)
}

// ──────────────────────────────────────────────
// Minifier
// ──────────────────────────────────────────────

function minifyToml(input: string): string {
  const lines = input.split(/\r?\n/)
  const result: string[] = []
  let inMultilineString: '"""' | "'''" | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // If we're inside a multiline string, just pass through until closing delimiter
    if (inMultilineString !== null) {
      const closeIdx = line.indexOf(inMultilineString)
      if (closeIdx !== -1) {
        inMultilineString = null
      }
      result.push(line)
      continue
    }

    // Skip empty lines and comment-only lines
    if (trimmed === '' || trimmed.startsWith('#')) continue

    // Check if this line opens a multiline string
    if (trimmed.includes('"""') || trimmed.includes("'''")) {
      const tripleDoubleIdx = trimmed.indexOf('"""')
      const tripleSingleIdx = trimmed.indexOf("'''")
      let delimiter: '"""' | "'''" | null = null

      if (tripleDoubleIdx !== -1 && (tripleSingleIdx === -1 || tripleDoubleIdx < tripleSingleIdx)) {
        delimiter = '"""'
      } else if (tripleSingleIdx !== -1) {
        delimiter = "'''"
      }

      if (delimiter !== null) {
        // Check if there's a closing delimiter on the same line (after the opening one)
        const afterOpen = trimmed.indexOf(delimiter) + 3
        const closeOnSameLine = trimmed.indexOf(delimiter, afterOpen)
        if (closeOnSameLine === -1) {
          // Multiline string opens but doesn't close on this line
          inMultilineString = delimiter
        }
      }
    }

    // For table headers, strip inline comments
    if (trimmed.startsWith('[') && inMultilineString === null) {
      // Find the matching close bracket(s) properly
      const isArrayOfTables = trimmed.startsWith('[[')
      let headerEnd = -1
      if (isArrayOfTables) {
        headerEnd = trimmed.indexOf(']]')
        if (headerEnd !== -1) headerEnd += 1 // point to the second ']'
      } else {
        headerEnd = trimmed.indexOf(']')
      }
      if (headerEnd !== -1) {
        result.push(trimmed.slice(0, headerEnd + 1))
        continue
      }
    }

    // For key=value lines, strip trailing comments (respecting strings)
    if (inMultilineString === null) {
      result.push(stripTrailingComment(trimmed))
    } else {
      result.push(trimmed)
    }
  }

  return result.join('\n') + '\n'
}

function stripTrailingComment(line: string): string {
  let inString = false
  let stringChar = ''
  let i = 0

  while (i < line.length) {
    const ch = line[i]

    if (inString) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === stringChar) {
        inString = false
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = true
      stringChar = ch
      i++
      continue
    }

    if (ch === '#') {
      // Trim the whitespace before the comment
      return line.slice(0, i).trimEnd()
    }
    i++
  }

  return line
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

export function formatToml(input: string, indent: TomlIndent): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    const parsed = parseToml(validated.value)
    return ok(serializeToml(parsed, indent))
  } catch (e) {
    if (e instanceof TomlParseError) {
      return err('INVALID_TOML', `Line ${e.line}: ${e.message}`)
    }
    const message = e instanceof Error ? e.message : 'Invalid TOML'
    return err('INVALID_TOML', message)
  }
}

export function validateToml(input: string): Result<boolean> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    parseToml(validated.value)
    return ok(true)
  } catch (e) {
    if (e instanceof TomlParseError) {
      return err('INVALID_TOML', `Line ${e.line}: ${e.message}`)
    }
    const message = e instanceof Error ? e.message : 'Invalid TOML'
    return err('INVALID_TOML', message)
  }
}

export function minifyTomlStr(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    // Validate first by parsing
    parseToml(validated.value)
    return ok(minifyToml(validated.value))
  } catch (e) {
    if (e instanceof TomlParseError) {
      return err('INVALID_TOML', `Line ${e.line}: ${e.message}`)
    }
    const message = e instanceof Error ? e.message : 'Invalid TOML'
    return err('INVALID_TOML', message)
  }
}

export function tomlToJson(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    const parsed = parseToml(validated.value)
    const jsonObj = tomlToJsonValue(parsed)
    return ok(JSON.stringify(jsonObj, null, 2))
  } catch (e) {
    if (e instanceof TomlParseError) {
      return err('INVALID_TOML', `Line ${e.line}: ${e.message}`)
    }
    const message = e instanceof Error ? e.message : 'Invalid TOML'
    return err('INVALID_TOML', message)
  }
}

export function jsonToToml(input: string, indent: TomlIndent): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    const parsed: unknown = JSON.parse(validated.value)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return err('INVALID_JSON', 'JSON root must be an object to convert to TOML')
    }
    const tomlTable = jsonToTomlValue(parsed, 0) as TomlTable
    return ok(serializeToml(tomlTable, indent))
  } catch (e) {
    if (e instanceof TomlParseError) {
      return err('INVALID_JSON', e.message)
    }
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}
