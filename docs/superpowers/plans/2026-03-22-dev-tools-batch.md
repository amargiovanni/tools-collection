# Dev Tools Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three developer tools — JWT Decoder, UUID/ULID Generator, Number Base Converter — each following the established codebase pattern.

**Architecture:** Each tool consists of a pure-logic `.ts` file (testable without DOM) and a Solid.js `.tsx` component. Tools are registered in `src/config/tools.ts` and `src/config/tool-components.ts`. i18n keys are added to all 5 locale files simultaneously (compile-time check enforces parity).

**Tech Stack:** Astro + Solid.js, Vitest (unit tests), Playwright (e2e). Zero new npm dependencies — all implementations use native browser/Node.js APIs (`crypto`, `atob`, `BigInt`).

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `src/tools/jwt-decoder.ts` | JWT parse logic + expiry check |
| `src/components/tools/JwtDecoder.tsx` | Solid.js component |
| `tests/tools/jwt-decoder.test.ts` | Unit tests |
| `src/tools/uuid-generator.ts` | UUID v4/v7 + ULID generation |
| `src/components/tools/UuidGenerator.tsx` | Solid.js component |
| `tests/tools/uuid-generator.test.ts` | Unit tests |
| `src/tools/number-base-converter.ts` | Base conversion logic |
| `src/components/tools/NumberBaseConverter.tsx` | Solid.js component |
| `tests/tools/number-base-converter.test.ts` | Unit tests |

### Modified files
| File | Change |
|------|--------|
| `src/config/tools.ts` | Add 3 entries to `toolRegistry` |
| `src/config/tool-components.ts` | Add 3 lazy imports |
| `src/i18n/messages/en.json` | Add i18n keys |
| `src/i18n/messages/it.json` | Add i18n keys |
| `src/i18n/messages/es.json` | Add i18n keys |
| `src/i18n/messages/fr.json` | Add i18n keys |
| `src/i18n/messages/de.json` | Add i18n keys |

---

## Task 1: JWT Decoder — Logic

**Files:**
- Create: `src/tools/jwt-decoder.ts`
- Create: `tests/tools/jwt-decoder.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `tests/tools/jwt-decoder.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { parseJwt, getExpiryStatus } from '../../src/tools/jwt-decoder'

// A real JWT (header.payload.signature, all base64url-encoded)
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

  it('returns error for empty input', () => {
    const result = parseJwt('')
    expect(result.ok).toBe(false)
  })

  it('returns error for token with wrong number of parts', () => {
    const result = parseJwt('only.two')
    expect(result.ok).toBe(false)
  })

  it('returns error for token with invalid base64 in header', () => {
    const result = parseJwt('!!!invalid!!!.payload.signature')
    expect(result.ok).toBe(false)
  })

  it('returns error for token where header is not valid JSON', () => {
    // base64url encode "not json"
    const notJson = btoa('not json').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const result = parseJwt(`${notJson}.${notJson}.sig`)
    expect(result.ok).toBe(false)
  })
})

describe('getExpiryStatus', () => {
  it('returns "valid" with positive remainingMs when exp is in the future', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const status = getExpiryStatus({ exp: futureExp })
    expect(status.status).toBe('valid')
    if (status.status !== 'valid') return
    expect(status.remainingMs).toBeGreaterThan(0)
  })

  it('returns "expired" with positive elapsedMs when exp is in the past', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    const status = getExpiryStatus({ exp: pastExp })
    expect(status.status).toBe('expired')
    if (status.status !== 'expired') return
    expect(status.elapsedMs).toBeGreaterThan(0)
  })

  it('returns "none" when exp claim is absent', () => {
    const status = getExpiryStatus({ sub: 'test' })
    expect(status.status).toBe('none')
  })

  it('returns "none" when exp is not a number', () => {
    const status = getExpiryStatus({ exp: 'not-a-number' })
    expect(status.status).toBe('none')
  })
})
```

- [ ] **Step 1.2: Run tests — verify they fail**

```bash
npx vitest run tests/tools/jwt-decoder.test.ts
```
Expected: FAIL — `Cannot find module '../../src/tools/jwt-decoder'`

- [ ] **Step 1.3: Implement `src/tools/jwt-decoder.ts`**

```ts
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

  const [headerB64, payloadB64, signatureB64] = parts

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
```

- [ ] **Step 1.4: Run tests — verify they pass**

```bash
npx vitest run tests/tools/jwt-decoder.test.ts
```
Expected: all tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add src/tools/jwt-decoder.ts tests/tools/jwt-decoder.test.ts
git commit -m "feat(jwt-decoder): add pure parse/expiry logic with tests"
```

---

## Task 2: JWT Decoder — i18n + Registration + Component

**Files:**
- Modify: `src/i18n/messages/en.json` (+ it, es, fr, de)
- Modify: `src/config/tools.ts`
- Modify: `src/config/tool-components.ts`
- Create: `src/components/tools/JwtDecoder.tsx`

- [ ] **Step 2.1: Add i18n keys to all 5 locale files**

In `src/i18n/messages/en.json`, add at the end (before the closing `}`):
```json
  "tools_jwtDecoder_name": "JWT Decoder",
  "tools_jwtDecoder_description": "Decode and inspect JSON Web Tokens",
  "jwt_header": "Header",
  "jwt_payload": "Payload",
  "jwt_signature": "Signature",
  "jwt_notVerified": "not verified — client-side only",
  "jwt_valid": "VALID",
  "jwt_expired": "EXPIRED",
  "jwt_expiresIn": "expires in {time}",
  "jwt_expiredAgo": "expired {time} ago",
  "jwt_placeholder": "Paste your JWT here...",
  "jwt_errorFormat": "Invalid JWT: expected 3 parts separated by dots",
  "jwt_errorDecode": "Could not decode header or payload"
```

In `src/i18n/messages/it.json`, add same keys with Italian values:
```json
  "tools_jwtDecoder_name": "JWT Decoder",
  "tools_jwtDecoder_description": "Decodifica e ispeziona JSON Web Token",
  "jwt_header": "Header",
  "jwt_payload": "Payload",
  "jwt_signature": "Firma",
  "jwt_notVerified": "non verificata — solo lato client",
  "jwt_valid": "VALIDO",
  "jwt_expired": "SCADUTO",
  "jwt_expiresIn": "scade tra {time}",
  "jwt_expiredAgo": "scaduto {time} fa",
  "jwt_placeholder": "Incolla il tuo JWT qui...",
  "jwt_errorFormat": "JWT non valido: attesi 3 parti separate da punti",
  "jwt_errorDecode": "Impossibile decodificare header o payload"
```

In `src/i18n/messages/es.json`:
```json
  "tools_jwtDecoder_name": "Decodificador JWT",
  "tools_jwtDecoder_description": "Decodifica e inspecciona JSON Web Tokens",
  "jwt_header": "Cabecera",
  "jwt_payload": "Carga útil",
  "jwt_signature": "Firma",
  "jwt_notVerified": "no verificada — solo lado cliente",
  "jwt_valid": "VÁLIDO",
  "jwt_expired": "EXPIRADO",
  "jwt_expiresIn": "expira en {time}",
  "jwt_expiredAgo": "expirado hace {time}",
  "jwt_placeholder": "Pega tu JWT aquí...",
  "jwt_errorFormat": "JWT inválido: se esperan 3 partes separadas por puntos",
  "jwt_errorDecode": "No se pudo decodificar el encabezado o la carga útil"
```

In `src/i18n/messages/fr.json`:
```json
  "tools_jwtDecoder_name": "Décodeur JWT",
  "tools_jwtDecoder_description": "Décodez et inspectez les JSON Web Tokens",
  "jwt_header": "En-tête",
  "jwt_payload": "Charge utile",
  "jwt_signature": "Signature",
  "jwt_notVerified": "non vérifiée — côté client uniquement",
  "jwt_valid": "VALIDE",
  "jwt_expired": "EXPIRÉ",
  "jwt_expiresIn": "expire dans {time}",
  "jwt_expiredAgo": "expiré il y a {time}",
  "jwt_placeholder": "Collez votre JWT ici...",
  "jwt_errorFormat": "JWT invalide : 3 parties séparées par des points attendues",
  "jwt_errorDecode": "Impossible de décoder l'en-tête ou la charge utile"
```

In `src/i18n/messages/de.json`:
```json
  "tools_jwtDecoder_name": "JWT-Decoder",
  "tools_jwtDecoder_description": "JSON Web Tokens dekodieren und prüfen",
  "jwt_header": "Header",
  "jwt_payload": "Nutzdaten",
  "jwt_signature": "Signatur",
  "jwt_notVerified": "nicht verifiziert — nur clientseitig",
  "jwt_valid": "GÜLTIG",
  "jwt_expired": "ABGELAUFEN",
  "jwt_expiresIn": "läuft ab in {time}",
  "jwt_expiredAgo": "abgelaufen vor {time}",
  "jwt_placeholder": "JWT hier einfügen...",
  "jwt_errorFormat": "Ungültiges JWT: 3 durch Punkte getrennte Teile erwartet",
  "jwt_errorDecode": "Header oder Nutzdaten konnten nicht dekodiert werden"
```

> **Important:** The compile-time check in `src/i18n/index.ts` requires all 5 locale files to have **identical keys**. Run `npx tsc --noEmit` after this step to verify.

- [ ] **Step 2.2: Register in tools.ts**

In `src/config/tools.ts`, inside the `// Development` section, add after the `cron-expression` entry:
```ts
  {
    id: 'jwt-decoder',
    category: 'development',
    icon: '🔑',
    keywords: ['jwt', 'json', 'web', 'token', 'decode', 'inspect', 'auth', 'bearer'],
    path: '/tools/jwt-decoder',
  },
```

- [ ] **Step 2.3: Register in tool-components.ts**

Add in alphabetical order among the development tools:
```ts
  'jwt-decoder': lazy(() => import('../components/tools/JwtDecoder')),
```

- [ ] **Step 2.4: Create `src/components/tools/JwtDecoder.tsx`**

```tsx
import { createSignal, Show } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { parseJwt, getExpiryStatus } from '../../tools/jwt-decoder'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  if (totalSecs < 60) return `${totalSecs}s`
  const mins = Math.floor(totalSecs / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export default function JwtDecoder(props: Props) {
  const [input, setInput] = createSignal('')

  const parsed = () => {
    const val = input().trim()
    if (!val) return null
    return parseJwt(val)
  }

  const expiry = () => {
    const p = parsed()
    if (!p || !p.ok) return null
    return getExpiryStatus(p.payload)
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label="JWT"
        placeholder={t(props.lang, 'jwt_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        rows={4}
      />

      <Show when={input().trim() && parsed()?.ok === false}>
        <StatusMessage type="error" message={(parsed() as { ok: false; error: string })?.error ?? ''} />
      </Show>

      <Show when={parsed()?.ok === true}>
        {(() => {
          const p = parsed()
          if (!p || !p.ok) return null
          const exp = expiry()

          return (
            <div class="flex flex-col gap-3">
              {/* Expiry badge */}
              <Show when={exp && exp.status !== 'none'}>
                {(() => {
                  if (!exp || exp.status === 'none') return null
                  const isValid = exp.status === 'valid'
                  const timeStr = formatDuration(isValid ? exp.remainingMs : exp.elapsedMs)
                  const label = isValid
                    ? t(props.lang, 'jwt_expiresIn').replace('{time}', timeStr)
                    : t(props.lang, 'jwt_expiredAgo').replace('{time}', timeStr)
                  return (
                    <div
                      class={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                        isValid
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span>{isValid ? '●' : '●'}</span>
                      <span>{isValid ? t(props.lang, 'jwt_valid') : t(props.lang, 'jwt_expired')}</span>
                      <span class="font-normal opacity-80">·</span>
                      <span class="font-normal">{label}</span>
                    </div>
                  )
                })()}
              </Show>

              {/* Header */}
              <ResultCard
                label={t(props.lang, 'jwt_header')}
                value={JSON.stringify(p.header, null, 2)}
              />

              {/* Payload */}
              <ResultCard
                label={t(props.lang, 'jwt_payload')}
                value={JSON.stringify(p.payload, null, 2)}
              />

              {/* Signature */}
              <div class="flex flex-col gap-1">
                <ResultCard
                  label={t(props.lang, 'jwt_signature')}
                  value={p.signatureHex}
                />
                <p class="text-xs text-text-muted px-1">{t(props.lang, 'jwt_notVerified')}</p>
              </div>
            </div>
          )
        })()}
      </Show>
    </div>
  )
}
```

- [ ] **Step 2.5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 2.6: Run all unit tests**

```bash
npx vitest run
```
Expected: all tests pass (including the new jwt-decoder tests)

- [ ] **Step 2.7: Commit**

```bash
git add src/tools/jwt-decoder.ts src/components/tools/JwtDecoder.tsx \
        src/config/tools.ts src/config/tool-components.ts \
        src/i18n/messages/
git commit -m "feat(jwt-decoder): add JWT decoder tool with expiry highlighting"
```

---

## Task 3: UUID/ULID Generator — Logic

**Files:**
- Create: `src/tools/uuid-generator.ts`
- Create: `tests/tools/uuid-generator.test.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `tests/tools/uuid-generator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateUUIDv4, generateUUIDv7, generateULID } from '../../src/tools/uuid-generator'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const CROCKFORD_BASE32_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/

describe('generateUUIDv4', () => {
  it('returns a valid UUID v4 string', () => {
    expect(generateUUIDv4()).toMatch(UUID_V4_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateUUIDv4()))
    expect(results.size).toBe(100)
  })
})

describe('generateUUIDv7', () => {
  it('returns a valid UUID v7 string', () => {
    expect(generateUUIDv7()).toMatch(UUID_V7_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateUUIDv7()))
    expect(results.size).toBe(100)
  })

  it('encodes current timestamp in the first 48 bits', () => {
    const before = Date.now()
    const uuid = generateUUIDv7()
    const after = Date.now()

    // Extract timestamp from UUID v7: first 12 hex chars = 48 bits
    const tsHex = uuid.replace(/-/g, '').slice(0, 12)
    const ts = parseInt(tsHex, 16)

    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 1) // +1ms tolerance
  })

  it('two calls in same millisecond produce ordered results (monotonicity)', () => {
    // Force same-ms scenario by mocking Date.now
    let call = 0
    const origNow = Date.now
    Date.now = () => { call++; return 1700000000000 } // fixed ms
    try {
      const a = generateUUIDv7()
      const b = generateUUIDv7()
      // UUID v7 lexicographic order must hold when timestamps are equal
      expect(b > a).toBe(true)
    } finally {
      Date.now = origNow
    }
  })
})

describe('generateULID', () => {
  it('returns a 26-character Crockford Base32 string', () => {
    expect(generateULID()).toMatch(CROCKFORD_BASE32_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateULID()))
    expect(results.size).toBe(100)
  })

  it('ULIDs generated within the same ms are lexicographically ordered', () => {
    const origNow = Date.now
    Date.now = () => 1700000000000
    try {
      const ulids = Array.from({ length: 10 }, () => generateULID())
      const sorted = [...ulids].sort()
      expect(ulids).toEqual(sorted)
    } finally {
      Date.now = origNow
    }
  })
})
```

- [ ] **Step 3.2: Run tests — verify they fail**

```bash
npx vitest run tests/tools/uuid-generator.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3.3: Implement `src/tools/uuid-generator.ts`**

```ts
// UUID v4 — delegate to native crypto
export function generateUUIDv4(): string {
  return crypto.randomUUID()
}

// UUID v7 — RFC 9562
// Layout: 48-bit unix_ts_ms | 4-bit ver=7 | 12-bit rand_a | 2-bit var=10 | 62-bit rand_b
let _lastMs = 0
let _lastRandA = 0

export function generateUUIDv7(): string {
  const ms = Date.now()
  const rand = crypto.getRandomValues(new Uint8Array(10))

  let randA = ((rand[0] & 0x0f) << 8) | rand[1]
  if (ms === _lastMs) {
    randA = (_lastRandA + 1) & 0x0fff
  }
  _lastMs = ms
  _lastRandA = randA

  const tsHex = ms.toString(16).padStart(12, '0')
  const randAHex = (0x7000 | randA).toString(16).padStart(4, '0')
  const varByte = (rand[2] & 0x3f) | 0x80
  const randBBytes = [varByte, rand[3], rand[4], rand[5], rand[6], rand[7], rand[8], rand[9]]
  const randBHex = randBBytes.map((b) => b.toString(16).padStart(2, '0')).join('')

  return `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-${randAHex}-${randBHex.slice(0, 4)}-${randBHex.slice(4)}`
}

// ULID — https://github.com/ulid/spec
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function encodeBase32(value: bigint, chars: number): string {
  let result = ''
  for (let i = 0; i < chars; i++) {
    result = CROCKFORD[Number(value & 31n)] + result
    value >>= 5n
  }
  return result
}

let _lastUlidMs = 0
let _lastUlidRand = 0n

export function generateULID(): string {
  const ms = Date.now()
  let rand: bigint

  if (ms === _lastUlidMs) {
    rand = _lastUlidRand + 1n
  } else {
    const bytes = crypto.getRandomValues(new Uint8Array(10))
    rand = bytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n)
  }

  _lastUlidMs = ms
  _lastUlidRand = rand

  return encodeBase32(BigInt(ms), 10) + encodeBase32(rand, 16)
}
```

- [ ] **Step 3.4: Run tests — verify they pass**

```bash
npx vitest run tests/tools/uuid-generator.test.ts
```
Expected: all tests PASS

- [ ] **Step 3.5: Commit**

```bash
git add src/tools/uuid-generator.ts tests/tools/uuid-generator.test.ts
git commit -m "feat(uuid-generator): add UUID v4/v7 and ULID generation logic with tests"
```

---

## Task 4: UUID/ULID Generator — i18n + Registration + Component

**Files:**
- Modify: all 5 `src/i18n/messages/*.json`
- Modify: `src/config/tools.ts`
- Modify: `src/config/tool-components.ts`
- Create: `src/components/tools/UuidGenerator.tsx`

- [ ] **Step 4.1: Add i18n keys to all 5 locale files**

Add to `en.json`:
```json
  "tools_uuidGenerator_name": "UUID / ULID Generator",
  "tools_uuidGenerator_description": "Generate UUID v4, UUID v7, and ULID identifiers",
  "uuid_v4Label": "UUID v4",
  "uuid_v7Label": "UUID v7",
  "uuid_ulidLabel": "ULID",
  "uuid_generate": "Generate",
  "uuid_generateTen": "Generate 10",
  "uuid_copyAll": "Copy all",
  "uuid_v4Description": "Random, RFC 4122 compliant",
  "uuid_v7Description": "Time-ordered, RFC 9562 compliant",
  "uuid_ulidDescription": "Lexicographically sortable, Crockford Base32"
```

Add to `it.json`:
```json
  "tools_uuidGenerator_name": "Generatore UUID / ULID",
  "tools_uuidGenerator_description": "Genera identificatori UUID v4, UUID v7 e ULID",
  "uuid_v4Label": "UUID v4",
  "uuid_v7Label": "UUID v7",
  "uuid_ulidLabel": "ULID",
  "uuid_generate": "Genera",
  "uuid_generateTen": "Genera 10",
  "uuid_copyAll": "Copia tutti",
  "uuid_v4Description": "Casuale, conforme RFC 4122",
  "uuid_v7Description": "Ordinato per tempo, conforme RFC 9562",
  "uuid_ulidDescription": "Ordinabile lessicograficamente, Crockford Base32"
```

Add to `es.json`:
```json
  "tools_uuidGenerator_name": "Generador UUID / ULID",
  "tools_uuidGenerator_description": "Genera identificadores UUID v4, UUID v7 y ULID",
  "uuid_v4Label": "UUID v4",
  "uuid_v7Label": "UUID v7",
  "uuid_ulidLabel": "ULID",
  "uuid_generate": "Generar",
  "uuid_generateTen": "Generar 10",
  "uuid_copyAll": "Copiar todo",
  "uuid_v4Description": "Aleatorio, compatible con RFC 4122",
  "uuid_v7Description": "Ordenado por tiempo, compatible con RFC 9562",
  "uuid_ulidDescription": "Ordenable lexicográficamente, Crockford Base32"
```

Add to `fr.json`:
```json
  "tools_uuidGenerator_name": "Générateur UUID / ULID",
  "tools_uuidGenerator_description": "Génère des identifiants UUID v4, UUID v7 et ULID",
  "uuid_v4Label": "UUID v4",
  "uuid_v7Label": "UUID v7",
  "uuid_ulidLabel": "ULID",
  "uuid_generate": "Générer",
  "uuid_generateTen": "Générer 10",
  "uuid_copyAll": "Tout copier",
  "uuid_v4Description": "Aléatoire, conforme RFC 4122",
  "uuid_v7Description": "Ordonné par temps, conforme RFC 9562",
  "uuid_ulidDescription": "Triable lexicographiquement, Crockford Base32"
```

Add to `de.json`:
```json
  "tools_uuidGenerator_name": "UUID- / ULID-Generator",
  "tools_uuidGenerator_description": "UUID v4-, UUID v7- und ULID-Bezeichner generieren",
  "uuid_v4Label": "UUID v4",
  "uuid_v7Label": "UUID v7",
  "uuid_ulidLabel": "ULID",
  "uuid_generate": "Generieren",
  "uuid_generateTen": "10 generieren",
  "uuid_copyAll": "Alle kopieren",
  "uuid_v4Description": "Zufällig, RFC 4122-konform",
  "uuid_v7Description": "Zeitgeordnet, RFC 9562-konform",
  "uuid_ulidDescription": "Lexikografisch sortierbar, Crockford Base32"
```

- [ ] **Step 4.2: Register in tools.ts**

In the `// Generators` section, add after the `pin-generator` entry:
```ts
  {
    id: 'uuid-generator',
    category: 'generators',
    icon: '🆔',
    keywords: ['uuid', 'ulid', 'guid', 'generate', 'random', 'unique', 'identifier', 'v4', 'v7'],
    path: '/tools/uuid-generator',
  },
```

- [ ] **Step 4.3: Register in tool-components.ts**

```ts
  'uuid-generator': lazy(() => import('../components/tools/UuidGenerator')),
```

- [ ] **Step 4.4: Create `src/components/tools/UuidGenerator.tsx`**

```tsx
import { createSignal, Show, For } from 'solid-js'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { ResultCard } from '../ui/ResultCard'
import { generateUUIDv4, generateUUIDv7, generateULID } from '../../tools/uuid-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type GeneratorType = 'v4' | 'v7' | 'ulid'

function useGenerator(genFn: () => string, lang: Language, labelKey: 'uuid_v4Label' | 'uuid_v7Label' | 'uuid_ulidLabel', descKey: 'uuid_v4Description' | 'uuid_v7Description' | 'uuid_ulidDescription') {
  const [value, setValue] = createSignal(genFn())
  const [batch, setBatch] = createSignal<string[]>([])

  const generate = () => setValue(genFn())
  const generateTen = () => setBatch(Array.from({ length: 10 }, () => genFn()))

  return { value, batch, generate, generateTen, labelKey, descKey }
}

export default function UuidGenerator(props: Props) {
  const [v4, setV4] = createSignal(generateUUIDv4())
  const [v7, setV7] = createSignal(generateUUIDv7())
  const [ulid, setUlid] = createSignal(generateULID())
  const [v4Batch, setV4Batch] = createSignal<string[]>([])
  const [v7Batch, setV7Batch] = createSignal<string[]>([])
  const [ulidBatch, setUlidBatch] = createSignal<string[]>([])

  const sections: Array<{
    label: () => string
    desc: () => string
    value: () => string
    batch: () => string[]
    generate: () => void
    generateTen: () => void
  }> = [
    {
      label: () => t(props.lang, 'uuid_v4Label'),
      desc: () => t(props.lang, 'uuid_v4Description'),
      value: v4,
      batch: v4Batch,
      generate: () => setV4(generateUUIDv4()),
      generateTen: () => setV4Batch(Array.from({ length: 10 }, () => generateUUIDv4())),
    },
    {
      label: () => t(props.lang, 'uuid_v7Label'),
      desc: () => t(props.lang, 'uuid_v7Description'),
      value: v7,
      batch: v7Batch,
      generate: () => setV7(generateUUIDv7()),
      generateTen: () => setV7Batch(Array.from({ length: 10 }, () => generateUUIDv7())),
    },
    {
      label: () => t(props.lang, 'uuid_ulidLabel'),
      desc: () => t(props.lang, 'uuid_ulidDescription'),
      value: ulid,
      batch: ulidBatch,
      generate: () => setUlid(generateULID()),
      generateTen: () => setUlidBatch(Array.from({ length: 10 }, () => generateULID())),
    },
  ]

  return (
    <div class="flex flex-col gap-6">
      <For each={sections}>
        {(section) => (
          <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
            <div>
              <h2 class="text-sm font-semibold text-text-primary">{section.label()}</h2>
              <p class="text-xs text-text-muted mt-0.5">{section.desc()}</p>
            </div>

            <div class="flex items-center gap-2">
              <code class="flex-1 rounded-lg bg-surface px-3 py-2 font-mono text-sm text-text-primary break-all">
                {section.value()}
              </code>
              <CopyButton getValue={section.value} />
            </div>

            <div class="flex gap-2">
              <Button variant="primary" size="sm" onClick={section.generate}>
                {t(props.lang, 'uuid_generate')}
              </Button>
              <Button variant="secondary" size="sm" onClick={section.generateTen}>
                {t(props.lang, 'uuid_generateTen')}
              </Button>
            </div>

            <Show when={section.batch().length > 0}>
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-text-muted">{section.batch().length} values</span>
                  <CopyButton getValue={() => section.batch().join('\n')} label={t(props.lang, 'uuid_copyAll')} />
                </div>
                <div class="rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text-secondary space-y-1">
                  <For each={section.batch()}>
                    {(item) => <div class="break-all">{item}</div>}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}
```

- [ ] **Step 4.5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4.6: Run all unit tests**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 4.7: Commit**

```bash
git add src/tools/uuid-generator.ts src/components/tools/UuidGenerator.tsx \
        src/config/tools.ts src/config/tool-components.ts \
        src/i18n/messages/
git commit -m "feat(uuid-generator): add UUID v4/v7 and ULID generator tool"
```

---

## Task 5: Number Base Converter — Logic

**Files:**
- Create: `src/tools/number-base-converter.ts`
- Create: `tests/tools/number-base-converter.test.ts`

- [ ] **Step 5.1: Write the failing tests**

Create `tests/tools/number-base-converter.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { convertBase } from '../../src/tools/number-base-converter'

describe('convertBase', () => {
  it('converts 255 decimal to all bases', () => {
    expect(convertBase('255', 10)).toEqual({
      decimal: '255',
      hex: 'ff',
      binary: '11111111',
      octal: '377',
    })
  })

  it('converts ff hex to all bases', () => {
    expect(convertBase('ff', 16)).toEqual({
      decimal: '255',
      hex: 'ff',
      binary: '11111111',
      octal: '377',
    })
  })

  it('converts 11111111 binary to all bases', () => {
    expect(convertBase('11111111', 2)).toEqual({
      decimal: '255',
      hex: 'ff',
      binary: '11111111',
      octal: '377',
    })
  })

  it('converts 377 octal to all bases', () => {
    expect(convertBase('377', 8)).toEqual({
      decimal: '255',
      hex: 'ff',
      binary: '11111111',
      octal: '377',
    })
  })

  it('handles negative decimal correctly', () => {
    expect(convertBase('-10', 10)).toEqual({
      decimal: '-10',
      hex: '-a',
      binary: '-1010',
      octal: '-12',
    })
  })

  it('handles zero', () => {
    expect(convertBase('0', 10)).toEqual({
      decimal: '0',
      hex: '0',
      binary: '0',
      octal: '0',
    })
  })

  it('handles large number beyond Number.MAX_SAFE_INTEGER', () => {
    const result = convertBase('9007199254740993', 10) // 2^53 + 1
    expect(result).not.toBeNull()
    expect(result?.decimal).toBe('9007199254740993')
  })

  it('returns null for empty input', () => {
    expect(convertBase('', 10)).toBeNull()
  })

  it('returns null for invalid digit in binary (digit 2)', () => {
    expect(convertBase('2', 2)).toBeNull()
  })

  it('returns null for invalid digit in hex (letter g)', () => {
    expect(convertBase('g', 16)).toBeNull()
  })

  it('returns null for invalid digit in octal (digit 8)', () => {
    expect(convertBase('8', 8)).toBeNull()
  })

  it('accepts uppercase hex digits', () => {
    expect(convertBase('FF', 16)).toEqual({
      decimal: '255',
      hex: 'ff',
      binary: '11111111',
      octal: '377',
    })
  })
})
```

- [ ] **Step 5.2: Run tests — verify they fail**

```bash
npx vitest run tests/tools/number-base-converter.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 5.3: Implement `src/tools/number-base-converter.ts`**

```ts
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
  if (!VALID_PATTERNS[fromBase].test(absValue)) return null

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
```

- [ ] **Step 5.4: Run tests — verify they pass**

```bash
npx vitest run tests/tools/number-base-converter.test.ts
```
Expected: all tests PASS

- [ ] **Step 5.5: Commit**

```bash
git add src/tools/number-base-converter.ts tests/tools/number-base-converter.test.ts
git commit -m "feat(number-base-converter): add base conversion logic with tests"
```

---

## Task 6: Number Base Converter — i18n + Registration + Component

**Files:**
- Modify: all 5 `src/i18n/messages/*.json`
- Modify: `src/config/tools.ts`
- Modify: `src/config/tool-components.ts`
- Create: `src/components/tools/NumberBaseConverter.tsx`

- [ ] **Step 6.1: Add i18n keys to all 5 locale files**

Add to `en.json`:
```json
  "tools_numberBaseConverter_name": "Number Base Converter",
  "tools_numberBaseConverter_description": "Convert numbers between decimal, hex, binary, and octal",
  "base_decimal": "Decimal",
  "base_hex": "Hexadecimal",
  "base_binary": "Binary",
  "base_octal": "Octal",
  "base_decimalHint": "e.g. 255",
  "base_hexHint": "e.g. ff",
  "base_binaryHint": "e.g. 11111111",
  "base_octalHint": "e.g. 377"
```

Add to `it.json`:
```json
  "tools_numberBaseConverter_name": "Convertitore di Basi Numeriche",
  "tools_numberBaseConverter_description": "Converti numeri tra decimale, esadecimale, binario e ottale",
  "base_decimal": "Decimale",
  "base_hex": "Esadecimale",
  "base_binary": "Binario",
  "base_octal": "Ottale",
  "base_decimalHint": "es. 255",
  "base_hexHint": "es. ff",
  "base_binaryHint": "es. 11111111",
  "base_octalHint": "es. 377"
```

Add to `es.json`:
```json
  "tools_numberBaseConverter_name": "Convertidor de Bases Numéricas",
  "tools_numberBaseConverter_description": "Convierte números entre decimal, hexadecimal, binario y octal",
  "base_decimal": "Decimal",
  "base_hex": "Hexadecimal",
  "base_binary": "Binario",
  "base_octal": "Octal",
  "base_decimalHint": "ej. 255",
  "base_hexHint": "ej. ff",
  "base_binaryHint": "ej. 11111111",
  "base_octalHint": "ej. 377"
```

Add to `fr.json`:
```json
  "tools_numberBaseConverter_name": "Convertisseur de Bases Numériques",
  "tools_numberBaseConverter_description": "Convertit les nombres entre décimal, hexadécimal, binaire et octal",
  "base_decimal": "Décimal",
  "base_hex": "Hexadécimal",
  "base_binary": "Binaire",
  "base_octal": "Octal",
  "base_decimalHint": "ex. 255",
  "base_hexHint": "ex. ff",
  "base_binaryHint": "ex. 11111111",
  "base_octalHint": "ex. 377"
```

Add to `de.json`:
```json
  "tools_numberBaseConverter_name": "Zahlenbasis-Konverter",
  "tools_numberBaseConverter_description": "Zahlen zwischen Dezimal, Hexadezimal, Binär und Oktal umrechnen",
  "base_decimal": "Dezimal",
  "base_hex": "Hexadezimal",
  "base_binary": "Binär",
  "base_octal": "Oktal",
  "base_decimalHint": "z.B. 255",
  "base_hexHint": "z.B. ff",
  "base_binaryHint": "z.B. 11111111",
  "base_octalHint": "z.B. 377"
```

- [ ] **Step 6.2: Register in tools.ts**

In the `// Converters` section, add after the `data-size-converter` entry:
```ts
  {
    id: 'number-base-converter',
    category: 'converters',
    icon: '🔢',
    keywords: ['number', 'base', 'decimal', 'hex', 'hexadecimal', 'binary', 'octal', 'convert'],
    path: '/tools/number-base-converter',
  },
```

- [ ] **Step 6.3: Register in tool-components.ts**

```ts
  'number-base-converter': lazy(() => import('../components/tools/NumberBaseConverter')),
```

- [ ] **Step 6.4: Create `src/components/tools/NumberBaseConverter.tsx`**

```tsx
import { createSignal, createEffect } from 'solid-js'
import { convertBase } from '../../tools/number-base-converter'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type Base = 2 | 8 | 10 | 16

interface FieldConfig {
  base: Base
  labelKey: 'base_decimal' | 'base_hex' | 'base_binary' | 'base_octal'
  hintKey: 'base_decimalHint' | 'base_hexHint' | 'base_binaryHint' | 'base_octalHint'
  signal: () => string
  setSignal: (v: string) => void
}

export default function NumberBaseConverter(props: Props) {
  const [decimal, setDecimal] = createSignal('')
  const [hex, setHex] = createSignal('')
  const [binary, setBinary] = createSignal('')
  const [octal, setOctal] = createSignal('')
  const [activeBase, setActiveBase] = createSignal<Base | null>(null)
  const [errors, setErrors] = createSignal<Set<Base>>(new Set())

  const fields: FieldConfig[] = [
    { base: 10, labelKey: 'base_decimal', hintKey: 'base_decimalHint', signal: decimal, setSignal: setDecimal },
    { base: 16, labelKey: 'base_hex', hintKey: 'base_hexHint', signal: hex, setSignal: setHex },
    { base: 2, labelKey: 'base_binary', hintKey: 'base_binaryHint', signal: binary, setSignal: setBinary },
    { base: 8, labelKey: 'base_octal', hintKey: 'base_octalHint', signal: octal, setSignal: setOctal },
  ]

  const setterMap: Record<Base, (v: string) => void> = {
    10: setDecimal,
    16: setHex,
    2: setBinary,
    8: setOctal,
  }

  const handleInput = (base: Base, value: string) => {
    setActiveBase(base)
    setterMap[base](value)

    if (!value.trim()) {
      // Clear all when input is empty
      fields.forEach((f) => { if (f.base !== base) f.setSignal('') })
      setErrors(new Set())
      return
    }

    const result = convertBase(value, base)
    if (result) {
      setErrors(new Set())
      if (base !== 10) setDecimal(result.decimal)
      if (base !== 16) setHex(result.hex)
      if (base !== 2) setBinary(result.binary)
      if (base !== 8) setOctal(result.octal)
    } else {
      setErrors(new Set([base]))
    }
  }

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const hasError = () => errors().has(field.base)
        return (
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-text-primary">
              {t(props.lang, field.labelKey)}
            </label>
            <input
              type="text"
              value={field.signal()}
              placeholder={t(props.lang, field.hintKey)}
              onInput={(e) => handleInput(field.base, e.currentTarget.value)}
              class={`w-full rounded-lg border px-3 py-2 font-mono text-sm bg-surface text-text-primary placeholder-text-muted transition-colors outline-none focus:ring-2 focus:ring-accent/30 ${
                hasError()
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border focus:border-accent'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6.5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6.6: Run all unit tests**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 6.7: Commit**

```bash
git add src/tools/number-base-converter.ts src/components/tools/NumberBaseConverter.tsx \
        src/config/tools.ts src/config/tool-components.ts \
        src/i18n/messages/
git commit -m "feat(number-base-converter): add number base converter tool"
```

---

## Task 7: Final Verification

- [ ] **Step 7.1: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass (original suite + new tests)

- [ ] **Step 7.2: Build the project**

```bash
npm run build
```
Expected: build succeeds with no errors

- [ ] **Step 7.3: Smoke test in browser**

```bash
npm run dev
```

Verify manually:
- [ ] `/en/tools/jwt-decoder` loads, paste a JWT, see decoded header/payload, expiry badge
- [ ] `/en/tools/uuid-generator` loads, Generate buttons work, batch works, copy works
- [ ] `/en/tools/number-base-converter` loads, typing in any field updates the other three, invalid input shows red border
- [ ] All 3 tools appear in the command palette (⌘K)
- [ ] All 3 tools appear in the sidebar under their respective categories

- [ ] **Step 7.4: Invoke finishing-a-development-branch skill**

Use `superpowers:finishing-a-development-branch` to create the PR.
