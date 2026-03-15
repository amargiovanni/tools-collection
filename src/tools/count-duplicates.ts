import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface DuplicateEntry {
  value: string
  count: number
  percentage: number
}

export interface CountOptions {
  caseSensitive: boolean
  sortByCount: boolean
}

export function countDuplicates(input: string, options: CountOptions): Result<DuplicateEntry[]> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const lines = input.split('\n').map(line => line.trim()).filter(Boolean)

  if (lines.length === 0) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const counts = new Map<string, number>()
  const originals = new Map<string, string>()

  for (const line of lines) {
    const key = options.caseSensitive ? line : line.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!originals.has(key)) {
      originals.set(key, line)
    }
  }

  const entries: DuplicateEntry[] = [...counts.entries()].map(([key, count]) => ({
    value: originals.get(key)!,
    count,
    percentage: parseFloat(((count / lines.length) * 100).toFixed(1)),
  }))

  entries.sort(
    options.sortByCount
      ? (a, b) => b.count - a.count || a.value.localeCompare(b.value)
      : (a, b) => a.value.localeCompare(b.value),
  )

  return ok(entries)
}
