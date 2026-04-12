import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export interface DiffOptions {
  ignoreCase: boolean
  ignoreWhitespace: boolean
}

export type DiffLineType = 'unchanged' | 'added' | 'deleted'

export interface DiffLine {
  type: DiffLineType
  content: string
  lineNumber: number
}

export interface DiffResult {
  lines: DiffLine[]
  additions: number
  deletions: number
  unchanged: number
}

export function computeDiff(
  left: string,
  right: string,
  options: DiffOptions,
): Result<DiffResult> {
  const validatedLeft = validateNonEmpty(left)
  const validatedRight = validateNonEmpty(right)
  if (!validatedLeft.ok && !validatedRight.ok) {
    return err('EMPTY_INPUT', 'Please enter text in both fields')
  }

  let content1 = left
  let content2 = right

  if (options.ignoreCase) {
    content1 = content1.toLowerCase()
    content2 = content2.toLowerCase()
  }

  if (options.ignoreWhitespace) {
    content1 = content1.replace(/\s+/g, ' ').trim()
    content2 = content2.replace(/\s+/g, ' ').trim()
  }

  const lines1 = content1.split('\n')
  const lines2 = content2.split('\n')
  const maxLines = Math.max(lines1.length, lines2.length)

  const lines: DiffLine[] = []
  let additions = 0
  let deletions = 0
  let unchanged = 0

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] ?? ''
    const line2 = lines2[i] ?? ''

    if (line1 === line2) {
      lines.push({ type: 'unchanged', content: line1, lineNumber: i + 1 })
      if (line1 || line2) unchanged++
    } else if (!line1 && line2) {
      lines.push({ type: 'added', content: line2, lineNumber: i + 1 })
      additions++
    } else if (line1 && !line2) {
      lines.push({ type: 'deleted', content: line1, lineNumber: i + 1 })
      deletions++
    } else {
      lines.push({ type: 'deleted', content: line1, lineNumber: i + 1 })
      lines.push({ type: 'added', content: line2, lineNumber: i + 1 })
      additions++
      deletions++
    }
  }

  return ok({ lines, additions, deletions, unchanged })
}
