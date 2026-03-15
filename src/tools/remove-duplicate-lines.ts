import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface DeduplicateOptions {
  caseSensitive: boolean
  preserveOrder: boolean
}

export function removeDuplicateLines(input: string, options: DeduplicateOptions): Result<string> {
  if (input === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const lines = input.split('\n')
  const seen = new Set<string>()
  const result: string[] = []

  const pushLine = (line: string): void => {
    const key = options.caseSensitive ? line : line.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    result.push(line)
  }

  if (options.preserveOrder) {
    lines.forEach(pushLine)
  } else {
    [...lines].sort((a, b) => a.localeCompare(b)).forEach(pushLine)
  }

  return ok(result.join('\n'))
}
