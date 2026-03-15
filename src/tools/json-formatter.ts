import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type JsonIndent = 2 | 4 | 'tab' | 'compact'

export function formatJson(input: string, indent: JsonIndent): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    const parsed: unknown = JSON.parse(input)

    if (indent === 'compact') {
      return ok(JSON.stringify(parsed))
    }
    if (indent === 'tab') {
      return ok(JSON.stringify(parsed, null, '\t'))
    }
    return ok(JSON.stringify(parsed, null, indent))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}

export function validateJson(input: string): Result<boolean> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    JSON.parse(input)
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}
