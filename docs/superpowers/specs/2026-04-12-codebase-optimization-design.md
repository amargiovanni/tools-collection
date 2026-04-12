# Codebase Optimization & Simplification

**Date:** 2026-04-12
**Branch:** `feat/optim`
**Approach:** Layered by blast radius -- each layer is independently shippable

---

## Layer 1 -- Zero-risk refactors

No API changes, no new files. Pure improvements to existing code.

### 1.1 `createMemo` fixes

Replace plain arrow functions and unnecessary signals with `createMemo` where values are derived from other reactive state. Currently ~12 components recompute on every access instead of caching.

**Files to fix:**

| Component | Issue | Fix |
|-----------|-------|-----|
| `CsvViewer.tsx` | `parsed()`, `displayRows()` are plain functions | Wrap in `createMemo` |
| `JwtDecoder.tsx` | `parsed()`, `expiry()` are plain functions | Wrap in `createMemo` |
| `DataSizeConverter.tsx` | `cards()` rebuilds array every render | Wrap in `createMemo` |
| `ColorPicker.tsx` | `cards()` same; `colorInput`/`pickerValue` dual state | `createMemo` + merge signals |
| `EmailExtractor.tsx` | `count` signal is derived from output | Replace with `createMemo` |
| `CountDuplicates.tsx` | `entries` signal derived from input+options | Replace with `createMemo` |
| `RemoveLinesContaining.tsx` | `removed`/`kept` are derived | Replace with `createMemo` |
| `HashGenerator.tsx` | `cards()` rebuilds every render | Wrap in `createMemo` |
| `TimeConvert.tsx` | `cards()` rebuilds every render | Wrap in `createMemo` |
| `TimestampConverter.tsx` | `cards()` rebuilds every render | Wrap in `createMemo` |
| `PasswordStrength.tsx` | `createEffect` for sync compute | Convert to `createMemo` |

### 1.2 Emoji replacement performance

**File:** `src/tools/emoji-shortcode.ts`

Current implementation uses `result.split(shortcode).join(emoji)` in a loop -- O(n*m) where n = number of replacements, m = string length. Creates a new string per iteration.

**Fix:** Build a single regex from all shortcodes, replace in one pass with `String.prototype.replace()`.

### 1.3 Theme toggle deduplication

The ~35-line theme toggle script is copy-pasted in:
- `HomeCatalog.astro` (lines 256-311)
- `ToolLayout.astro` (lines 256-310)

Both are redundant because `BaseLayout.astro` already handles theme initialization.

**Fix:** Remove the duplicated theme toggle scripts from HomeCatalog and ToolLayout if BaseLayout already covers it. If not, extract to a single shared `<script>` include.

---

## Layer 2 -- New shared utilities + migration

### 2.1 `useToolState()` hook

**New file:** `src/lib/useToolState.ts`

Encapsulates the 15-line boilerplate repeated identically in all 36 tool components:
- Decode state from URL `?s=` parameter via `decodeState()`
- Call `onRestore` callback with saved state
- Wire up `TOOL_STATE_REQUEST` listener that responds with current state
- Clean up listener via `onCleanup`

**API:**

```ts
function useToolState(options: {
  /** Called with saved state from URL when available */
  onRestore: (saved: Record<string, unknown>) => void
  /** Returns current state to serialize for sharing */
  getState: () => Record<string, unknown>
}): void
```

Called inside `onMount`. Handles all event wiring internally.

**Migration:** All 36 components in `src/components/tools/` get updated to use this hook, replacing their manual `onMount` boilerplate.

### 2.2 `validateNonEmpty()` utility

**New file:** `src/lib/validation.ts`

```ts
import { ok, err, type Result } from './result'

export function validateNonEmpty(input: string): Result<string> {
  const trimmed = input.trim()
  if (trimmed === '') return err('EMPTY_INPUT', 'Please enter some input')
  return ok(trimmed)
}
```

Replaces ~25 scattered empty-input checks in `src/tools/*.ts`. Standardizes behavior to `input.trim() === ''` (some files currently use `input === ''` or `!input.trim()`).

**Migration:** Update all tool logic files that have inline empty-input validation.

---

## Layer 3 -- Structural changes

### 3.1 Dynamic routes for pages

**Current state:** 10 duplicate page files across 5 languages:
- `src/pages/{en,it,es,fr,de}/index.astro` -- identical except `const lang = 'xx'`
- `src/pages/{en,it,es,fr,de}/tools/[tool].astro` -- identical except `const lang = 'xx'`

**Fix:** Replace with 2 dynamic routes:
- `src/pages/[lang]/index.astro` with `getStaticPaths()` returning all languages
- `src/pages/[lang]/tools/[tool].astro` with `getStaticPaths()` returning lang x tool combinations
- Root `src/pages/index.astro` stays as redirect

**Impact:** ~110 lines of duplication removed, 10 files become 2.

### 3.2 CronExpression decomposition

**Current state:** `CronExpression.tsx` is 636+ lines -- the largest component by far.

**Fix:** Split into focused modules:
- `src/tools/cron-phrases.ts` -- ~140 lines of locale phrase data (extracted from component)
- `src/components/tools/cron/CronBuilder.tsx` -- builder mode UI
- `src/components/tools/cron/CronSchedulePreview.tsx` -- schedule preview rendering
- `src/components/tools/CronExpression.tsx` -- orchestrator wiring sub-components

### 3.3 CommandPalette lazy-load

**Current state:** CommandPalette hydrates with `client:only="solid-js"` on every page, loading Fuse.js eagerly.

**Fix:** Switch to `client:idle` so hydration defers until browser is idle. Build search index lazily on first palette open, not on page load.

### 3.4 HomeCatalog script extraction

**Current state:** ~60 lines of inline `<script>` in `HomeCatalog.astro` for search and back-to-top functionality.

**Fix:** Move to `src/scripts/home.ts`, imported as a normal module. Cleaner, cacheable by browser, testable.

---

## Verification plan

Each layer gets verified independently before moving to the next:

- **Layer 1:** `npm run test` + `npm run build` + manual spot-check of affected components
- **Layer 2:** `npm run test` + verify share URL roundtrip still works + grep for remaining `TOOL_STATE_REQUEST` manual usage (should be zero)
- **Layer 3:** `npm run test` + `npm run test:e2e` + verify all language routes render correctly + check build output size

---

## Out of scope

- Adding new features or tools
- Changing visual design or UX behavior
- Modifying test coverage (tests updated only where interfaces change)
- i18n key cleanup (low impact, separate PR)
- Dockerfile/CI improvements (separate PR)
