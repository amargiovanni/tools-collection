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
src/components/ui/ShareButton.tsx   UI button, copy-to-clipboard
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

---

## `src/components/ui/ShareButton.tsx`

- React island, placed in `ToolLayout.astro` header next to the favorites star button
- Props: none (state is fetched via custom event)
- On click:
  1. Dispatches `tool-state-request` custom event on `window`
  2. Awaits `tool-state-response` event (timeout: 200ms; if no response → no-op)
  3. Calls `encodeState(detail.state)`
  4. Builds URL: `location.href` with `?s=<encoded>` (replaces existing `s` param if present)
  5. Writes URL to clipboard via `navigator.clipboard.writeText()`
  6. Shows check-mark feedback for 2s (same pattern as existing `CopyButton`)

---

## Per-Tool State Wiring

Each tool component gains two behaviours:

### 1. Read state from URL on mount

```ts
useEffect(() => {
  const param = new URLSearchParams(location.search).get('s')
  decodeState(param).then(saved => {
    if (saved) applyState(saved) // apply recognised fields, ignore unknown ones
  })
}, [])
```

`applyState` applies only fields the tool recognises; unknown keys are silently ignored. This ensures forward/backward compatibility when tool options change.

### 2. Respond to state requests

```ts
useEffect(() => {
  const handler = () => {
    window.dispatchEvent(new CustomEvent('tool-state-response', {
      detail: { state: getCurrentState() }
    }))
  }
  window.addEventListener('tool-state-request', handler)
  return () => window.removeEventListener('tool-state-request', handler)
}, [getCurrentState])
```

`getCurrentState()` returns only fields needed to reproduce the result: input text, configuration options. Not transient UI state (loading flags, error messages, focus).

---

## Roll-out Plan

Not all 28 tools need wiring in the first PR. Phase 1 covers the highest-traffic tools:

| Tool | State fields |
|------|-------------|
| `json-formatter` | `input`, `indent` |
| `base64` | `input`, `mode` (encode/decode) |
| `regex-tester` | `pattern`, `flags`, `input` |
| `diff-checker` | `left`, `right` |
| `url-encoder` | `input`, `mode` |
| `hash-generator` | `input`, `algorithm` |

Remaining tools can be wired incrementally in subsequent PRs.

---

## Testing

### Unit (`tests/lib/share.test.ts`)

| Test | Expectation |
|------|-------------|
| Round-trip: short ASCII input | decode(encode(state)) deep-equals state |
| Round-trip: large input (10KB JSON) | same |
| Round-trip: unicode / emoji | same |
| Corrupt param | decodeState returns null, no throw |
| Empty param | decodeState returns null |
| Unknown version (`v: 999`) | decodeState returns null |
| Partial state (subset of tool fields) | applyState applies known fields, ignores rest |

### E2e (`e2e/share.spec.ts`)

| Scenario | Steps |
|----------|-------|
| Share json-formatter | Open tool → enter input → click Share → open copied URL → verify input pre-populated |
| Share base64 (encode mode) | Open tool → set input + mode → share → verify |
| Corrupt `?s=` param | Navigate to tool with `?s=INVALID` → tool opens empty, no error shown |
| Share URL survives reload | Open pre-filled URL → reload → state preserved |

---

## Out of Scope

- Syncing shared state to other open tabs (not needed)
- Server-side analytics on shared links (future consideration)
- Expiry / revocation of shared links (no server, links are eternal)
- Sharing across different locales (link works regardless of locale in URL)
