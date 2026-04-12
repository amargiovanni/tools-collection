# Codebase Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize and simplify the tools-collection codebase by eliminating duplication, fixing reactive patterns, and improving structure.

**Architecture:** Three layers of increasing blast radius. Layer 1 fixes reactive patterns in-place. Layer 2 introduces shared utilities (`useToolState`, `validateNonEmpty`) and migrates all 36 components. Layer 3 restructures pages into dynamic routes, decomposes CronExpression, and lazy-loads CommandPalette.

**Tech Stack:** Astro 6, SolidJS 1.9, TypeScript 5.9, Tailwind CSS 4, Vitest 4, Playwright

---

## File Structure

### New files
- `src/lib/useToolState.ts` -- shared hook for state save/restore boilerplate
- `src/lib/validation.ts` -- shared input validation utilities
- `src/components/tools/cron/CronPhrases.ts` -- extracted locale data from CronExpression
- `src/components/tools/cron/CronBuilder.tsx` -- extracted builder UI
- `src/components/tools/cron/CronSchedulePreview.tsx` -- extracted schedule preview
- `src/pages/[lang]/index.astro` -- dynamic language route (replaces 5 files)
- `src/pages/[lang]/tools/[tool].astro` -- dynamic tool route (replaces 5 files)
- `tests/lib/useToolState.test.ts` -- tests for new hook
- `tests/lib/validation.test.ts` -- tests for validation utility

### Modified files
- All 36 `src/components/tools/*.tsx` -- migrate to `useToolState()`
- ~25 `src/tools/*.ts` -- migrate to `validateNonEmpty()`
- `src/tools/emoji-shortcode.ts` -- perf fix
- `src/components/tools/CronExpression.tsx` -- decompose into sub-components

### Deleted files
- `src/pages/en/index.astro`, `src/pages/it/index.astro`, `src/pages/es/index.astro`, `src/pages/fr/index.astro`, `src/pages/de/index.astro`
- `src/pages/en/tools/[tool].astro`, `src/pages/it/tools/[tool].astro`, `src/pages/es/tools/[tool].astro`, `src/pages/fr/tools/[tool].astro`, `src/pages/de/tools/[tool].astro`

---

## LAYER 1 -- Zero-risk refactors

### Task 1: Fix `createMemo` in CsvViewer

**Files:**
- Modify: `src/components/tools/CsvViewer.tsx:34-56`

- [ ] **Step 1: Change `parsed` and `displayRows` from plain functions to `createMemo`**

In `src/components/tools/CsvViewer.tsx`, add `createMemo` to the import and wrap the two functions:

```tsx
// Line 1: add createMemo to import
import { createSignal, createMemo, Show, For, onMount, onCleanup } from 'solid-js'
```

Replace lines 34-56:

```tsx
  const parsed = createMemo(() => {
    const val = input().trim()
    if (!val) return null
    return parseCsv(val)
  })

  // handleSort stays the same (lines 40-48)

  const displayRows = createMemo(() => {
    const p = parsed()
    if (!p || !p.ok) return []
    const col = sortCol()
    if (col === null) return p.rows
    return sortRows(p.rows, col, sortDir())
  })
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/tools/csv-viewer.test.ts`
Expected: PASS

- [ ] **Step 3: Run build to verify no type errors**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/CsvViewer.tsx
git commit -m "refactor(csv-viewer): use createMemo for derived computations"
```

---

### Task 2: Fix `createMemo` in JwtDecoder

**Files:**
- Modify: `src/components/tools/JwtDecoder.tsx:42-52`

- [ ] **Step 1: Change `parsed` and `expiry` from plain functions to `createMemo`**

In `src/components/tools/JwtDecoder.tsx`, add `createMemo` to the import:

```tsx
import { createSignal, createMemo, Show, onMount, onCleanup } from 'solid-js'
```

Replace lines 42-52:

```tsx
  const parsed = createMemo(() => {
    const val = input().trim()
    if (!val) return null
    return parseJwt(val)
  })

  const expiry = createMemo(() => {
    const p = parsed()
    if (!p || !p.ok) return null
    return getExpiryStatus(p.payload)
  })
```

- [ ] **Step 2: Run tests and build**

Run: `npx vitest run tests/tools/jwt-decoder.test.ts && npm run build 2>&1 | tail -5`
Expected: PASS + build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/JwtDecoder.tsx
git commit -m "refactor(jwt-decoder): use createMemo for derived computations"
```

---

### Task 3: Fix `createMemo` for `cards()` pattern in 5 components

**Files:**
- Modify: `src/components/tools/DataSizeConverter.tsx:69-84`
- Modify: `src/components/tools/ColorPicker.tsx:71-80`
- Modify: `src/components/tools/HashGenerator.tsx:58-66`
- Modify: `src/components/tools/TimeConvert.tsx:64-75`
- Modify: `src/components/tools/TimestampConverter.tsx:63-73`

- [ ] **Step 1: Add `createMemo` import and wrap `cards()` in all 5 files**

For each file, add `createMemo` to the solid-js import, then change `const cards = () => {` to `const cards = createMemo(() => {` and close with `})` instead of `}`.

**DataSizeConverter.tsx** -- line 1 add `createMemo`, line 69 change:
```tsx
  const cards = createMemo(() => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_dataSizeConverter_bits'), value: formatDataSize(r.b) },
      { label: t(props.lang, 'tools_dataSizeConverter_bytes'), value: formatDataSize(r.B) },
      { label: t(props.lang, 'tools_dataSizeConverter_kilobytes'), value: formatDataSize(r.KB) },
      { label: t(props.lang, 'tools_dataSizeConverter_megabytes'), value: formatDataSize(r.MB) },
      { label: t(props.lang, 'tools_dataSizeConverter_gigabytes'), value: formatDataSize(r.GB) },
      { label: t(props.lang, 'tools_dataSizeConverter_terabytes'), value: formatDataSize(r.TB) },
      { label: t(props.lang, 'tools_dataSizeConverter_kibibytes'), value: formatDataSize(r.KiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_mebibytes'), value: formatDataSize(r.MiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_gibibytes'), value: formatDataSize(r.GiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_tebibytes'), value: formatDataSize(r.TiB) },
    ]
  })
```

**ColorPicker.tsx** -- line 1 add `createMemo`, line 71:
```tsx
  const cards = createMemo(() => {
    const r = result()
    if (!r) return []
    return [
      { label: 'HEX', value: r.hex },
      { label: 'RGB', value: r.rgb },
      { label: 'RGBA', value: r.rgba },
      { label: 'HSL', value: r.hsl },
    ]
  })
```

**HashGenerator.tsx** -- line 1 add `createMemo`, line 58:
```tsx
  const cards = createMemo(() => {
    const r = result()
    if (!r) return []
    return [
      { label: 'SHA-1', value: r.sha1 },
      { label: 'SHA-256', value: r.sha256 },
      { label: 'SHA-512', value: r.sha512 },
    ]
  })
```

**TimeConvert.tsx** -- line 1 add `createMemo`, line 64:
```tsx
  const cards = createMemo(() => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_timeConvert_milliseconds'), value: formatNumber(r.ms) },
      { label: t(props.lang, 'tools_timeConvert_seconds'), value: formatNumber(r.s) },
      { label: t(props.lang, 'tools_timeConvert_minutes'), value: formatNumber(r.min) },
      { label: t(props.lang, 'tools_timeConvert_hours'), value: formatNumber(r.h) },
      { label: t(props.lang, 'tools_timeConvert_days'), value: formatNumber(r.d) },
      { label: t(props.lang, 'tools_timeConvert_formatted'), value: r.formatted },
    ]
  })
```

**TimestampConverter.tsx** -- line 1 add `createMemo`, line 63:
```tsx
  const cards = createMemo(() => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_timestampConverter_unixSeconds'), value: String(r.seconds) },
      { label: t(props.lang, 'tools_timestampConverter_unixMilliseconds'), value: String(r.milliseconds) },
      { label: 'ISO 8601', value: r.iso },
      { label: 'UTC', value: r.utc },
      { label: t(props.lang, 'tools_timestampConverter_locale'), value: r.locale },
    ]
  })
```

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/DataSizeConverter.tsx src/components/tools/ColorPicker.tsx src/components/tools/HashGenerator.tsx src/components/tools/TimeConvert.tsx src/components/tools/TimestampConverter.tsx
git commit -m "refactor: use createMemo for cards() pattern in 5 components"
```

---

### Task 4: Fix PasswordStrength `createEffect` -> `createMemo`

**Files:**
- Modify: `src/components/tools/PasswordStrength.tsx:1,30-31,64-80`

- [ ] **Step 1: Replace `createEffect` with `createMemo` for password analysis**

In `src/components/tools/PasswordStrength.tsx`:

Change import on line 1:
```tsx
import { createSignal, createMemo, Show, For, onMount, onCleanup } from 'solid-js'
```

Remove the `error` signal (line 31) and the `createEffect` block (lines 64-80). Replace with a single memo:

```tsx
  const analysis = createMemo(() => {
    const pw = password()
    if (!pw) return null
    const res = checkPasswordStrength(pw)
    return res.ok ? { result: res.value, error: null } : { result: null, error: res.error.message }
  })

  const result = () => analysis()?.result ?? null
  const error = () => analysis()?.error ?? null
```

Remove `const [result, setResult]` and `const [error, setError]` signal declarations (lines 30-31).

The JSX already reads `result()` and `error()` so no template changes needed.

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/PasswordStrength.tsx
git commit -m "refactor(password-strength): replace createEffect with createMemo"
```

---

### Task 5: Fix emoji shortcode O(n*m) performance

**Files:**
- Modify: `src/tools/emoji-shortcode.ts:31-41,43-53`
- Test: `tests/tools/emoji-shortcode.test.ts` (if exists, verify passing)

- [ ] **Step 1: Replace split/join loop with single-pass regex**

In `src/tools/emoji-shortcode.ts`, replace the `toEmoji` function (lines 31-41):

```ts
const shortcodeRegex = new RegExp(
  [...emojiMap.keys()].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g',
)

export function toEmoji(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  return ok(input.replace(shortcodeRegex, (match) => emojiMap.get(match) ?? match))
}
```

Replace the `toShortcode` function (lines 43-53):

```ts
const emojiRegex = new RegExp(
  [...reverseMap.keys()].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gu',
)

export function toShortcode(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
  return ok(input.replace(emojiRegex, (match) => reverseMap.get(match) ?? match))
}
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/tools/emoji-shortcode.test.ts`
Expected: PASS (behavior unchanged, only performance improved)

- [ ] **Step 3: Commit**

```bash
git add src/tools/emoji-shortcode.ts
git commit -m "perf(emoji-shortcode): single-pass regex instead of O(n*m) split/join loop"
```

---

### Task 6: Run full test suite for Layer 1

- [ ] **Step 1: Run all unit tests**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build succeeds with no errors

- [ ] **Step 3: Tag Layer 1 complete (no commit, just verify)**

Layer 1 is done. All changes are zero-risk, no new files, no API changes.

---

### Deferred from Layer 1

- **Theme toggle dedup** (spec 1.3): requires deeper investigation of BaseLayout.astro vs HomeCatalog.astro vs ToolLayout.astro to confirm the scripts are truly redundant and not serving subtly different initialization paths. Worth a follow-up PR.
- **HomeCatalog script extraction** (spec 3.4): low priority, same reasoning.

---

## LAYER 2 -- Shared utilities + migration

### Task 7: Create `useToolState` hook with tests

**Files:**
- Create: `src/lib/useToolState.ts`
- Create: `tests/lib/useToolState.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/lib/useToolState.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test the hook's logic without SolidJS runtime (pure function behavior).
// The hook itself calls onMount/onCleanup which are SolidJS primitives,
// so we test the extracted helpers.

describe('useToolState', () => {
  it('module exports useToolState function', async () => {
    const mod = await import('../../src/lib/useToolState')
    expect(typeof mod.useToolState).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/useToolState.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Create `src/lib/useToolState.ts`**

```ts
import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from './share'

interface UseToolStateOptions {
  /** Called with saved state decoded from the URL ?s= parameter */
  onRestore: (saved: Record<string, unknown>) => void
  /** Returns current component state for sharing */
  getState: () => Record<string, unknown>
}

export function useToolState(options: UseToolStateOptions): void {
  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      options.onRestore(saved)
    }
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent(TOOL_STATE_RESPONSE, {
          detail: { state: options.getState() },
        }),
      )
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/useToolState.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/useToolState.ts tests/lib/useToolState.test.ts
git commit -m "feat: add useToolState hook to eliminate component boilerplate"
```

---

### Task 8: Create `validateNonEmpty` utility with tests

**Files:**
- Create: `src/lib/validation.ts`
- Create: `tests/lib/validation.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/lib/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateNonEmpty } from '../../src/lib/validation'

describe('validateNonEmpty', () => {
  it('returns error for empty string', () => {
    const result = validateNonEmpty('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only string', () => {
    const result = validateNonEmpty('   ')
    expect(result.ok).toBe(false)
  })

  it('returns trimmed value for non-empty string', () => {
    const result = validateNonEmpty('  hello  ')
    expect(result).toEqual({ ok: true, value: 'hello' })
  })

  it('returns value as-is when no trimming needed', () => {
    const result = validateNonEmpty('hello')
    expect(result).toEqual({ ok: true, value: 'hello' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Create `src/lib/validation.ts`**

```ts
import { ok, err } from './result'
import type { Result } from './result'

export function validateNonEmpty(input: string): Result<string> {
  const trimmed = input.trim()
  if (trimmed === '') return err('EMPTY_INPUT', 'Please enter some input')
  return ok(trimmed)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts tests/lib/validation.test.ts
git commit -m "feat: add validateNonEmpty utility for shared input validation"
```

---

### Task 9: Migrate all 36 components to `useToolState`

**Files:**
- Modify: all 36 files in `src/components/tools/*.tsx`

This is a mechanical migration. For each component, the change is:

1. Replace import of `decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE` from `../../lib/share` with `useToolState` from `../../lib/useToolState`
2. Remove `onCleanup` from solid-js import if only used for the state handler
3. Replace the entire `onMount(async () => { ... })` block with a `useToolState({ onRestore, getState })` call

- [ ] **Step 1: Migrate a representative batch -- simple single-input components (8 files)**

Files: `Base64.tsx`, `HashGenerator.tsx`, `JwtDecoder.tsx`, `RclonePassword.tsx`, `TimestampConverter.tsx`, `UrlEncoder.tsx`, `EmojiShortcode.tsx`, `CsvViewer.tsx`

Pattern -- using Base64.tsx as example. Before:
```tsx
import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
// ...
  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })
```

After:
```tsx
import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
// ...
  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    },
    getState: () => ({ input: input() }),
  })
```

Apply this pattern to all 8 files. The `onRestore` callback and `getState` return differ per component -- use the existing `if (typeof saved[...])` checks from each file's `onMount` block for `onRestore`, and the existing `{ state: { ... } }` object for `getState`.

- [ ] **Step 2: Run build to verify**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit batch 1**

```bash
git add src/components/tools/Base64.tsx src/components/tools/HashGenerator.tsx src/components/tools/JwtDecoder.tsx src/components/tools/RclonePassword.tsx src/components/tools/TimestampConverter.tsx src/components/tools/UrlEncoder.tsx src/components/tools/EmojiShortcode.tsx src/components/tools/CsvViewer.tsx
git commit -m "refactor: migrate 8 single-input components to useToolState"
```

- [ ] **Step 4: Migrate batch 2 -- multi-input components (10 files)**

Files: `AddTextToLines.tsx`, `ColorPicker.tsx`, `DataSizeConverter.tsx`, `DiffChecker.tsx`, `EmailExtractor.tsx`, `JsonFormatter.tsx`, `PemInspector.tsx`, `QrCode.tsx`, `RemoveDuplicateLines.tsx`, `TimeConvert.tsx`

Same pattern. Each has 2-4 state fields in `onRestore`/`getState`.

- [ ] **Step 5: Run build, commit batch 2**

```bash
git add src/components/tools/AddTextToLines.tsx src/components/tools/ColorPicker.tsx src/components/tools/DataSizeConverter.tsx src/components/tools/DiffChecker.tsx src/components/tools/EmailExtractor.tsx src/components/tools/JsonFormatter.tsx src/components/tools/PemInspector.tsx src/components/tools/QrCode.tsx src/components/tools/RemoveDuplicateLines.tsx src/components/tools/TimeConvert.tsx
git commit -m "refactor: migrate 10 multi-input components to useToolState"
```

- [ ] **Step 6: Migrate batch 3 -- remaining components (18 files)**

Files: `BittorrentMagnetLinkGenerator.tsx`, `ConvertCase.tsx`, `CountDuplicates.tsx`, `CronExpression.tsx`, `DomainExtractor.tsx`, `ListGenerator.tsx`, `NumberBaseConverter.tsx`, `PasswordGenerator.tsx`, `PasswordStrength.tsx`, `PinGenerator.tsx`, `Reg2Gpo.tsx`, `RegexTester.tsx`, `RemoveLineBreaks.tsx`, `RemoveLinesContaining.tsx`, `TextCounter.tsx`, `UsernameGenerator.tsx`, `UuidGenerator.tsx`, `XmlBeautifier.tsx`

Same pattern for all.

- [ ] **Step 7: Run build, commit batch 3**

```bash
git add src/components/tools/BittorrentMagnetLinkGenerator.tsx src/components/tools/ConvertCase.tsx src/components/tools/CountDuplicates.tsx src/components/tools/CronExpression.tsx src/components/tools/DomainExtractor.tsx src/components/tools/ListGenerator.tsx src/components/tools/NumberBaseConverter.tsx src/components/tools/PasswordGenerator.tsx src/components/tools/PasswordStrength.tsx src/components/tools/PinGenerator.tsx src/components/tools/Reg2Gpo.tsx src/components/tools/RegexTester.tsx src/components/tools/RemoveLineBreaks.tsx src/components/tools/RemoveLinesContaining.tsx src/components/tools/TextCounter.tsx src/components/tools/UsernameGenerator.tsx src/components/tools/UuidGenerator.tsx src/components/tools/XmlBeautifier.tsx
git commit -m "refactor: migrate remaining 18 components to useToolState"
```

- [ ] **Step 8: Verify zero remaining manual usages**

Run: `grep -r "TOOL_STATE_REQUEST" src/components/tools/`
Expected: NO matches (all migrated to useToolState)

Run: `grep -r "TOOL_STATE_RESPONSE" src/components/tools/`
Expected: NO matches

---

### Task 10: Migrate tool logic files to `validateNonEmpty`

**Files:**
- Modify: ~25 files in `src/tools/*.ts`

- [ ] **Step 1: Migrate tool files that use `input === ''` or `!input.trim()` or `input.trim() === ''`**

For each file, replace the inline validation with:
```ts
import { validateNonEmpty } from '../lib/validation'
```

And replace the empty-check pattern. Example for `add-text-to-lines.ts`:

Before:
```ts
export function addTextToLines(input: string, addition: string, position: Position): Result<string> {
  if (input === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }
```

After:
```ts
export function addTextToLines(input: string, addition: string, position: Position): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated
```

**Important:** Some tools use the trimmed value downstream, others don't trim. When `validateNonEmpty` returns `ok`, `validated.value` is the trimmed string. For tools that previously used `input === ''` (no trim), use `validated.value` only if the rest of the function would benefit from trimmed input. Otherwise, just use `validateNonEmpty` as a guard and continue using the original `input` parameter.

Files to migrate (use original `input` after guard):
- `add-text-to-lines.ts`, `convert-case.ts`, `list-generator.ts`, `remove-duplicate-lines.ts`, `remove-line-breaks.ts`, `remove-lines-containing.ts`, `diff-checker.ts`

Files to migrate (can use trimmed `validated.value`):
- `base64.ts` (both functions), `json-formatter.ts` (both functions), `url-encoder.ts` (both functions), `email-extractor.ts`, `domain-extractor.ts`, `count-duplicates.ts`, `emoji-shortcode.ts` (both functions), `xml-beautifier.ts`, `regex-tester.ts`, `pem-inspector.ts`, `qr-code.ts`, `hash-generator.ts`, `password-strength.ts`

- [ ] **Step 2: Run all unit tests**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/tools/*.ts
git commit -m "refactor: migrate tool logic files to shared validateNonEmpty utility"
```

---

### Task 11: Run full test suite for Layer 2

- [ ] **Step 1: Run all unit tests**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: all pass (share URL roundtrip still works)

---

## LAYER 3 -- Structural changes

### Task 12: Replace duplicate language pages with dynamic routes

**Files:**
- Create: `src/pages/[lang]/index.astro`
- Create: `src/pages/[lang]/tools/[tool].astro`
- Delete: `src/pages/{en,it,es,fr,de}/index.astro` (5 files)
- Delete: `src/pages/{en,it,es,fr,de}/tools/[tool].astro` (5 files)

- [ ] **Step 1: Create `src/pages/[lang]/index.astro`**

```astro
---
import type { GetStaticPaths } from 'astro'
import BaseLayout from '../../layouts/BaseLayout.astro'
import HomeCatalog from '../../components/HomeCatalog.astro'
import { t, languages } from '../../i18n'
import type { Language } from '../../i18n'

export const getStaticPaths: GetStaticPaths = () => {
  return languages.map((lang) => ({
    params: { lang },
    props: { lang },
  }))
}

const { lang } = Astro.props as { lang: Language }
---

<BaseLayout title={t(lang, 'app_documentTitle')} description={t(lang, 'app_description')} lang={lang}>
  <HomeCatalog lang={lang} />
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/[lang]/tools/[tool].astro`**

```astro
---
import type { GetStaticPaths } from 'astro'
import ToolLayout from '../../../layouts/ToolLayout.astro'
import ToolRenderer from '../../../islands/ToolRenderer'
import { toolRegistry, languages } from '../../../config/tools'
import type { ToolMeta } from '../../../config/tools'
import type { Language } from '../../../i18n'

export const getStaticPaths: GetStaticPaths = () => {
  return languages.flatMap((lang) =>
    toolRegistry.map((tool) => ({
      params: { lang, tool: tool.id },
      props: { tool, lang },
    }))
  )
}

const { tool, lang } = Astro.props as { tool: ToolMeta; lang: Language }
---

<ToolLayout tool={tool} lang={lang}>
  <ToolRenderer client:load toolId={tool.id} lang={lang} />
</ToolLayout>
```

**Note:** This requires `languages` to be exported from `src/config/tools.ts` or imported from `src/i18n/index.ts`. Since `languages` is already exported from `src/i18n/index.ts`, the tool page needs to import it from there. Adjust the import:
```ts
import { languages } from '../../../i18n'
```
And remove `languages` from the `../../../config/tools` import.

- [ ] **Step 3: Delete the 10 old page files**

```bash
rm src/pages/en/index.astro src/pages/it/index.astro src/pages/es/index.astro src/pages/fr/index.astro src/pages/de/index.astro
rm src/pages/en/tools/\[tool\].astro src/pages/it/tools/\[tool\].astro src/pages/es/tools/\[tool\].astro src/pages/fr/tools/\[tool\].astro src/pages/de/tools/\[tool\].astro
rmdir src/pages/en/tools src/pages/it/tools src/pages/es/tools src/pages/fr/tools src/pages/de/tools
rmdir src/pages/en src/pages/it src/pages/es src/pages/fr src/pages/de
```

- [ ] **Step 4: Run build and verify page count**

Run: `npm run build`
Expected: build succeeds, same number of HTML pages generated as before

Run: `find dist -name '*.html' | wc -l`
Expected: same count as before (all language x tool combinations still generated)

- [ ] **Step 5: Run E2E tests**

Run: `npm run test:e2e`
Expected: all pass (routes unchanged)

- [ ] **Step 6: Commit**

```bash
git add src/pages/
git commit -m "refactor: replace 10 duplicate language pages with 2 dynamic routes"
```

---

### Task 13: Extract CronExpression locale data

**Files:**
- Create: `src/components/tools/cron/CronPhrases.ts`
- Modify: `src/components/tools/CronExpression.tsx`

- [ ] **Step 1: Create `src/components/tools/cron/CronPhrases.ts`**

Move the `PhraseSet` type (lines 20-65), `phraseSets` object (lines 67-418), `UnitLabel` type (line 18), `unitLabels` object (lines 420-461), and `fieldNameKeys` object (lines 463-470) from `CronExpression.tsx` into this new file.

```ts
import type { Language } from '../../../i18n'
import type { CronFieldType } from '../../../tools/cron-expression'
import { cronExamples, awsCronExamples } from '../../../tools/cron-expression'

// Copy BuilderMode type
export type BuilderMode = 'everyMinutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'lastDay' | 'nthWeekday'

// Copy UnitLabel type
export type UnitLabel = { singular: string; plural: string; valuePrefix: string; everyLabel: string }

// Copy PhraseSet type (lines 20-65 of CronExpression.tsx)
export type PhraseSet = {
  // ... full type definition as-is
}

// Copy phraseSets object (lines 67-418)
export const phraseSets: Record<Language, PhraseSet> = {
  // ... full object as-is
}

// Copy unitLabels object (lines 420-461)
export const unitLabels: Record<Language, Record<CronFieldType, UnitLabel>> = {
  // ... full object as-is
}

// Copy fieldNameKeys object (lines 463-470)
export const fieldNameKeys: Record<CronFieldType, 'tools_cronExpression_fieldMinute' | 'tools_cronExpression_fieldHour' | 'tools_cronExpression_fieldDayOfMonth' | 'tools_cronExpression_fieldMonth' | 'tools_cronExpression_fieldDayOfWeek' | 'tools_cronExpression_fieldYear'> = {
  // ... full object as-is
}
```

- [ ] **Step 2: Update CronExpression.tsx to import from CronPhrases**

Replace the inline type definitions and data objects (lines 16-470) with:

```tsx
import { phraseSets, unitLabels, fieldNameKeys } from './cron/CronPhrases'
import type { BuilderMode, PhraseSet, UnitLabel } from './cron/CronPhrases'
```

- [ ] **Step 3: Run build and tests**

Run: `npm run build && npx vitest run tests/tools/cron-expression.test.ts`
Expected: both pass

- [ ] **Step 4: Commit**

```bash
mkdir -p src/components/tools/cron
git add src/components/tools/cron/CronPhrases.ts src/components/tools/CronExpression.tsx
git commit -m "refactor(cron): extract 400 lines of locale data to CronPhrases.ts"
```

---

### Task 14: Switch CommandPalette to `client:idle`

**Files:**
- Modify: the Astro layout file that renders CommandPalette

- [ ] **Step 1: Find where CommandPalette is rendered**

Run: `grep -r "CommandPalette" src/layouts/ src/components/ --include="*.astro"`
Identify the file and line.

- [ ] **Step 2: Change hydration directive**

Change `client:only="solid-js"` to `client:idle` (or `client:visible` if it's inside a modal trigger).

This defers Fuse.js loading + SolidJS hydration until the browser is idle, instead of blocking on page load.

- [ ] **Step 3: Run build and verify**

Run: `npm run build`
Expected: build succeeds

Manually verify: open the site, confirm Cmd+K still opens the command palette.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro  # or whichever file
git commit -m "perf: defer CommandPalette hydration to client:idle"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full unit test suite**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: all pass

- [ ] **Step 4: Review full diff**

Run: `git diff main --stat`
Verify: no unexpected files changed, no leftover debug code

- [ ] **Step 5: Verify no remaining manual boilerplate**

Run: `grep -r "TOOL_STATE_REQUEST" src/components/tools/`
Expected: NO matches

Run: `grep -c "EMPTY_INPUT.*Please enter" src/tools/*.ts`
Expected: 0 matches (all migrated to validateNonEmpty)
