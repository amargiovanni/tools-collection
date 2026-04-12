import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export interface StrengthCheck {
  name: string
  passed: boolean
}

export interface StrengthResult {
  score: number
  level: 'weak' | 'medium' | 'strong'
  checks: StrengthCheck[]
  suggestions: string[]
}

export function checkPasswordStrength(password: string): Result<StrengthResult> {
  const validated = validateNonEmpty(password)
  if (!validated.ok) return validated

  let score = 0

  const hasLength8 = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[^A-Za-z0-9]/.test(password)
  const hasLength12 = password.length >= 12
  const hasLength16 = password.length >= 16

  // Calculate score
  if (hasLength8) score += 2
  if (hasLength12) score += 1
  if (hasUppercase) score += 1
  if (hasLowercase) score += 1
  if (hasNumbers) score += 1
  if (hasSymbols) score += 2
  if (hasLength16) score += 1

  // Penalties for repeated characters
  if (/(.)\1{3,}/.test(password)) {
    score -= 2
  } else if (/(.)\1{2,}/.test(password)) {
    score -= 1
  }

  // Clamp to [0, 8]
  score = Math.min(8, Math.max(0, score))

  const level: StrengthResult['level'] =
    score <= 3 ? 'weak' : score <= 5 ? 'medium' : 'strong'

  const checks: StrengthCheck[] = [
    { name: 'length', passed: hasLength8 },
    { name: 'uppercase', passed: hasUppercase },
    { name: 'lowercase', passed: hasLowercase },
    { name: 'numbers', passed: hasNumbers },
    { name: 'symbols', passed: hasSymbols },
  ]

  const suggestions: string[] = []
  if (!hasLength8) suggestions.push('Use at least 8 characters')
  if (!hasUppercase) suggestions.push('Add uppercase letters')
  if (!hasLowercase) suggestions.push('Add lowercase letters')
  if (!hasNumbers) suggestions.push('Add numbers')
  if (!hasSymbols) suggestions.push('Add special symbols')
  if (!hasLength12) suggestions.push('Consider using at least 12 characters')

  return ok({ score, level, checks, suggestions })
}
