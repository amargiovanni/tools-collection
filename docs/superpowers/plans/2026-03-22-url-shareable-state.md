# URL Shareable State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Share button to every tool page that encodes the current tool state into a `?s=` query param and copies the URL to the clipboard, so the tool opens pre-filled for anyone who receives the link.

**Architecture:** `src/lib/share.ts` provides pure async encode/decode functions using the native `CompressionStream` API (no new dependencies). `ShareButton.tsx` is a Solid.js island mounted in `ToolLayout.astro` next to the favorites star. Each tool component listens for a `tool-state-request` event and responds with its current signal values; on mount it reads `?s=` and pre-populates signals.

**Tech Stack:** Solid.js (createSignal, onMount, onCleanup), Astro (island hydration with `client:load`), native Web Compression API (`CompressionStream` / `DecompressionStream`), Vitest (unit tests, Node environment), Playwright (e2e tests).

**Spec:** `docs/superpowers/specs/2026-03-22-url-shareable-state-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `src/lib/share.ts` | `encodeState` / `decodeState` — pure async, no side effects |
| CREATE | `src/components/ui/ShareButton.tsx` | Solid.js island: dispatches event, awaits response, copies URL, shows feedback |
| MODIFY | `src/layouts/ToolLayout.astro` | Import `ShareButton` island (`client:load`), pass i18n data |
| MODIFY | `src/i18n/messages/en.json` | Add `share_copy`, `share_copied`, `share_unavailable` |
| MODIFY | `src/i18n/messages/it.json` | Same keys, Italian |
| MODIFY | `src/i18n/messages/es.json` | Same keys, Spanish |
| MODIFY | `src/i18n/messages/fr.json` | Same keys, French |
| MODIFY | `src/i18n/messages/de.json` | Same keys, German |
| MODIFY | `src/components/tools/JsonFormatter.tsx` | State wiring (Phase 1) |
| MODIFY | `src/components/tools/Base64.tsx` | State wiring (Phase 1) |
| MODIFY | `src/components/tools/RegexTester.tsx` | State wiring (Phase 1) |
| MODIFY | `src/components/tools/DiffChecker.tsx` | State wiring (Phase 1) |
| MODIFY | `src/components/tools/UrlEncoder.tsx` | State wiring (Phase 1) |
| MODIFY | `src/components/tools/HashGenerator.tsx` | State wiring (Phase 1) |
| CREATE | `tests/lib/share.test.ts` | Unit tests for encode/decode |
| CREATE | `e2e/share.spec.ts` | E2e scenarios |

---

## Task 1: Core library — `src/lib/share.ts`

**Files:**
- Create: `tests/lib/share.test.ts`
- Create: `src/lib/share.ts`

### Before you start: understand the pattern

Look at `src/lib/favorites.ts` for the established lib pattern (pure functions, no default exports).

`CompressionStream` / `DecompressionStream` are Web APIs available in Node.js 18+ and all modern browsers. They work natively in Vitest's default `node` environment — no polyfill needed.

base64url encoding: standard base64 with `+` → `-`, `/` → `_`, and `=` padding stripped.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/share.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from '../../src/lib/share'

describe('share', () => {
  describe('encodeState / decodeState round-trip', () => {
    it('round-trips a simple string value', async () => {
      const state = { input: 'hello world' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips a large JSON payload (>1KB)', async () => {
      const state = { input: JSON.stringify({ a: 'x'.repeat(2000) }) }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips unicode and emoji', async () => {
      const state = { input: '日本語テスト 🚀 مرحبا' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips multiple fields', async () => {
      const state = { input: 'test', indent: 4, mode: 'encode' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })
  })

  describe('decodeState — invalid input', () => {
    it('returns null for null', async () => {
      expect(await decodeState(null)).toBeNull()
    })

    it('returns null for empty string', async () => {
      expect(await decodeState('')).toBeNull()
    })

    it('returns null for corrupt base64', async () => {
      expect(await decodeState('!!!not_valid_base64!!!')).toBeNull()
    })

    it('returns null for valid base64 but not compressed JSON', async () => {
      const plain = btoa('{"v":1,"state":{}}') // not compressed
      expect(await decodeState(plain)).toBeNull()
    })

    it('returns null for unknown version', async () => {
      // Manually build a v999 envelope and encode it
      const raw = new TextEncoder().encode(JSON.stringify({ v: 999, state: {} }))
      const cs = new CompressionStream('deflate-raw')
      const writer = cs.writable.getWriter()
      writer.write(raw)
      writer.close()
      const compressed = await new Response(cs.readable).arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(compressed)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      expect(await decodeState(b64)).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/andreamargiovanni/dev/tools-collection
npx vitest run tests/lib/share.test.ts
```

Expected: several failures — `encodeState` and `decodeState` not found.

- [ ] **Step 3: Implement `src/lib/share.ts`**

```ts
export const TOOL_STATE_REQUEST = 'tool-state-request'
export const TOOL_STATE_RESPONSE = 'tool-state-response'

type ShareEnvelope = { v: 1; state: Record<string, unknown> }

function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export async function encodeState(state: Record<string, unknown>): Promise<string> {
  const envelope: ShareEnvelope = { v: 1, state }
  const json = JSON.stringify(envelope)
  const raw = new TextEncoder().encode(json)

  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(raw)
  writer.close()

  const compressed = await new Response(cs.readable).arrayBuffer()
  return toBase64Url(compressed)
}

export async function decodeState(
  param: string | null
): Promise<Record<string, unknown> | null> {
  if (!param) return null
  try {
    const compressed = fromBase64Url(param)
    const ds = new DecompressionStream('deflate-raw')
    const writer = ds.writable.getWriter()
    writer.write(compressed)
    writer.close()

    const decompressed = await new Response(ds.readable).arrayBuffer()
    const json = new TextDecoder().decode(decompressed)
    const envelope: unknown = JSON.parse(json)

    if (
      typeof envelope !== 'object' ||
      envelope === null ||
      (envelope as ShareEnvelope).v !== 1 ||
      typeof (envelope as ShareEnvelope).state !== 'object' ||
      (envelope as ShareEnvelope).state === null
    ) {
      return null
    }

    return (envelope as ShareEnvelope).state
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/share.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/share.ts tests/lib/share.test.ts
git commit -m "feat(share): add encodeState/decodeState core library"
```

---

## Task 2: i18n keys

**Files:**
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/it.json`
- Modify: `src/i18n/messages/es.json`
- Modify: `src/i18n/messages/fr.json`
- Modify: `src/i18n/messages/de.json`

The compile-time check in `src/i18n/index.ts` requires all locale files to have the exact same keys as `en.json`. Add all three keys to all five files at once, or TypeScript will fail to compile.

- [ ] **Step 1: Add keys to all locale files**

Add to `src/i18n/messages/en.json` (near other `share_` or `app_` keys):
```json
"share_copy": "Share",
"share_copied": "Copied!",
"share_unavailable": "Not available"
```

Add to `src/i18n/messages/it.json`:
```json
"share_copy": "Condividi",
"share_copied": "Copiato!",
"share_unavailable": "Non disponibile"
```

Add to `src/i18n/messages/es.json`:
```json
"share_copy": "Compartir",
"share_copied": "¡Copiado!",
"share_unavailable": "No disponible"
```

Add to `src/i18n/messages/fr.json`:
```json
"share_copy": "Partager",
"share_copied": "Copié !",
"share_unavailable": "Non disponible"
```

Add to `src/i18n/messages/de.json`:
```json
"share_copy": "Teilen",
"share_copied": "Kopiert!",
"share_unavailable": "Nicht verfügbar"
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx astro check
```

Expected: no type errors. If you see "Property X does not exist", you missed a key in one locale file.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/messages/
git commit -m "feat(share): add i18n keys for ShareButton (5 locales)"
```

---

## Task 3: `ShareButton.tsx` Solid.js island

**Files:**
- Create: `src/components/ui/ShareButton.tsx`

Look at `src/components/ui/CopyButton.tsx` before writing this — ShareButton follows the same Solid.js pattern.

Key decisions:
- The button dispatches `tool-state-request` on `window`, then waits up to 200ms for `tool-state-response`
- Success path: encode state → build URL with `?s=` replacing any existing `s` param → copy to clipboard → show "Copied!" for 1500ms
- Timeout path (tool not wired): show "Not available" for 1500ms, do nothing else
- Props: `label`, `copiedLabel`, `unavailableLabel` (strings from i18n, passed by ToolLayout.astro)

- [ ] **Step 1: Create `src/components/ui/ShareButton.tsx`**

```tsx
import { createSignal, onCleanup } from 'solid-js'
import { Button } from './Button'
import { encodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'

interface Props {
  label: string
  copiedLabel: string
  unavailableLabel: string
}

type FeedbackState = 'idle' | 'copied' | 'unavailable'

export function ShareButton(props: Props) {
  const [feedback, setFeedback] = createSignal<FeedbackState>('idle')

  // Timeout ref registered at component root so onCleanup works correctly.
  // Never call onCleanup inside an async handler — it only works in reactive/setup context.
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => { if (timeoutId !== undefined) clearTimeout(timeoutId) })

  const resetAfter = (ms: number) => {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => setFeedback('idle'), ms)
  }

  const handleShare = async () => {
    if (feedback() !== 'idle') return

    const state = await new Promise<Record<string, unknown> | null>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener(TOOL_STATE_RESPONSE, handler)
        resolve(null)
      }, 200)

      function handler(e: Event) {
        clearTimeout(timeout)
        window.removeEventListener(TOOL_STATE_RESPONSE, handler)
        resolve((e as CustomEvent<{ state: Record<string, unknown> }>).detail.state)
      }

      window.addEventListener(TOOL_STATE_RESPONSE, handler)
      window.dispatchEvent(new CustomEvent(TOOL_STATE_REQUEST))
    })

    if (state === null) {
      setFeedback('unavailable')
      resetAfter(1500)
      return
    }

    try {
      const encoded = await encodeState(state)
      const url = new URL(location.href)
      url.searchParams.set('s', encoded)
      await navigator.clipboard.writeText(url.toString())
      setFeedback('copied')
      resetAfter(1500)
    } catch {
      setFeedback('unavailable')
      resetAfter(1500)
    }
  }

  const label = () => {
    if (feedback() === 'copied') return `✓ ${props.copiedLabel}`
    if (feedback() === 'unavailable') return props.unavailableLabel
    return `🔗 ${props.label}`
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      {label()}
    </Button>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ShareButton.tsx
git commit -m "feat(share): add ShareButton Solid.js island"
```

---

## Task 4: Mount ShareButton in `ToolLayout.astro`

**Files:**
- Modify: `src/layouts/ToolLayout.astro`

The ShareButton must be a Solid.js island hydrated client-side. In Astro, import the `.tsx` component and use `client:load`. Look at how `src/pages/[lang]/tools/[tool].astro` imports `ToolRenderer` with `client:load` for reference.

Mount it in the header, inside `.flex.items-center.gap-2` (the block that contains the tool icon, the tool title, and the favorites star), immediately after the `#favorite-toggle` button.

- [ ] **Step 1: Add the import to the frontmatter**

In `src/layouts/ToolLayout.astro`, in the `---` frontmatter block, add:
```ts
import { ShareButton } from '../components/ui/ShareButton'
```

Note: `ShareButton` is a **named export** (all UI components in this codebase use named exports, e.g. `CopyButton`, `Button`). Do not use a default import.

- [ ] **Step 2: Mount the island in the header**

In `ToolLayout.astro`, locate the `<div class="flex items-center gap-2">` block (starts around line 55) that contains the tool icon `<span>`, the `<h1>` tool title, and the `#favorite-toggle` `<button>`. Add `<ShareButton client:load ... />` immediately after the closing `</button>` of `#favorite-toggle`, **still inside this same `<div>`**:

```astro
<!-- after #favorite-toggle closing </button>, still inside the same <div class="flex items-center gap-2"> -->
<ShareButton
  client:load
  label={t(lang, 'share_copy')}
  copiedLabel={t(lang, 'share_copied')}
  unavailableLabel={t(lang, 'share_unavailable')}
/>
```

Do **not** place it inside the `<div class="ml-auto flex items-center gap-2">` block on the right side of the header — that block is for search, theme toggle, and language switcher.

- [ ] **Step 3: Build and verify no errors**

```bash
npx astro build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/ToolLayout.astro
git commit -m "feat(share): mount ShareButton island in ToolLayout header"
```

---

## Task 5: Wire `JsonFormatter.tsx`

**Files:**
- Modify: `src/components/tools/JsonFormatter.tsx`
- Create: `tests/components/json-formatter-share.test.ts`

State to persist: `input` (string), `indent` (2 | 4 | 'tab' | 'compact').
The existing signals are `input` (createSignal('')) and `indent` (createSignal<JsonIndent>(2)).

The per-tool `applyState` logic is verified via the e2e tests (Task 11). The unit test here focuses on the pure type-guard logic used inside `onMount`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/json-formatter-share.test.ts` to verify the type-guard conditions used in `applyState` inline:

```ts
import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from '../../src/lib/share'

// Verify that the specific state shape expected by JsonFormatter
// round-trips correctly through encode/decode.
describe('JsonFormatter state round-trip', () => {
  it('preserves input string and numeric indent', async () => {
    const state = { input: '{"hello":"world"}', indent: 4 }
    expect(await decodeState(await encodeState(state))).toEqual(state)
  })

  it('preserves input string and string indent (tab)', async () => {
    const state = { input: 'test', indent: 'tab' }
    expect(await decodeState(await encodeState(state))).toEqual(state)
  })

  it('partial state (no indent) round-trips without error', async () => {
    const state = { input: 'only input' }
    expect(await decodeState(await encodeState(state))).toEqual(state)
  })
})
```

- [ ] **Step 2: Run test to confirm it passes**

```bash
npx vitest run tests/components/json-formatter-share.test.ts
```

Expected: all pass (uses the already-implemented `share.ts`).

- [ ] **Step 3: Add state wiring to `JsonFormatter.tsx`**

Add to the imports:
```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
```

Add inside the `JsonFormatter` function body, after the signal declarations:

```ts
// URL state: read on mount, respond to share requests
onMount(async () => {
  const param = new URLSearchParams(location.search).get('s')
  const saved = await decodeState(param)
  if (saved) {
    if (typeof saved.input === 'string') setInput(saved.input)
    if (saved.indent === 'tab' || saved.indent === 'compact' ||
        saved.indent === 2 || saved.indent === 4) {
      setIndent(saved.indent as JsonIndent)
    }
  }

  const handler = () => {
    window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
      detail: { state: { input: input(), indent: indent() } },
    }))
  }
  window.addEventListener(TOOL_STATE_REQUEST, handler)
  onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
})
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx astro check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/JsonFormatter.tsx tests/components/json-formatter-share.test.ts
git commit -m "feat(share): wire state sharing in JsonFormatter"
```

---

## Task 6: Wire `Base64.tsx`

**Files:**
- Modify: `src/components/tools/Base64.tsx`

Before editing, read `src/components/tools/Base64.tsx` to verify the signal names.
State to persist: `input` only (no mode signal — encode/decode are separate buttons).

- [ ] **Step 1: Read the file**

```bash
cat src/components/tools/Base64.tsx
```

Confirm the `input` signal name. If you see something other than `input`/`setInput`, adapt accordingly.

- [ ] **Step 2: Add state wiring**

Add imports:
```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
```

Add inside the component function after signal declarations:
```ts
onMount(async () => {
  const saved = await decodeState(new URLSearchParams(location.search).get('s'))
  if (saved && typeof saved.input === 'string') setInput(saved.input)

  const handler = () => {
    window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
      detail: { state: { input: input() } },
    }))
  }
  window.addEventListener(TOOL_STATE_REQUEST, handler)
  onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
})
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/Base64.tsx
git commit -m "feat(share): wire state sharing in Base64"
```

---

## Task 7: Wire `RegexTester.tsx`

**Files:**
- Modify: `src/components/tools/RegexTester.tsx`

Signals to persist: `pattern`, `testText`, `flagGlobal`, `flagCase`, `flagMultiline`.
(Already verified: these are the exact signal names from the source file.)

- [ ] **Step 1: Add state wiring**

Add imports:
```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
```

Add inside the component function after signal declarations:
```ts
onMount(async () => {
  const saved = await decodeState(new URLSearchParams(location.search).get('s'))
  if (saved) {
    if (typeof saved.pattern === 'string') setPattern(saved.pattern)
    if (typeof saved.testText === 'string') setTestText(saved.testText)
    if (typeof saved.flagGlobal === 'boolean') setFlagGlobal(saved.flagGlobal)
    if (typeof saved.flagCase === 'boolean') setFlagCase(saved.flagCase)
    if (typeof saved.flagMultiline === 'boolean') setFlagMultiline(saved.flagMultiline)
  }

  const handler = () => {
    window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
      detail: {
        state: {
          pattern: pattern(),
          testText: testText(),
          flagGlobal: flagGlobal(),
          flagCase: flagCase(),
          flagMultiline: flagMultiline(),
        },
      },
    }))
  }
  window.addEventListener(TOOL_STATE_REQUEST, handler)
  onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/RegexTester.tsx
git commit -m "feat(share): wire state sharing in RegexTester"
```

---

## Task 8: Wire `DiffChecker.tsx`

**Files:**
- Modify: `src/components/tools/DiffChecker.tsx`

Before editing, read the file to verify signal names.
Expected state: `left`, `right` (two text inputs).

- [ ] **Step 1: Read the file**

```bash
cat src/components/tools/DiffChecker.tsx
```

- [ ] **Step 2: Add state wiring** (adapt signal names if different)

`DiffChecker.tsx` may also have `ignoreCase` and `ignoreWhitespace` signals. **Do not wire these** — only persist `left` and `right` as specified in the spec. This is an intentional scope decision.

Add imports:
```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
```

Add inside the component function:
```ts
onMount(async () => {
  const saved = await decodeState(new URLSearchParams(location.search).get('s'))
  if (saved) {
    if (typeof saved.left === 'string') setLeft(saved.left)
    if (typeof saved.right === 'string') setRight(saved.right)
  }

  const handler = () => {
    window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
      detail: { state: { left: left(), right: right() } },
    }))
  }
  window.addEventListener(TOOL_STATE_REQUEST, handler)
  onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
})
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/DiffChecker.tsx
git commit -m "feat(share): wire state sharing in DiffChecker"
```

---

## Task 9: Wire `UrlEncoder.tsx` and `HashGenerator.tsx`

**Files:**
- Modify: `src/components/tools/UrlEncoder.tsx`
- Modify: `src/components/tools/HashGenerator.tsx`

Both tools expose `input` only (no mode/algorithm signal). Read both files first to confirm signal names.

- [ ] **Step 1: Read both files**

```bash
cat src/components/tools/UrlEncoder.tsx
cat src/components/tools/HashGenerator.tsx
```

- [ ] **Step 2: Wire UrlEncoder.tsx** (input only)

Add imports:
```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
```

Add inside component function after signal declarations (adapt `input`/`setInput` to actual signal names):
```ts
onMount(async () => {
  const saved = await decodeState(new URLSearchParams(location.search).get('s'))
  if (saved && typeof saved.input === 'string') setInput(saved.input)

  const handler = () => {
    window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
      detail: { state: { input: input() } },
    }))
  }
  window.addEventListener(TOOL_STATE_REQUEST, handler)
  onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
})
```

- [ ] **Step 3: Wire HashGenerator.tsx** (input only)

Same pattern as UrlEncoder above — adapt signal names if different from `input`/`setInput`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx astro check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/UrlEncoder.tsx src/components/tools/HashGenerator.tsx
git commit -m "feat(share): wire state sharing in UrlEncoder and HashGenerator"
```

---

## Task 10: Run full test suite

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: all pass. Fix any failures before continuing.

- [ ] **Step 2: Build the project**

```bash
npx astro build
```

Expected: build succeeds with no errors or warnings about missing keys.

---

## Task 11: E2e tests

**Files:**
- Create: `e2e/share.spec.ts`

Look at an existing e2e spec (e.g. `e2e/favorites.spec.ts`) before writing this one, to follow the established Playwright patterns (baseURL, navigation, `page.goto`, assertions).

- [ ] **Step 1: Read an existing e2e spec**

```bash
cat e2e/favorites.spec.ts
```

- [ ] **Step 2: Write `e2e/share.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('URL shareable state', () => {
  test('Share button copies URL with state for json-formatter', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/json-formatter/')

    // Enter input and set indent
    await page.locator('textarea').first().fill('{"a":1}')
    await page.locator('select').selectOption('4')

    // Click Share button
    await page.getByRole('button', { name: /share/i }).click()

    // Button should show "Copied!" feedback
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()

    // Open the copied URL
    const url = await page.evaluate(() => navigator.clipboard.readText())
    expect(url).toContain('?s=')

    const page2 = await context.newPage()
    await page2.goto(url)

    // Input should be pre-populated
    await expect(page2.locator('textarea').first()).toHaveValue('{"a":1}')
    await expect(page2.locator('select')).toHaveValue('4')
  })

  test('Share button copies URL with state for regex-tester (including flags)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/regex-tester/')

    await page.locator('input').first().fill('\\d+')
    await page.locator('textarea').first().fill('abc 123 def')
    // Toggle "ignore case" checkbox on (it is off by default)
    const ignoreCaseCheckbox = page.getByLabel(/ignore case/i)
    await ignoreCaseCheckbox.check()

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible()

    const url = await page.evaluate(() => navigator.clipboard.readText())
    const page2 = await context.newPage()
    await page2.goto(url)

    await expect(page2.locator('input').first()).toHaveValue('\\d+')
    await expect(page2.locator('textarea').first()).toHaveValue('abc 123 def')
    // Flag state must be restored
    await expect(page2.getByLabel(/ignore case/i)).toBeChecked()
  })

  test('corrupt ?s= param opens tool empty with no error shown', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/?s=!!!INVALID!!!')

    // Tool should load normally
    await expect(page.locator('textarea').first()).toHaveValue('')

    // No error banner visible
    await expect(page.locator('[class*="error"]')).not.toBeVisible()
  })

  test('Share button shows Not available for unwired tool', async ({ page }) => {
    // color-picker is not wired in Phase 1 — ShareButton should show unavailable feedback
    await page.goto('/en/tools/color-picker/')
    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('button', { name: /not available/i })).toBeVisible()
  })

  test('shared URL state survives page reload', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/tools/json-formatter/')
    await page.locator('textarea').first().fill('{"reload":"test"}')

    await page.getByRole('button', { name: /share/i }).click()
    const url = await page.evaluate(() => navigator.clipboard.readText())

    await page.goto(url)
    await expect(page.locator('textarea').first()).toHaveValue('{"reload":"test"}')

    await page.reload()
    await expect(page.locator('textarea').first()).toHaveValue('{"reload":"test"}')
  })
})
```

- [ ] **Step 3: Run e2e tests**

```bash
npx playwright test e2e/share.spec.ts
```

Expected: all 4 scenarios pass. If clipboard permissions fail in CI, check `playwright.config.ts` for the `permissions` setting used in other tests.

- [ ] **Step 4: Commit**

```bash
git add e2e/share.spec.ts
git commit -m "test(share): add e2e scenarios for URL shareable state"
```

---

## Task 12: Final verification and PR

- [ ] **Step 1: Run full unit test suite**

```bash
npx vitest run
```

Expected: all pass.

- [ ] **Step 2: Run full e2e suite**

```bash
npx playwright test
```

Expected: all pass (including existing favorites tests).

- [ ] **Step 3: Build**

```bash
npx astro build
```

Expected: clean build.

- [ ] **Step 4: Open PR to `main` from the feature branch**

```bash
gh pr create \
  --title "feat(share): URL shareable tool state" \
  --body "$(cat <<'EOF'
## Summary
- Add `src/lib/share.ts`: encode/decode tool state to/from `?s=` query param using native `CompressionStream` (no new deps)
- Add `ShareButton.tsx` Solid.js island in ToolLayout header
- Wire 6 Phase 1 tools: json-formatter, base64, regex-tester, diff-checker, url-encoder, hash-generator
- Add i18n keys in all 5 locales

## Test plan
- [ ] `npx vitest run` — all unit tests pass
- [ ] `npx playwright test` — all e2e tests pass (including new share scenarios)
- [ ] `npx astro build` — clean build
- [ ] Manual: open a tool, fill input, click Share, open copied URL, verify pre-populated
EOF
)"
```
