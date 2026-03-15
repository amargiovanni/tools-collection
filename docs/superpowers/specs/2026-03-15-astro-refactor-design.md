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
│   │   └── StatusMessage.tsx
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
│   ├── index.astro          # Homepage with catalog
│   └── tools/
│       ├── json-formatter.astro
│       ├── password-generator.astro
│       └── ...              # One page per tool
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
│   └── clipboard.ts         # Copy-to-clipboard utility
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
| `StatusMessage` | `type: 'success' \| 'error' \| 'warning'`, `message` | User feedback |

All components use `cva` internally for variant management. Props are strictly typed — no `string` where a union applies.

### Error Handling

Consistent `Result<T>` pattern across all pure logic:

```ts
export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
```

- Pure functions return `Result<T>`, never throw
- UI components check `.ok` and render `StatusMessage` on error
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

### Tool Inventory (27 tools)

**Text Processing**: list-generator, add-text-to-lines, convert-case, remove-duplicate-lines, remove-line-breaks, remove-lines-containing

**Generators**: password-generator, username-generator, pin-generator

**Extraction**: domain-extractor, email-extractor

**Analysis**: count-duplicates

**Security**: pem-inspector, password-strength, qr-code

**Converters**: emoji-shortcode, base64, url-encoder

**Development**: json-formatter, diff-checker, regex-tester, xml-beautifier

**Utilities**: color-picker, timestamp-converter, time-convert, reg2gpo, hash-generator

## i18n — Paraglide.js

- Message files in `i18n/messages/{en,it}.json`
- Flat key namespace: `common_*`, `categories_*`, `tools_{toolId}_*`
- Every key compiles to a typed TS function: `m.tools_jsonFormatter_name()`
- Missing key in any language = compile error
- Routing: language prefix (`/en/tools/...`, `/it/tools/...`)
- Automatic redirect from `/` to browser language (fallback: `en`)
- Language switcher in header, persists choice in localStorage

## Theme System

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
- Fuzzy search across `toolRegistry` (id + keywords) and Paraglide names/descriptions
- Keyboard navigation: arrow keys to move, Enter to navigate, Esc to close
- `Esc` also closes any open overlay (mobile menu, etc.)
- Renders tool icon, name, category, description per result

## Navigation

- Standard `<a href>` links — full-page navigation, no client-side router
- Astro `ViewTransitions` for smooth page transitions without full reload
- Sidebar highlights current tool via `Astro.url.pathname` comparison
- Mobile: hamburger menu toggles sidebar, closes on tool selection
- Deep linking works natively (each tool is a real URL)

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
