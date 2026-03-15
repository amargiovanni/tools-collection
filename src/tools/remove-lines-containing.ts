import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface FilterOptions {
  terms: string[]
  caseSensitive: boolean
}

export interface FilterResult {
  output: string
  removed: number
  kept: number
}

export function removeLinesContaining(input: string, options: FilterOptions): Result<FilterResult> {
  if (input === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  if (options.terms.length === 0) {
    const lines = input.split('\n')
    return ok({ output: input, removed: 0, kept: lines.length })
  }

  const haystackTerms = options.caseSensitive
    ? options.terms
    : options.terms.map(term => term.toLowerCase())

  const lines = input.split('\n')
  const kept: string[] = []
  let removed = 0

  lines.forEach(line => {
    const candidate = options.caseSensitive ? line : line.toLowerCase()
    const shouldRemove = haystackTerms.some(term => candidate.includes(term))
    if (shouldRemove) {
      removed += 1
    } else {
      kept.push(line)
    }
  })

  return ok({ output: kept.join('\n'), removed, kept: kept.length })
}
