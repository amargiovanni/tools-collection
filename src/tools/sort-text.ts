import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type SortMethod =
  | 'alpha-asc'
  | 'alpha-desc'
  | 'length-asc'
  | 'length-desc'
  | 'numeric'
  | 'reverse'
  | 'random'

export interface SortOptions {
  method: SortMethod
  caseSensitive: boolean
  trimLines: boolean
  removeEmpty: boolean
  removeDuplicates: boolean
}

export function sortText(input: string, options: SortOptions): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  let lines = input.split('\n')

  if (options.trimLines) {
    lines = lines.map((l) => l.trim())
  }

  if (options.removeEmpty) {
    lines = lines.filter((l) => l !== '')
  }

  const compare = (a: string, b: string): number => {
    const ka = options.caseSensitive ? a : a.toLowerCase()
    const kb = options.caseSensitive ? b : b.toLowerCase()
    return ka.localeCompare(kb, undefined, { numeric: true })
  }

  switch (options.method) {
    case 'alpha-asc':
      lines.sort(compare)
      break
    case 'alpha-desc':
      lines.sort((a, b) => compare(b, a))
      break
    case 'length-asc':
      lines.sort((a, b) => a.length - b.length || compare(a, b))
      break
    case 'length-desc':
      lines.sort((a, b) => b.length - a.length || compare(b, a))
      break
    case 'numeric': {
      lines.sort((a, b) => {
        const na = parseFloat(a.trim())
        const nb = parseFloat(b.trim())
        if (!isNaN(na) && !isNaN(nb)) return na - nb
        if (!isNaN(na)) return -1
        if (!isNaN(nb)) return 1
        return compare(a, b)
      })
      break
    }
    case 'reverse':
      lines.reverse()
      break
    case 'random':
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = lines[i]!
        lines[i] = lines[j]!
        lines[j] = tmp
      }
      break
    default:
      return err('INVALID_SORT_METHOD', 'Unknown sort method')
  }

  if (options.removeDuplicates) {
    const seen = new Set<string>()
    lines = lines.filter((l) => {
      const key = options.caseSensitive ? l : l.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  return ok(lines.join('\n'))
}
