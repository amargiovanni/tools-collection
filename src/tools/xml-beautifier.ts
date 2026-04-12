import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type XmlIndent = 2 | 4 | 'tab'

const TAG_SPLIT_RE = /(>)(<)(\/*)/g
const SELF_CLOSING_LINE_RE = /.+<\/\w[^>]*>$/
const CLOSING_TAG_RE = /^<\/\w/
const OPENING_TAG_RE = /^<\w[^>]*[^/]>.*$/
const SIMPLE_OPENING_TAG_RE = /^<\w+>/

export function formatXml(input: string, indent: XmlIndent): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  const padding = indent === 'tab' ? '\t' : ' '.repeat(indent)

  let formatted = ''
  let pad = 0

  const xml = validated.value.replace(TAG_SPLIT_RE, '$1\r\n$2$3')
  const lines = xml.split('\r\n')

  for (const line of lines) {
    let indentChange = 0

    if (SELF_CLOSING_LINE_RE.test(line)) {
      indentChange = 0
    } else if (CLOSING_TAG_RE.test(line)) {
      if (pad !== 0) {
        pad -= 1
      }
    } else if (OPENING_TAG_RE.test(line) || SIMPLE_OPENING_TAG_RE.test(line)) {
      indentChange = 1
    }

    formatted += padding.repeat(pad) + line + '\r\n'
    pad += indentChange
  }

  return ok(formatted.trim())
}
