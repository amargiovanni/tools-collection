# Tools Collection — Astro Refactor Design

## Overview

Complete rewrite of the Tools Collection project from a monolithic vanilla JS SPA to a modular, type-safe Astro application with Solid.js islands. The goal is extreme modularization, zero code duplication, strict TypeScript, and deployment compatibility with both local dev and Cloudflare Pages.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Meta-framework | Astro | SSG, per-page code splitting, islands architecture |
| UI framework | Solid.js | Fine-grained reactivity, zero vDOM, TS-first |
| Styling | Tailwind CSS 4 | CSS-first `@theme` config, utility classes |
| i18n | Paraglide.js | Compile-time, type-safe, zero runtime |
| TypeScript | Strict mode (all flags) | No `any`, no `as` casts, no `@ts-ignore` |
| Routing | One Astro page per tool | Max code splitting, SEO-friendly |
| Theme | CSS tokens + Solid ThemeProvider | Centralized palette, programmatic access |
| Search | Command palette (Ctrl/Cmd+K) | Modern UX, fuzzy search, keyboard nav |
| Deploy | Cloudflare Pages (SSG) | Static output, works locally too |
| Variant management | cva (class-variance-authority) | Type-safe variant props for UI components |
| Testing | Vitest | Fast, Vite-native, TS-first, Astro-compatible |
| Search algorithm | fuse.js | Lightweight fuzzy search for command palette |

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                  # Reusable UI component library (Solid)
│   │   ├── Button.tsx
│   │   ├── TextArea.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── OutputPanel.tsx
│   │   ├── CopyButton.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── StatusMessage.tsx
│   │   ├── FileInput.tsx
│   │   ├── DownloadButton.tsx
│   │   └── Toast.tsx
│   ├── tools/               # Tool UI components (Solid, one per tool)
│   │   ├── JsonFormatter.tsx
│   │   ├── PasswordGenerator.tsx
│   │   └── ...
│   ├── Sidebar.astro        # Static sidebar navigation
│   └── HomeCatalog.astro    # Static homepage tool grid
├── islands/                 # Cross-page interactive islands (Solid)
│   ├── CommandPalette.tsx
│   ├── ThemeToggle.tsx
│   └── LanguageSwitcher.tsx
├── layouts/
│   ├── BaseLayout.astro     # HTML head, meta, fonts, theme init, ViewTransitions
│   └── ToolLayout.astro     # Sidebar + header + tool slot
├── tools/                   # Pure logic (zero DOM, zero UI imports)
│   ├── json-formatter.ts
│   ├── password-generator.ts
│   └── ...                  # One file per tool
├── pages/
│   └── [lang]/
│       ├── index.astro      # Homepage with catalog (per-language)
│       └── tools/
│           └── [tool].astro # Dynamic route — generates all tool pages via getStaticPaths()
├── config/
│   └── tools.ts             # Tool registry (metadata, categories, keywords)
├── i18n/
│   └── messages/
│       ├── en.json
│       └── it.json
├── styles/
│   └── global.css           # @theme tokens, reset, Tailwind 4 base
├── lib/
│   ├── result.ts            # Result<T> type for error handling
│   ├── theme.tsx            # ThemeProvider + useTheme()
│   ├── clipboard.ts         # Copy-to-clipboard utility
│   ├── download.ts          # File download utility
│   └── toast.tsx            # Global toast notification context
├── tests/                   # Vitest test files
│   ├── tools/               # Pure logic unit tests (one per tool)
│   └── setup.ts             # Test setup
└── astro.config.ts
```

### Layer Separation

Each tool exists across three clean layers:

1. **Pure logic** (`tools/*.ts`) — Functions that transform input to output. No DOM, no UI imports, no side effects. Return `Result<T>`. Independently testable.
2. **UI component** (`components/tools/*.tsx`) — Solid component that composes `components/ui/*` building blocks. Imports pure logic and Paraglide messages. Handles signals and user interaction.
3. **Page** (`pages/tools/*.astro`) — Thin Astro page that imports `ToolLayout` and mounts the tool component as a `client:load` island.

### Component Library (`components/ui/`)

Reusable, typed Solid components with Tailwind styling:

| Component | Key Props | Purpose |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost'`, `size: 'sm' \| 'md'`, `icon?` | All actions |
| `TextArea` | `label`, `placeholder`, `rows`, `readonly`, `onInput` | Text input/output |
| `Input` | `type`, `label`, `min`, `max`, `step` | Short text, numbers |
| `Select` | `options: Option[]`, `label`, `onChange` | Discrete choices |
| `Checkbox` | `label`, `checked`, `onChange` | Boolean toggles |
| `OutputPanel` | `value`, `label`, `copyable` | Results display with integrated copy |
| `CopyButton` | `getValue: () => string` | Clipboard copy, reusable |
| `Card` | `title`, `description`, `icon`, `href` | Homepage catalog cards |
| `Badge` | `variant: 'info' \| 'success' \| 'error'`, `text` | Status indicators |
| `StatusMessage` | `type: 'success' \| 'error' \| 'warning'`, `message` | Inline user feedback |
| `FileInput` | `accept`, `label`, `onFile` | File upload (Reg2GPO, QR reader) |
| `DownloadButton` | `getData: () => Blob \| string`, `filename`, `mimeType` | File download (Reg2GPO XML, QR PNG) |
| `Toast` | (via context) `show(message, type)` | Global toast notifications (copy confirm, transient feedback) |

All components use `cva` internally for variant management. Props are strictly typed — no `string` where a union applies.

### Notification System

Two patterns for user feedback:

1. **`StatusMessage`** — inline, persistent, rendered inside the tool layout. For validation errors, results status.
2. **`Toast`** — global, auto-dismiss (3s), rendered via a `ToastProvider` in `BaseLayout`. For transient confirmations (copy success, download started). Accessible with `role="status"` and `aria-live="polite"`.

### Error Handling

Consistent `Result<T>` pattern across all pure logic:

```ts
export type ResultError = {
  code: string       // Machine-readable error code (e.g., 'INVALID_JSON', 'EMPTY_INPUT')
  message: string    // Default English message (fallback)
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: ResultError }
```

- Pure functions return `Result<T>`, never throw
- Error `code` maps to Paraglide i18n keys for translated error messages (`m.errors_{code}()`)
- Error `message` is the English fallback, used only if the i18n key is missing
- UI components check `.ok` and render `StatusMessage` on error, using translated message
- Zero `try/catch` in UI layer

### Tool Registry (`config/tools.ts`)

Single source of truth for structural metadata:

```ts
export const categories = [
  'text-processing', 'generators', 'extraction', 'analysis',
  'security', 'converters', 'development', 'utilities'
] as const

export type Category = typeof categories[number]

export interface ToolMeta {
  id: string
  category: Category
  icon: string
  keywords: string[]
  path: string
}
```

Tool names and descriptions come from Paraglide (language-dependent), not from the registry. The registry holds only language-invariant structural data.

Exported helpers:
- `getToolMeta(id: string): ToolMeta`
- `getToolsByCategory(category: Category): ToolMeta[]`
- `searchTools(query: string): ToolMeta[]` — fuzzy match on id + keywords

### Tool Inventory (27 tools) — ID Mapping

Old ID (current `data-tool`) → New ID (used in routes, registry, filenames):

| Old ID | New ID | Category |
|---|---|---|
| `list-generator` | `list-generator` | text-processing |
| `add-text-lines` | `add-text-to-lines` | text-processing |
| `convert-case` | `convert-case` | text-processing |
| `remove-duplicates` | `remove-duplicate-lines` | text-processing |
| `remove-line-breaks` | `remove-line-breaks` | text-processing |
| `remove-lines-containing` | `remove-lines-containing` | text-processing |
| `password-generator` | `password-generator` | generators |
| `username-generator` | `username-generator` | generators |
| `pin-generator` | `pin-generator` | generators |
| `domain-extractor` | `domain-extractor` | extraction |
| `email-extractor` | `email-extractor` | extraction |
| `count-duplicates` | `count-duplicates` | analysis |
| `cert-extractor` | `pem-inspector` | security |
| `password-checker` | `password-strength` | security |
| `qr-generator` | `qr-code` | security |
| `emoji-converter` | `emoji-shortcode` | converters |
| `base64-converter` | `base64` | converters |
| `url-encoder` | `url-encoder` | converters |
| `json-formatter` | `json-formatter` | development |
| `diff-checker` | `diff-checker` | development |
| `regex-tester` | `regex-tester` | development |
| `xml-beautifier` | `xml-beautifier` | development |
| `color-picker` | `color-picker` | utilities |
| `timestamp-converter` | `timestamp-converter` | utilities |
| `time-convert` | `time-convert` | utilities |
| `reg2gpo` | `reg2gpo` | utilities |
| `hash-generator` | `hash-generator` | utilities |

IDs that change: `add-text-lines` → `add-text-to-lines`, `remove-duplicates` → `remove-duplicate-lines`, `cert-extractor` → `pem-inspector`, `password-checker` → `password-strength`, `qr-generator` → `qr-code`, `emoji-converter` → `emoji-shortcode`, `base64-converter` → `base64`.

### QR Code Strategy

The current app uses an external API (`api.qrserver.com`) for QR generation and the `BarcodeDetector` Web API for QR reading (limited browser support: no Firefox, partial Safari).

New approach:
- **QR Generation**: client-side via `qrcode` npm package (lightweight, no external API dependency, works offline)
- **QR Reading**: keep `BarcodeDetector` with feature detection. Show a clear "not supported in this browser" message when unavailable. No polyfill — the native API coverage is expanding and adding a heavy WASM polyfill is not worth it for a utility tool

## i18n — Paraglide.js

- Integration via `@inlang/paraglide-astro` (official Astro adapter)
- Message files in `i18n/messages/{en,it}.json`
- Flat key namespace: `common_*`, `categories_*`, `tools_{toolId}_*`, `errors_*`
- Every key compiles to a typed TS function: `m.tools_jsonFormatter_name()`
- Missing key in any language = compile error
- Emojis removed from locale strings — the `icon` field in `ToolMeta` handles icons. Tool names in i18n are text-only (e.g., `"tools_jsonFormatter_name": "JSON Formatter"`, not `"📄 JSON Formatter"`)
- Language switcher in header, persists choice in localStorage

### i18n Routing

- Uses `@inlang/paraglide-astro` middleware for language detection and routing
- Route pattern: `src/pages/[lang]/tools/[tool].astro` with `getStaticPaths()` generating all combinations
- `getStaticPaths()` iterates `toolRegistry` x `languages` → 27 tools x 2 languages = 54 tool pages + 2 index pages
- Root `/` redirects to `/{detectedLang}/` via Cloudflare `_redirects` or a small index page with JS redirect
- Canonical URLs: `<link rel="canonical">` and `<link rel="alternate" hreflang="...">` for SEO

## Theme System

**Breaking change from current codebase**: the current app uses `data-color-scheme` attribute on `<html>` for theme switching. The new app uses `.dark` CSS class on `<html>` (Tailwind 4 convention). All CSS is rewritten, so no migration of old CSS is needed.

### CSS Tokens (Tailwind 4 `@theme`)

Semantic design tokens defined in `styles/global.css`:

- Light mode: default values in `@theme`
- Dark mode: overrides in `.dark` class on `<html>`
- Tokens: `--color-surface`, `--color-surface-raised`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-accent-hover`, `--color-border`, `--color-success`, `--color-error`, `--color-warning`

### ThemeProvider (Solid)

- `ThemeProvider` wraps islands that need programmatic theme access
- Exposes `theme()` accessor and `toggle()` function via `useTheme()` hook
- Syncs with `<html class="dark">`, localStorage, and `prefers-color-scheme`

### Flash Prevention

Inline script in `<head>` (before any render):
```html
<script is:inline>
  const t = localStorage.getItem('theme')
  const dark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)
  if (dark) document.documentElement.classList.add('dark')
</script>
```

## Command Palette

- Solid island mounted in `BaseLayout`, available on every page
- `Ctrl/Cmd+K` opens modal overlay
- Fuzzy search via `fuse.js` across `toolRegistry` fields (id, keywords) and Paraglide-resolved names/descriptions
- Keyboard navigation: arrow keys to move, Enter to navigate, Esc to close
- `Esc` also closes any open overlay (mobile menu, etc.)
- Renders tool icon, name, category, description per result
- Focus trap while open, `aria-modal="true"`, backdrop click to dismiss

**The Command Palette replaces the sidebar search input and the homepage search input.** The sidebar remains as static navigation (category list with tool links), but has no search field. The homepage catalog is browsable by scrolling; for search, the user opens the Command Palette.

## Navigation

- Standard `<a href>` links — full-page navigation, no client-side router
- Astro `ViewTransitions` for smooth page transitions without full reload
- Sidebar highlights current tool via `Astro.url.pathname` comparison
- Mobile: hamburger menu toggles sidebar, closes on tool selection
- Deep linking works natively (each tool is a real URL)

### Legacy URL Redirect

The current app uses hash-based URLs (`https://domain/#json-formatter`). To avoid breaking existing bookmarks and shared links:

- A small inline script in `BaseLayout` detects `location.hash` on page load
- If a hash matching a known tool ID is found, redirect to the new path:
  ```ts
  // Maps old hash IDs to new paths, including renamed tools
  const hashRedirects: Record<string, string> = {
    'cert-extractor': '/en/tools/pem-inspector',
    'password-checker': '/en/tools/password-strength',
    'qr-generator': '/en/tools/qr-code',
    // ... all 27 tools mapped
  }
  ```
- Redirect uses `window.location.replace()` (no history entry)
- Language detection applied: redirect to `/{userLang}/tools/...` if possible

### Homepage

- Hero section with project title, description, and optional custom logo
- Custom logo: `public/data/logo.png` — loaded with `onerror` fallback (hidden if missing), same as current behavior
- Tool catalog grid below hero, grouped by category
- Each card shows icon, name, description, links to tool page
- Version badge in footer or header (configurable via `config/tools.ts`)

## Deployment

### Cloudflare Pages (Production)

- Astro adapter: `@astrojs/cloudflare` in SSG mode
- Build: `astro build` → static `dist/`
- `_redirects` file for language redirect from `/`
- Zero server-side logic needed

### Local Development

- `astro dev` with hot reload
- All features work identically to production
- Docker optional (nginx serving `dist/` like current setup)

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```

Zero `any`. Zero `as` casts unless proven necessary with a comment explaining why. Zero `@ts-ignore` / `@ts-expect-error`.

**Note on `exactOptionalPropertyTypes`**: this flag can cause friction at library boundaries (Solid.js, Astro). If a third-party type requires it, an `as` cast is permitted with an explanatory comment referencing the upstream type. This is the only accepted exception to the "zero `as` casts" rule.

**Note on `verbatimModuleSyntax`**: requires explicit `import type` for type-only imports. All type imports must use `import type { Foo }` syntax.

## Testing

- **Framework**: Vitest (Vite-native, TS-first, Astro-compatible)
- **Test location**: `tests/tools/` for pure logic unit tests, colocated `*.test.ts` naming
- **Scope**:
  - Every pure logic function in `tools/*.ts` has unit tests (mandatory)
  - Component tests are out of scope for the initial refactor — focus on logic correctness
  - Build smoke test: `astro build` must succeed as part of CI
- **Run command**: `vitest run` (CI), `vitest` (watch mode, dev)
- **Coverage target**: 100% of `tools/*.ts` functions, measured by `vitest --coverage`

## Accessibility

Target: WCAG 2.1 AA (aligns with EAA compliance requirements from CLAUDE.md).

- All interactive elements are keyboard-accessible (Tab, Enter, Space, Esc)
- Focus management: when navigating to a tool page, focus moves to the tool heading
- Command Palette: focus trap while open, Esc to close, `aria-modal="true"`
- Toast notifications: `role="status"`, `aria-live="polite"`
- Form controls: all `<input>`, `<textarea>`, `<select>` have associated `<label>` elements
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (both themes)
- Skip-to-content link in `BaseLayout`
- Language attribute: `<html lang="{currentLang}">` set dynamically per route

## What Gets Deleted

The entire current codebase is replaced:
- `index.html` → `src/pages/` + `src/layouts/` + `src/components/`
- `app.js` (2,687 lines monolith) → `src/tools/` (pure logic) + `src/components/tools/` (UI) + `src/islands/` (cross-page)
- `style.css` → `src/styles/global.css` (tokens) + Tailwind utilities in components
- `locales/*.json` → `src/i18n/messages/*.json` (Paraglide format, type-safe)
- `Dockerfile` / `compose.yaml` → updated for `dist/` output
- `favicon.svg`, `data/`, `README.md`, `CHANGELOG.md` → preserved/updated

## Success Criteria

1. All 27 tools functional with feature parity
2. TypeScript strict: zero errors, zero `any`
3. Paraglide: all strings translated EN/IT, compile-time checked
4. Command palette working with Ctrl/Cmd+K, fuzzy search, keyboard nav
5. Dark/light theme with system preference detection, no flash
6. Builds and deploys on Cloudflare Pages
7. Works locally with `astro dev`
8. Every pure logic function has unit tests
9. Lighthouse score: 95+ across all categories
10. No console.log in production code
