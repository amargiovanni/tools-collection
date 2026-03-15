import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type ListFormat = 'numbered' | 'bulleted' | 'comma' | 'pipe'

export function generateList(input: string, format: ListFormat): Result<string> {
  const lines = input.split('\n').filter(line => line.trim())

  if (lines.length === 0) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  switch (format) {
    case 'numbered':
      return ok(lines.map((line, i) => `${i + 1}. ${line}`).join('\n'))
    case 'bulleted':
      return ok(lines.map(line => `• ${line}`).join('\n'))
    case 'comma':
      return ok(lines.join(', '))
    case 'pipe':
      return ok(lines.join(' | '))
  }
}
