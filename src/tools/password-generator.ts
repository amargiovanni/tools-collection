import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface PasswordOptions {
  length: number
  count: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const

function getRandomValues(count: number): Uint32Array {
  const values = new Uint32Array(count)
  crypto.getRandomValues(values)
  return values
}

function generateSinglePassword(length: number, selectedCharsets: string[], fullCharset: string): string {
  // Pre-generate all random values needed: charset picks + fill + shuffle
  const totalRandom = selectedCharsets.length + (length - selectedCharsets.length) + length
  const randoms = getRandomValues(totalRandom)
  let ri = 0

  // Ensure at least one character from each selected charset
  const passwordChars = selectedCharsets.map(set => set.charAt(randoms[ri++]! % set.length))

  // Fill remaining positions from the full charset
  while (passwordChars.length < length) {
    passwordChars.push(fullCharset.charAt(randoms[ri++]! % fullCharset.length))
  }

  // Fisher-Yates shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randoms[ri++]! % (i + 1)
    const temp = passwordChars[i]!
    passwordChars[i] = passwordChars[j]!
    passwordChars[j] = temp
  }

  return passwordChars.join('')
}

export function generatePasswords(options: PasswordOptions): Result<string[]> {
  const selectedCharsets: string[] = []
  if (options.uppercase) selectedCharsets.push(CHARSETS.uppercase)
  if (options.lowercase) selectedCharsets.push(CHARSETS.lowercase)
  if (options.numbers) selectedCharsets.push(CHARSETS.numbers)
  if (options.symbols) selectedCharsets.push(CHARSETS.symbols)

  if (selectedCharsets.length === 0) {
    return err('NO_CHARSET', 'Select at least one character set')
  }

  const length = Math.max(1, options.length)
  const count = Math.max(1, Math.min(20, options.count))

  if (length < selectedCharsets.length) {
    return err('LENGTH_TOO_SHORT', 'Password length must be at least the number of selected character sets')
  }

  const fullCharset = selectedCharsets.join('')
  const passwords = Array.from({ length: count }, () =>
    generateSinglePassword(length, selectedCharsets, fullCharset),
  )

  return ok(passwords)
}
