import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type XmlIndent = 2 | 4 | 'tab'

export function formatXml(input: string, indent: XmlIndent): Result<string> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const padding = indent === 'tab' ? '\t' : ' '.repeat(indent)
  const reg = /(>)(<)(\/*)/g

  let formatted = ''
  let pad = 0

  const xml = input.replace(reg, '$1\r\n$2$3')
  const lines = xml.split('\r\n')

  for (const line of lines) {
    let indentChange = 0

    if (/.+<\/\w[^>]*>$/.test(line)) {
      indentChange = 0
    } else if (/^<\/\w/.test(line)) {
      if (pad !== 0) {
        pad -= 1
      }
    } else if (/^<\w[^>]*[^/]>.*$/.test(line) || /^<\w+>/.test(line)) {
      indentChange = 1
    }

    formatted += padding.repeat(pad) + line + '\r\n'
    pad += indentChange
  }

  return ok(formatted.trim())
}
