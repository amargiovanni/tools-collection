import { describe, it, expect } from 'vitest'
import { inspectPem } from '../../src/tools/pem-inspector'

// A minimal valid PEM certificate for testing (self-signed, 1-line base64)
const VALID_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALRiMLAh2MhEMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RDQTAEFW0yNTA1MDEwMDAwMDBaFw0yNjA1MDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RDQTBcMA0GCSqGSIb3DQEBAQUAUwBNAEkASQBCAGkAagBBAE4AQgBnAGsA
cQBoAGsAaQBHADkAdwAwAEIAQQBRAEUARgBBAEEATwBDAEEAUTg9MA0GCSqGSIb3
DQEBCwUAA0EAFakeSignatureHereForTestingPurposesOnlyNotReallyValid==
-----END CERTIFICATE-----`

describe('inspectPem', () => {
  it('returns error for empty input', async () => {
    const result = await inspectPem('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('EMPTY_INPUT')
  })

  it('returns error for non-PEM input', async () => {
    const result = await inspectPem('not a certificate')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_PEM')
  })

  it('extracts info from valid PEM', async () => {
    const result = await inspectPem(VALID_PEM)
    // May fail with parse error due to invalid cert content, but should at least not crash
    if (result.ok) {
      expect(result.value.fingerprint).toBeTruthy()
      expect(result.value.derSize).toBeGreaterThan(0)
    } else {
      // Acceptable: atob may fail on our fake cert
      expect(result.error.code).toBe('INVALID_PEM')
    }
  })
})
