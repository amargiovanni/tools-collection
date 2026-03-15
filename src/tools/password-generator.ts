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

function getRandomIndex(max: number): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0]! % max
}

function generateSinglePassword(length: number, selectedCharsets: string[], fullCharset: string): string {
  // Ensure at least one character from each selected charset
  const passwordChars = selectedCharsets.map(set => set.charAt(getRandomIndex(set.length)))

  // Fill remaining positions from the full charset
  while (passwordChars.length < length) {
    passwordChars.push(fullCharset.charAt(getRandomIndex(fullCharset.length)))
  }

  // Fisher-Yates shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1)
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
