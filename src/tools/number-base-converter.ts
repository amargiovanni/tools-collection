export type BaseConversionResult = {
  decimal: string
  hex: string
  binary: string
  octal: string
}

const VALID_PATTERNS: Record<number, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
}

export function convertBase(value: string, fromBase: 2 | 8 | 10 | 16): BaseConversionResult | null {
  if (!value || !value.trim()) return null

  const trimmed = value.trim()
  const isNegative = trimmed.startsWith('-')
  const absValue = isNegative ? trimmed.slice(1) : trimmed

  if (!absValue) return null

  const pattern = VALID_PATTERNS[fromBase]
  if (!pattern || !pattern.test(absValue)) return null

  // Use BigInt for arbitrary precision — no loss beyond Number.MAX_SAFE_INTEGER
  const bigBase = BigInt(fromBase)
  let n = 0n
  for (const char of absValue.toLowerCase()) {
    const digit = BigInt(parseInt(char, fromBase))
    n = n * bigBase + digit
  }

  const sign = isNegative ? '-' : ''
  return {
    decimal: sign + n.toString(10),
    hex: sign + n.toString(16),
    binary: sign + n.toString(2),
    octal: sign + n.toString(8),
  }
}
