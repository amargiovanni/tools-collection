import { describe, it, expect } from 'vitest'
import { parseJwt, getExpiryStatus } from '../../src/tools/jwt-decoder'

// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":9999999999}
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// Payload: {"sub":"test","iat":1000000000} — no exp claim
const JWT_NO_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxMDAwMDAwMDAwfQ' +
  '.signature'

describe('parseJwt', () => {
  it('parses a valid JWT and returns header, payload, signatureHex', () => {
    const result = parseJwt(VALID_JWT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(result.payload).toMatchObject({ sub: '1234567890', name: 'John Doe' })
    expect(typeof result.signatureHex).toBe('string')
    expect(result.signatureHex.length).toBeGreaterThan(0)
  })

  it('parses a JWT with no exp claim', () => {
    const result = parseJwt(JWT_NO_EXP)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.payload).toMatchObject({ sub: 'test' })
  })

  it('returns error for empty input', () => {
    expect(parseJwt('').ok).toBe(false)
    expect(parseJwt('   ').ok).toBe(false)
  })

  it('returns error for token with wrong number of parts', () => {
    expect(parseJwt('only.two').ok).toBe(false)
    expect(parseJwt('one').ok).toBe(false)
    expect(parseJwt('a.b.c.d').ok).toBe(false)
  })

  it('returns error for token with invalid base64 in header', () => {
    expect(parseJwt('!!!invalid!!!.payload.signature').ok).toBe(false)
  })

  it('returns error for token where header is not valid JSON', () => {
    const notJson = btoa('not json').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    expect(parseJwt(`${notJson}.${notJson}.sig`).ok).toBe(false)
  })
})

describe('getExpiryStatus', () => {
  it('returns "valid" with positive remainingMs when exp is in the future', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const status = getExpiryStatus({ exp: futureExp })
    expect(status.status).toBe('valid')
    if (status.status !== 'valid') return
    expect(status.remainingMs).toBeGreaterThan(0)
  })

  it('returns "expired" with positive elapsedMs when exp is in the past', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600
    const status = getExpiryStatus({ exp: pastExp })
    expect(status.status).toBe('expired')
    if (status.status !== 'expired') return
    expect(status.elapsedMs).toBeGreaterThan(0)
  })

  it('returns "none" when exp claim is absent', () => {
    expect(getExpiryStatus({ sub: 'test' }).status).toBe('none')
  })

  it('returns "none" when exp is not a number', () => {
    expect(getExpiryStatus({ exp: 'not-a-number' }).status).toBe('none')
    expect(getExpiryStatus({ exp: null }).status).toBe('none')
  })
})
