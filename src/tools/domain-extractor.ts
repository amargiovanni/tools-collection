import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

function normalizeDomain(hostname: string, includeSubdomains: boolean): string {
  if (includeSubdomains) return hostname
  const parts = hostname.split('.').filter(Boolean)
  return parts.length <= 2 ? hostname : parts.slice(-2).join('.')
}

export function extractDomains(input: string, includeSubdomains: boolean): Result<string[]> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  const lines = input.split('\n').map(line => line.trim()).filter(Boolean)
  const domains: string[] = []

  for (const line of lines) {
    try {
      const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(line) ? line : `https://${line}`
      const hostname = new URL(normalized).hostname
      if (hostname) {
        domains.push(normalizeDomain(hostname, includeSubdomains))
      }
    } catch {
      // Silently skip malformed lines
    }
  }

  return ok([...new Set(domains)])
}
