import { ok } from '../lib/result'
import type { Result } from '../lib/result'

const HEX_ALPHABET = '0123456789ABCDEF'
const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const ALNUM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const SYMBOL_ALPHABET = '!@#$%^&*()-_=+[]{};:,.?'

const WORDS = [
  'amber', 'anchor', 'apple', 'atlas', 'autumn', 'bamboo', 'beacon', 'binary', 'blossom', 'brisk',
  'canyon', 'cipher', 'cloud', 'coast', 'comet', 'coral', 'crystal', 'dawn', 'delta', 'ember',
  'field', 'fjord', 'forest', 'galaxy', 'harbor', 'horizon', 'ice', 'indigo', 'jade', 'lagoon',
  'lantern', 'lattice', 'legacy', 'lilac', 'lunar', 'marble', 'matrix', 'meadow', 'meteor', 'mint',
  'nimbus', 'north', 'oasis', 'omega', 'opal', 'orbit', 'origin', 'pearl', 'pixel', 'plasma',
  'prairie', 'pulse', 'quartz', 'raven', 'river', 'rocket', 'saffron', 'saturn', 'shadow', 'signal',
  'silver', 'sky', 'spark', 'spruce', 'stone', 'storm', 'summer', 'sunset', 'swift', 'tangent',
  'thunder', 'topaz', 'tundra', 'ultra', 'valley', 'vapor', 'violet', 'willow', 'winter', 'zenith',
] as const

function randomUint32(count: number): Uint32Array {
  const values = new Uint32Array(count)
  crypto.getRandomValues(values)
  return values
}

export function randomString(length: number, alphabet: string): string {
  const size = Math.max(1, length)
  const randoms = randomUint32(size)
  let result = ''
  for (let i = 0; i < size; i++) {
    result += alphabet.charAt(randoms[i]! % alphabet.length)
  }
  return result
}

export function randomBytes(length: number): Uint8Array {
  const size = Math.max(1, length)
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function generateRandomStrings(length: number, count: number, alphabet: string): Result<string[]> {
  const normalizedLength = Math.max(1, length)
  const normalizedCount = Math.max(1, Math.min(50, count))
  return ok(Array.from({ length: normalizedCount }, () => randomString(normalizedLength, alphabet)))
}

export function generateRecoveryCodes(count: number, length: number, groupSize = 4): Result<string[]> {
  const normalizedCount = Math.max(1, Math.min(20, count))
  const normalizedLength = Math.max(6, Math.min(32, length))
  const normalizedGroupSize = Math.max(2, Math.min(8, groupSize))
  const codes = Array.from({ length: normalizedCount }, () => {
    const raw = randomString(normalizedLength, SAFE_ALPHABET)
    const groups: string[] = []
    for (let i = 0; i < raw.length; i += normalizedGroupSize) {
      groups.push(raw.slice(i, i + normalizedGroupSize))
    }
    return groups.join('-')
  })
  return ok(codes)
}

export function generatePassphrases(wordCount: number, count: number, separator = '-'): Result<string[]> {
  const normalizedWordCount = Math.max(2, Math.min(8, wordCount))
  const normalizedCount = Math.max(1, Math.min(20, count))
  const randoms = randomUint32(normalizedWordCount * normalizedCount)
  let ri = 0
  const phrases = Array.from({ length: normalizedCount }, () => {
    const words: string[] = []
    for (let i = 0; i < normalizedWordCount; i++) {
      words.push(WORDS[randoms[ri++]! % WORDS.length]!)
    }
    return words.join(separator)
  })
  return ok(phrases)
}

export { HEX_ALPHABET, BASE64URL_ALPHABET, ALNUM_ALPHABET, SAFE_ALPHABET, SYMBOL_ALPHABET, WORDS }
