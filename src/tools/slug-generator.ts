import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type SeparatorType = 'hyphen' | 'underscore' | 'dot'

export interface SlugOptions {
  readonly separator: SeparatorType
  readonly lowercase: boolean
  readonly maxLength: number
  readonly transliterate: boolean
}

const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin extended - lowercase
  '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
  '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
  '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
  '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o', '\u00f8': 'o',
  '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
  '\u00f1': 'n',
  '\u00e7': 'c',
  '\u00df': 'ss',
  '\u00e6': 'ae',
  '\u0153': 'oe',
  '\u00f0': 'd',
  '\u00fe': 'th',
  '\u0142': 'l',
  '\u017e': 'z', '\u017a': 'z', '\u017c': 'z',
  '\u0161': 's', '\u015b': 's', '\u015f': 's',
  '\u010d': 'c', '\u0107': 'c',
  '\u0159': 'r',
  '\u010f': 'd',
  '\u0165': 't',
  '\u0148': 'n', '\u0144': 'n',
  '\u01b0': 'u',
  '\u0111': 'd',
  // Latin extended - uppercase
  '\u00c0': 'A', '\u00c1': 'A', '\u00c2': 'A', '\u00c3': 'A', '\u00c4': 'A', '\u00c5': 'A',
  '\u00c8': 'E', '\u00c9': 'E', '\u00ca': 'E', '\u00cb': 'E',
  '\u00cc': 'I', '\u00cd': 'I', '\u00ce': 'I', '\u00cf': 'I',
  '\u00d2': 'O', '\u00d3': 'O', '\u00d4': 'O', '\u00d5': 'O', '\u00d6': 'O', '\u00d8': 'O',
  '\u00d9': 'U', '\u00da': 'U', '\u00db': 'U', '\u00dc': 'U',
  '\u00d1': 'N',
  '\u00c7': 'C',
  '\u00c6': 'AE',
  '\u0152': 'OE',
  '\u00d0': 'D',
  '\u00de': 'TH',
  '\u0141': 'L',
  '\u017d': 'Z', '\u0179': 'Z', '\u017b': 'Z',
  '\u0160': 'S', '\u015a': 'S', '\u015e': 'S',
  '\u010c': 'C', '\u0106': 'C',
  '\u0158': 'R',
  '\u010e': 'D',
  '\u0164': 'T',
  '\u0147': 'N', '\u0143': 'N',
  '\u0110': 'D',
}

const SEPARATOR_CHARS: Record<SeparatorType, string> = {
  hyphen: '-',
  underscore: '_',
  dot: '.',
}

export const defaultSlugOptions: SlugOptions = {
  separator: 'hyphen',
  lowercase: true,
  maxLength: 0,
  transliterate: true,
}

function transliterate(input: string): string {
  let result = ''
  for (const char of input) {
    result += TRANSLITERATION_MAP[char] ?? char
  }
  return result
}

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function generateSlug(input: string, options: SlugOptions = defaultSlugOptions): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  const sep = SEPARATOR_CHARS[options.separator]

  let slug = validated.value

  // Step 1: transliterate known characters (before NFD to handle multi-char mappings like ss, ae)
  if (options.transliterate) {
    slug = transliterate(slug)
  }

  // Step 2: strip remaining diacritics via NFD decomposition
  slug = stripDiacritics(slug)

  // Step 3: apply case transformation
  if (options.lowercase) {
    slug = slug.toLowerCase()
  }

  // Step 4: replace non-alphanumeric characters (except the separator) with the separator
  const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const safePattern = new RegExp(`[^a-zA-Z0-9${escapedSep}]+`, 'g')
  slug = slug.replace(safePattern, sep)

  // Step 5: collapse consecutive separators
  slug = slug.replace(new RegExp(`${escapedSep}{2,}`, 'g'), sep)

  // Step 6: trim leading/trailing separators
  slug = slug.replace(new RegExp(`^${escapedSep}|${escapedSep}$`, 'g'), '')

  // Step 7: apply max length (truncate at separator boundary if possible)
  if (options.maxLength > 0 && slug.length > options.maxLength) {
    slug = slug.substring(0, options.maxLength)
    // Avoid truncating in the middle of a word: trim at last separator
    const lastSep = slug.lastIndexOf(sep)
    if (lastSep > 0) {
      slug = slug.substring(0, lastSep)
    }
    // Remove trailing separator after truncation
    slug = slug.replace(new RegExp(`${escapedSep}$`), '')
  }

  if (slug === '') {
    return err('EMPTY_RESULT', 'The input produces an empty slug')
  }

  return ok(slug)
}
