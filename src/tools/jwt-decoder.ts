export type JwtParseResult =
  | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown>; signatureHex: string }
  | { ok: false; error: string }

export type ExpiryStatus =
  | { status: 'valid'; remainingMs: number }
  | { status: 'expired'; elapsedMs: number }
  | { status: 'none' }

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
  return atob(base64)
}

function toHex(str: string): string {
  return Array.from(str, (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
}

export function parseJwt(token: string): JwtParseResult {
  if (!token || !token.trim()) {
    return { ok: false, error: 'Empty input' }
  }

  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { ok: false, error: 'Invalid JWT: expected 3 parts separated by dots' }
  }

  // After length check, parts[0..2] are guaranteed to exist
  const headerB64 = parts[0]!
  const payloadB64 = parts[1]!
  const signatureB64 = parts[2]!

  let header: Record<string, unknown>
  try {
    header = JSON.parse(base64urlDecode(headerB64))
  } catch {
    return { ok: false, error: 'Invalid JWT: could not decode header' }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(base64urlDecode(payloadB64))
  } catch {
    return { ok: false, error: 'Invalid JWT: could not decode payload' }
  }

  let signatureHex: string
  try {
    signatureHex = toHex(base64urlDecode(signatureB64))
  } catch {
    signatureHex = '(unable to decode signature)'
  }

  return { ok: true, header, payload, signatureHex }
}

export function getExpiryStatus(payload: Record<string, unknown>): ExpiryStatus {
  const exp = payload['exp']
  if (typeof exp !== 'number') return { status: 'none' }

  const nowMs = Date.now()
  const expMs = exp * 1000

  if (expMs > nowMs) {
    return { status: 'valid', remainingMs: expMs - nowMs }
  } else {
    return { status: 'expired', elapsedMs: nowMs - expMs }
  }
}
