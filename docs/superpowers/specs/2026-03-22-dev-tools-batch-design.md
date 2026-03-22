# Dev Tools Batch — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Scope:** tools-collection v1.3.x
**Tools:** JWT Decoder · UUID/ULID Generator · Number Base Converter

---

## Problem

The tool collection lacks three high-frequency developer utilities that every engineer reaches for regularly. All three are pure client-side transformations with no external dependencies.

## Goal

Add three new tools to the catalog, each following the established codebase pattern, with zero new npm dependencies.

---

## Shared Architecture

All three tools follow the same pattern already used by every existing tool:

```
src/tools/<name>.ts              tool metadata (id, icon, category)
src/components/tools/<Name>.tsx  Solid.js island component
src/config/tools.ts              registration in the catalog
src/config/tool-components.ts    id → component mapping
src/i18n/messages/*.json         i18n keys (all 5 locales: en, it, es, fr, de)
tests/tools/<name>.test.ts       unit tests on pure logic
```

**Zero new dependencies** — all implemented with native browser/Node.js APIs:

| Tool | APIs used |
|------|-----------|
| JWT Decoder | `atob()`, `JSON.parse` |
| UUID v4 | `crypto.randomUUID()` |
| UUID v7 + ULID | `Date.now()`, `crypto.getRandomValues()` |
| Number Base Converter | `parseInt(value, base)`, `Number.prototype.toString(base)` |

---

## Tool 1: JWT Decoder

### File layout

- `src/tools/jwt-decoder.ts` — metadata + pure parsing logic
- `src/components/tools/JwtDecoder.tsx` — Solid.js component
- `tests/tools/jwt-decoder.test.ts` — unit tests

### UI

Input: single textarea for pasting the JWT string.

Output: 3 panels (side-by-side on desktop, stacked on mobile):

| Panel | Content |
|-------|---------|
| **Header** | Formatted JSON |
| **Payload** | Formatted JSON + optional expiry badge |
| **Signature** | Raw bytes as hex string + fixed note "not verified — client-side only" |

**Expiry badge** (shown only when `exp` claim is present in payload):
- 🟢 `VALID · expires in 2h 14m` — if `exp > Date.now() / 1000`
- 🔴 `EXPIRED · 3 days ago` — if `exp ≤ Date.now() / 1000`

### Pure logic (`jwt-decoder.ts`)

```ts
export type JwtParseResult =
  | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown>; signatureHex: string }
  | { ok: false; error: string }

export function parseJwt(token: string): JwtParseResult
```

Rules:
- Split on `.` → must yield exactly 3 parts
- `atob(base64url_decode(part))` for header and payload → `JSON.parse`
- Signature: base64url decode → format as lowercase hex string
- Any failure at any step → `{ ok: false, error: <human-readable message> }`

```ts
export function getExpiryStatus(payload: Record<string, unknown>):
  | { status: 'valid'; remainingMs: number }
  | { status: 'expired'; elapsedMs: number }
  | { status: 'none' }
```

### Error handling

Malformed token (wrong number of parts, invalid base64, invalid JSON) → inline error message below the input field. No crash. Component state resets cleanly when input is cleared.

---

## Tool 2: UUID/ULID Generator

### File layout

- `src/tools/uuid-generator.ts` — metadata + pure generation functions
- `src/components/tools/UuidGenerator.tsx` — Solid.js component
- `tests/tools/uuid-generator.test.ts` — unit tests

### UI

Three sections: **UUID v4**, **UUID v7**, **ULID**. Each section contains:
- Output field showing the last generated value
- `Generate` button
- `CopyButton` (existing component)
- `Generate 10` button → reveals a list of 10 values with a copy-all button

### Pure logic (`uuid-generator.ts`)

```ts
export function generateUUIDv4(): string
// delegates to crypto.randomUUID()

export function generateUUIDv7(): string
// 48-bit ms timestamp | 12-bit random | variant bits 10 | 62-bit random
// format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx

export function generateULID(): string
// 48-bit ms timestamp encoded as 10 Crockford Base32 chars
// + 80-bit random encoded as 16 Crockford Base32 chars
// = 26-character string (e.g. 01ARZ3NDEKTSV4RRFFQ69G5FAV)
```

**UUID v7 implementation notes:**
- Version nibble = `7`, variant bits = `10xx` (RFC 9562)
- Monotonicity within same millisecond: increment random bits rather than regenerating

**ULID implementation notes:**
- Crockford Base32 alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
- No external library needed — encode with a simple lookup table

---

## Tool 3: Number Base Converter

### File layout

- `src/tools/number-base-converter.ts` — metadata + pure conversion function
- `src/components/tools/NumberBaseConverter.tsx` — Solid.js component
- `tests/tools/number-base-converter.test.ts` — unit tests

### UI

4 input fields arranged in a 2×2 grid (stacked on mobile), each editable:

| Field | Hint text | Base |
|-------|-----------|------|
| Decimal | `e.g. 255` | 10 |
| Hexadecimal | `e.g. ff` | 16 |
| Binary | `e.g. 11111111` | 2 |
| Octal | `e.g. 377` | 8 |

Behavior: editing any field updates the other three in real time via `createEffect`.

Supports positive and negative integers (sign is preserved). No floating point.

Error handling: input invalid for its base (e.g. `2` in binary, `g` in hex) → that field gets a red border; the other fields retain the last valid value. No crash, no NaN propagation.

### Pure logic (`number-base-converter.ts`)

```ts
export type BaseConversionResult = {
  decimal: string
  hex: string
  binary: string
  octal: string
}

export function convertBase(value: string, fromBase: 2 | 8 | 10 | 16): BaseConversionResult | null
// Returns null if value is not a valid integer in fromBase.
// Handles negative numbers by preserving the leading '-'.
```

---

## i18n Keys Required

Add to all 5 locale files (`en.json`, `it.json`, `es.json`, `fr.json`, `de.json`):

### JWT Decoder
- `tool_jwt_decoder_name`
- `tool_jwt_decoder_desc`
- `jwt_header` — "Header"
- `jwt_payload` — "Payload"
- `jwt_signature` — "Signature"
- `jwt_not_verified` — "not verified — client-side only"
- `jwt_valid` — "VALID"
- `jwt_expired` — "EXPIRED"
- `jwt_expires_in` — "expires in {time}"
- `jwt_expired_ago` — "expired {time} ago"
- `jwt_error_format` — "Invalid JWT format"
- `jwt_error_json` — "Could not parse JSON"

### UUID/ULID Generator
- `tool_uuid_generator_name`
- `tool_uuid_generator_desc`
- `uuid_generate` — "Generate"
- `uuid_generate_ten` — "Generate 10"
- `uuid_copy_all` — "Copy all"

### Number Base Converter
- `tool_number_base_converter_name`
- `tool_number_base_converter_desc`
- `base_decimal` — "Decimal"
- `base_hex` — "Hexadecimal"
- `base_binary` — "Binary"
- `base_octal` — "Octal"

---

## Testing

### Unit tests (Vitest, node environment)

**`tests/tools/jwt-decoder.test.ts`**

| Test | Expectation |
|------|-------------|
| Valid JWT → header/payload/signature parsed correctly | `ok: true`, correct objects |
| Valid JWT with future `exp` → status `valid` with positive remainingMs | |
| Valid JWT with past `exp` → status `expired` with positive elapsedMs | |
| Valid JWT without `exp` → status `none` | |
| Wrong number of parts | `ok: false` |
| Invalid base64 in header | `ok: false` |
| Non-JSON header | `ok: false` |

**`tests/tools/uuid-generator.test.ts`**

| Test | Expectation |
|------|-------------|
| `generateUUIDv4()` matches UUID v4 regex | `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` |
| `generateUUIDv7()` matches UUID v7 regex | version nibble = `7`, variant bits = `8–b` |
| `generateUUIDv7()` called twice in same ms → second has higher random bits | monotonicity |
| `generateULID()` is 26 characters, all Crockford Base32 chars | |
| 100 consecutive ULIDs generated within 1ms → all unique, sorted | |

**`tests/tools/number-base-converter.test.ts`**

| Test | Expectation |
|------|-------------|
| `convertBase('255', 10)` | `{ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' }` |
| `convertBase('ff', 16)` | same result |
| `convertBase('-10', 10)` | `{ decimal: '-10', hex: '-a', binary: '-1010', octal: '-12' }` |
| `convertBase('2', 2)` | `null` (invalid binary digit) |
| `convertBase('', 10)` | `null` |
| `convertBase('9007199254740993', 10)` (> MAX_SAFE_INTEGER) | handles gracefully (use `BigInt`) |

> **Note on large numbers:** `parseInt` loses precision beyond `Number.MAX_SAFE_INTEGER`. `convertBase` should use `BigInt` internally.

---

## Out of Scope

- JWT signature verification (requires server or key material)
- UUID v1, v3, v5 (not in spec)
- NanoID (not in spec)
- UUID v7 sub-millisecond sequence beyond simple increment
- Floating point base conversion
- Custom base (base 32, base 58, etc.)
