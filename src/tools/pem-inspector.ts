import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface CertInfo {
  readonly fingerprint: string
  readonly derHex: string
  readonly derSize: number
}

function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':')
}

export async function inspectPem(pem: string): Promise<Result<CertInfo>> {
  const trimmed = pem.trim()
  if (!trimmed) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  if (!trimmed.includes('-----BEGIN CERTIFICATE-----')) {
    return err('INVALID_PEM', 'Invalid certificate format. Please enter a PEM certificate.')
  }

  try {
    const der = pemToDer(trimmed)
    const hashBuffer = await crypto.subtle.digest('SHA-256', der)
    const hashArray = new Uint8Array(hashBuffer)
    const fingerprint = bytesToHex(hashArray)
    const derHex = bytesToHex(der.slice(0, 20))

    return ok({
      fingerprint,
      derHex: derHex + (der.length > 20 ? '...' : ''),
      derSize: der.length,
    })
  } catch {
    return err('INVALID_PEM', 'Certificate parsing error')
  }
}
