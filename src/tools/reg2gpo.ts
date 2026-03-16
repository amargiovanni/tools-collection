import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface GpoResult {
  xml: string
  entriesCount: number
  skippedCount: number
}

interface RegistryEntry {
  hive: string
  key: string
  name: string
  type: string
  value: string
}

interface CollectionNode {
  name: string
  collections: Map<string, CollectionNode>
  entries: RegistryEntry[]
}

const DWORD_RE = /^dword:/i
const HEX_VALUE_RE = /^hex(?:\(([0-9a-fA-F]+)\))?:(.*)$/i
const REGISTRY_HEADER_RE = /^Windows Registry Editor/i
const REGEDIT4_RE = /^REGEDIT4$/i
const KEY_LINE_RE = /^\[(.+)\]$/

const hiveMap: Record<string, string> = {
  HKEY_LOCAL_MACHINE: 'HKLM',
  HKLM: 'HKLM',
  HKEY_CURRENT_USER: 'HKCU',
  HKCU: 'HKCU',
  HKEY_CLASSES_ROOT: 'HKCR',
  HKCR: 'HKCR',
  HKEY_USERS: 'HKU',
  HKU: 'HKU',
  HKEY_CURRENT_CONFIG: 'HKCC',
  HKCC: 'HKCC',
}

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function splitKeyPath(fullPath: string): { hive: string; key: string } {
  const parts = fullPath.split('\\')
  const rawHive = parts.shift() ?? ''
  const hive = hiveMap[rawHive] ?? rawHive
  return { hive, key: parts.join('\\') }
}

function decodeHexBytes(payload: string): number[] {
  return payload
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => Number.parseInt(part, 16))
    .filter(value => Number.isFinite(value))
}

function decodeUtf16Le(bytes: number[]): string {
  if (!bytes.length) return ''
  const evenLengthBytes =
    bytes.length % 2 === 0 ? bytes : bytes.slice(0, -1)
  try {
    const decoded = new TextDecoder('utf-16le').decode(
      new Uint8Array(evenLengthBytes),
    )
    return decoded.replace(/\u0000+$/g, '')
  } catch {
    return ''
  }
}

function parseHexValue(
  typeCode: string,
  payload: string,
): { type: string; value: string } {
  const bytes = decodeHexBytes(payload)
  const joined = bytes
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  if (typeCode === '2') {
    return {
      type: 'REG_EXPAND_SZ',
      value: decodeUtf16Le(bytes) || joined,
    }
  }

  if (typeCode === '7') {
    const decoded = decodeUtf16Le(bytes)
    return {
      type: 'REG_MULTI_SZ',
      value: decoded
        ? decoded
            .split('\u0000')
            .filter(Boolean)
            .join('; ')
        : joined,
    }
  }

  if (typeCode === 'b') {
    const buffer = bytes
      .slice(0, 8)
      .reduce(
        (acc, byte, index) => acc + (BigInt(byte) << (BigInt(index) * 8n)),
        0n,
      )
    return {
      type: 'REG_QWORD',
      value: buffer.toString(),
    }
  }

  return {
    type: 'REG_BINARY',
    value: joined,
  }
}

interface ParsedValue {
  skipped?: boolean
  name?: string
  type?: string
  value?: string
}

function parseValueLine(line: string): ParsedValue | null {
  const separatorIndex = line.indexOf('=')
  if (separatorIndex === -1) return null

  const rawName = line.slice(0, separatorIndex).trim()
  const rawValue = line.slice(separatorIndex + 1).trim()

  if (rawValue === '-') {
    return { skipped: true }
  }

  let name = ''
  if (rawName === '@') {
    name = '(Default)'
  } else if (rawName.startsWith('"') && rawName.endsWith('"')) {
    name = rawName.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  } else {
    return null
  }

  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return {
      name,
      type: 'REG_SZ',
      value: rawValue
        .slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\'),
    }
  }

  if (DWORD_RE.test(rawValue)) {
    const hex = rawValue.slice(6).trim()
    const parsed = Number.parseInt(hex, 16)
    return {
      name,
      type: 'REG_DWORD',
      value: Number.isFinite(parsed) ? parsed.toString() : hex,
    }
  }

  const hexMatch = rawValue.match(HEX_VALUE_RE)
  if (hexMatch) {
    const typeCode = (hexMatch[1] ?? '').toLowerCase()
    const payload = hexMatch[2] ?? ''
    return {
      name,
      ...parseHexValue(typeCode, payload),
    }
  }

  return {
    name,
    type: 'REG_UNKNOWN',
    value: rawValue,
  }
}

function joinContinuationLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const merged: string[] = []

  for (const line of lines) {
    if (merged.length > 0 && /\\\s*$/.test(merged[merged.length - 1]!)) {
      merged[merged.length - 1] =
        merged[merged.length - 1]!.replace(/\\\s*$/, '') + line.trim()
    } else {
      merged.push(line)
    }
  }

  return merged
}

function parseRegistry(text: string): {
  entries: RegistryEntry[]
  skippedLines: number
} {
  const lines = joinContinuationLines(text)
  const entries: RegistryEntry[] = []
  let currentKey: string | null = null
  let skippedLines = 0

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (
      !line ||
      line.startsWith(';') ||
      line.startsWith('#') ||
      REGISTRY_HEADER_RE.test(line) ||
      REGEDIT4_RE.test(line)
    ) {
      continue
    }

    const keyMatch = line.match(KEY_LINE_RE)
    if (keyMatch) {
      currentKey = keyMatch[1]
      if (currentKey.startsWith('-')) {
        currentKey = null
        skippedLines += 1
      }
      continue
    }

    if (!currentKey) {
      skippedLines += 1
      continue
    }

    const parsedValue = parseValueLine(line)
    if (!parsedValue || parsedValue.skipped) {
      skippedLines += 1
      continue
    }

    const { hive, key } = splitKeyPath(currentKey)
    if (!hive || !key) {
      skippedLines += 1
      continue
    }

    entries.push({
      hive,
      key,
      name: parsedValue.name!,
      type: parsedValue.type!,
      value: parsedValue.value!,
    })
  }

  return { entries, skippedLines }
}

function buildCollectionTree(
  collectionName: string,
  entries: RegistryEntry[],
): CollectionNode {
  const root: CollectionNode = {
    name: collectionName,
    collections: new Map(),
    entries: [],
  }

  for (const entry of entries) {
    const pathSegments = [
      entry.hive,
      ...entry.key.split('\\').filter(Boolean),
    ]
    let node = root

    for (const segment of pathSegments) {
      if (!node.collections.has(segment)) {
        node.collections.set(segment, {
          name: segment,
          collections: new Map(),
          entries: [],
        })
      }
      node = node.collections.get(segment)!
    }

    node.entries.push(entry)
  }

  return root
}

function renderCollectionTree(
  node: CollectionNode,
  indentLevel: number = 0,
): string {
  const indent = '  '.repeat(indentLevel)
  const childIndent = '  '.repeat(indentLevel + 1)
  const lines: string[] = [
    `${indent}<Collection name="${escapeXml(node.name)}">`,
  ]

  for (const entry of node.entries) {
    lines.push(
      `${childIndent}<Registry clsid="{9CD4B2F4-923D-47F5-A062-E897DD1DAD50}" name="${escapeXml(entry.name)}">`,
      `${childIndent}  <Properties action="U" hive="${escapeXml(entry.hive)}" key="${escapeXml(entry.key)}" name="${escapeXml(entry.name)}" type="${escapeXml(entry.type)}" value="${escapeXml(entry.value)}" />`,
      `${childIndent}</Registry>`,
    )
  }

  for (const childNode of node.collections.values()) {
    lines.push(renderCollectionTree(childNode, indentLevel + 1))
  }

  lines.push(`${indent}</Collection>`)
  return lines.join('\n')
}

export function convertRegToGpo(
  regContent: string,
  collectionName?: string,
): Result<GpoResult> {
  if (regContent.trim() === '') {
    return err('EMPTY_INPUT', 'Paste a .reg export or upload a file first.')
  }

  const { entries, skippedLines } = parseRegistry(regContent)

  if (entries.length === 0) {
    return err(
      'NO_ENTRIES',
      'No valid registry keys were found in the provided input.',
    )
  }

  const name = (collectionName ?? '').trim() || 'Imported_REG'
  const tree = buildCollectionTree(name, entries)
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n${renderCollectionTree(tree)}`

  return ok({
    xml,
    entriesCount: entries.length,
    skippedCount: skippedLines,
  })
}

export {
  escapeXml,
  splitKeyPath,
  decodeHexBytes,
  decodeUtf16Le,
  parseHexValue,
}
