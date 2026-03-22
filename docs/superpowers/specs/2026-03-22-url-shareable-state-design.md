# URL Shareable State — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Scope:** tools-collection v1.3.0

---

## Problem

Users cannot share a pre-filled tool state with colleagues. Every link opens the tool empty, requiring manual re-entry of inputs and configuration.

## Goal

Any tool can be shared via URL with full state pre-populated. The recipient opens the link and sees exactly what the sender had configured.

---

## Approach

Query parameters + native browser `CompressionStream` (DeflateRaw). No new dependencies.

Rejected alternatives:
- **Base64 only** — URLs too long for large inputs (>2000 chars breaks some clients).
- **lz-string** — would require a new npm dependency; native `CompressionStream` achieves the same result.
- **Server-side short URLs** — requires backend, storage, TTL management; over-engineering for a static site.

---

## Architecture

Three layers of work:

```
src/lib/share.ts                    core encode/decode logic
src/components/ui/ShareButton.tsx   UI button, copy-to-clipboard (Solid.js island)
each tool component                 exposes current state + reads ?s= on mount
```

---

## `src/lib/share.ts`

### Envelope

```ts
type ShareEnvelope = { v: 1; state: Record<string, unknown> }
```

The `v` version field allows future schema migrations without breaking existing links.

### `encodeState(state: Record<string, unknown>): Promise<string>`

1. Wrap in envelope: `{ v: 1, state }`
2. Serialize to JSON string
3. Encode to `Uint8Array` via `TextEncoder`
4. Compress with `CompressionStream('deflate-raw')`
5. Convert to base64url string

### `decodeState(param: string | null): Promise<Record<string, unknown> | null>`

1. If `param` is null/empty → return `null`
2. Decode base64url → `Uint8Array`
3. Decompress with `DecompressionStream('deflate-raw')`
4. Parse JSON
5. Validate envelope shape (`v === 1`, `state` is object)
6. Return `envelope.state`
7. On any error (corrupt data, wrong version, JSON parse fail) → return `null`, never throw

> **Environment note:** `CompressionStream` / `DecompressionStream` are Web APIs available natively in Node.js 18+. Unit tests for `share.ts` must run in the `node` environment (default in this project's Vitest config). Do not run these tests in jsdom.

---

## `src/components/ui/ShareButton.tsx`

**Framework: Solid.js** (consistent with all other island components in the codebase).

- Solid.js island, placed in `ToolLayout.astro` header next to the favorites star button
- On click:
  1. Dispatches `tool-state-request` custom event on `window`
  2. Awaits `tool-state-response` event with a 200ms timeout
  3. If no response received within 200ms → the tool is not yet wired; button shows a brief "Not available" feedback (1.5s) and does nothing else
  4. On response: calls `encodeState(detail.state)`
  5. Builds URL: `location.href` with `?s=<encoded>` (replaces existing `s` param if present)
  6. Writes URL to clipboard via `navigator.clipboard.writeText()`
  7. Shows check-mark feedback for **1.5s** (matching `CopyButton` exactly)

**i18n keys required** (add to all 5 locale files: en, it, es, fr, de):
- `share_copy` — button label / aria-label ("Share", "Condividi", etc.)
- `share_copied` — feedback after successful copy ("Copied!", "Copiato!", etc.)
- `share_unavailable` — feedback when tool is not wired ("Not available", "Non disponibile", etc.)

---

## Per-Tool State Wiring

**Framework: Solid.js.** All tool components use `createSignal`, `onMount`, `onCleanup`, `createEffect` — not React hooks.

Each tool gains two behaviours:

### 1. Read state from URL on mount

```ts
// Solid.js pattern
onMount(async () => {
  const param = new URLSearchParams(location.search).get('s')
  const saved = await decodeState(param)
  if (saved) applyState(saved) // apply recognised fields, ignore unknown
})
```

`applyState` uses the tool's existing setters (e.g. `setInput`, `setMode`). Unknown keys in `saved` are silently ignored, ensuring forward/backward compatibility.

### 2. Respond to state requests

```ts
// Solid.js pattern — signals are read inside the handler at call time,
// so there is no stale-closure risk (Solid tracks reactivity at read time).
onMount(() => {
  const handler = () => {
    window.dispatchEvent(new CustomEvent('tool-state-response', {
      detail: { state: { /* read signals here, e.g. input(), mode() */ } }
    }))
  }
  window.addEventListener('tool-state-request', handler)
  onCleanup(() => window.removeEventListener('tool-state-request', handler))
})
```

State to serialize: only fields needed to reproduce the result (input text, configuration). Not transient UI state (loading flags, error messages).

---

## Roll-out Plan

Phase 1 covers the highest-traffic tools. The state fields below reflect **the actual signals** present in each component:

| Tool | State fields |
|------|-------------|
| `json-formatter` | `input`, `indent` |
| `base64` | `input` only (no mode signal — encode/decode are separate buttons) |
| `regex-tester` | `pattern`, `flags`, `input` |
| `diff-checker` | `left`, `right` |
| `url-encoder` | `input` only (no mode signal — encode/decode/encodeComponent are separate buttons) |
| `hash-generator` | `input` only (all three algorithms run simultaneously, no selector) |

Remaining tools can be wired incrementally in subsequent PRs.

### Known behavior gap — language switcher

The language switcher in `ToolLayout.astro` generates locale URLs without query parameters, so navigating between locales via the switcher will strip the `?s=` param. This is **accepted behavior** for v1.3.0. Adding `?s=` preservation to the language switcher is deferred to a future iteration.

---

## Testing

### Unit (`tests/lib/share.test.ts`) — Node environment

| Test | Expectation |
|------|-------------|
| Round-trip: short ASCII input | `decodeState(await encodeState(s))` deep-equals original state |
| Round-trip: large input (10KB JSON) | same |
| Round-trip: unicode / emoji | same |
| Corrupt base64 param | `decodeState` returns `null`, no throw |
| Empty / null param | `decodeState` returns `null` |
| Unknown version (`v: 999`) | `decodeState` returns `null` |

### Per-tool unit tests (e.g. `tests/components/json-formatter.test.ts`)

| Test | Expectation |
|------|-------------|
| `applyState` with full valid state | all recognised signals updated |
| `applyState` with partial state (subset of fields) | known fields updated, rest unchanged |
| `applyState` with unknown keys | known fields updated, unknown keys ignored without error |

### E2e (`e2e/share.spec.ts`)

| Scenario | Steps |
|----------|-------|
| Share json-formatter | Open tool → enter input → click Share → open copied URL → verify input pre-populated |
| Share regex-tester (with flags) | Open tool → set pattern + flags + input → share → verify all three fields |
| Corrupt `?s=` param | Navigate to tool with `?s=INVALID` → tool opens empty, no error shown to user |
| Share URL survives reload | Open pre-filled URL → reload → state preserved |
| Unwired tool | Click Share on an unwired tool → "Not available" feedback shown, no URL copied |

---

## Out of Scope

- Language switcher preserving `?s=` across locale switches (deferred — see Known behavior gap)
- Syncing shared state to other open tabs
- Server-side analytics on shared links
- Expiry / revocation of shared links (links are eternal — no server)
