# Astro Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Tools Collection from a monolithic vanilla JS SPA into a modular Astro + Solid.js + TypeScript strict application with 27 independently-routed tool pages.

**Architecture:** Three-layer separation per tool (pure logic → Solid UI component → Astro page). Shared component library with typed variants. Compile-time i18n via Paraglide.js. CSS design tokens via Tailwind 4 `@theme`. Static output for Cloudflare Pages.

**Tech Stack:** Astro 5, Solid.js, TypeScript (strict), Tailwind CSS 4, Paraglide.js, cva, fuse.js, Vitest, qrcode

**Spec:** `docs/superpowers/specs/2026-03-15-astro-refactor-design.md`

---

## Chunk 1: Project Scaffolding & Core Infrastructure

### Task 1.1: Initialize Astro Project

**Files:**
- Create: `package.json`
- Create: `astro.config.ts`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`

- [ ] **Step 1: Create Astro project in a temp directory and move files**

```bash
cd /Users/andreamargiovanni/dev/tools-collection
npm create astro@latest .astro-temp -- --template minimal --no-install --no-git --typescript strict
```

- [ ] **Step 2: Move Astro scaffold files into project root**

Move `package.json`, `astro.config.ts`, `tsconfig.json`, `src/env.d.ts` from `.astro-temp/` to project root. Remove `.astro-temp/`. Keep existing files (`README.md`, `CHANGELOG.md`, `data/`, `favicon.svg`, `docs/`).

- [ ] **Step 3: Install all dependencies**

```bash
npm install astro @astrojs/solid-js solid-js @tailwindcss/vite class-variance-authority fuse.js
npm install -D typescript vitest @vitest/coverage-v8 tailwindcss
```

Note: `@astrojs/cloudflare` adapter is NOT needed for pure SSG — Astro's default static output works directly on Cloudflare Pages.

Note: Paraglide.js integration TBD — `@inlang/paraglide-astro` may not support Astro 5 yet. If not, use a simpler i18n approach (typed JSON imports with a helper). Check compatibility before installing.

- [ ] **Step 4: Configure `astro.config.ts`**

```ts
import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'static',
  integrations: [solidJs()],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

Start without Cloudflare adapter and Paraglide — add them once the core works.

- [ ] **Step 5: Configure `tsconfig.json` with strict settings**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.astro", "tests/**/*.ts"]
}
```

Note: `exactOptionalPropertyTypes` set to `false` initially to avoid friction with Solid/Astro types. Enable later once components stabilize.

- [ ] **Step 6: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/tools/**/*.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p src/{components/{ui,tools},islands,layouts,tools,pages,config,styles,lib}
mkdir -p src/i18n/messages
mkdir -p tests/tools
mkdir -p public/data
```

Move `favicon.svg` to `public/`. Move `data/.gitkeep` to `public/data/`.

- [ ] **Step 8: Verify project builds**

```bash
npx astro build
```

Expected: clean build, no errors.

- [ ] **Step 9: Create `src/lib/utils.ts` with shared utilities**

`src/lib/utils.ts`:
```ts
/** Converts kebab-case to PascalCase: 'json-formatter' → 'JsonFormatter' */
export function toPascalCase(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}
```

- [ ] **Step 10: Commit**

```bash
git add package.json astro.config.ts tsconfig.json vitest.config.ts src/ public/ .gitignore
git commit -m "chore: initialize Astro project with Solid.js, Tailwind 4, Vitest"
```

Note: Use explicit file list instead of `git add -A` per project conventions.

---

### Task 1.2: Core Library — Result Type, Clipboard, Download

**Files:**
- Create: `src/lib/result.ts`
- Create: `src/lib/clipboard.ts`
- Create: `src/lib/download.ts`
- Create: `tests/lib/result.test.ts`

- [ ] **Step 1: Create Result type**

`src/lib/result.ts`:
```ts
export interface ResultError {
  readonly code: string
  readonly message: string
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ResultError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T = never>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } }
}
```

- [ ] **Step 2: Write Result tests**

`tests/lib/result.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ok, err } from '../../src/lib/result'

describe('Result', () => {
  it('ok wraps a value', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(42)
  })

  it('err wraps an error', () => {
    const r = err('INVALID', 'bad input')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.code).toBe('INVALID')
      expect(r.error.message).toBe('bad input')
    }
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/lib/result.test.ts
```
Expected: PASS

- [ ] **Step 4: Create clipboard utility**

`src/lib/clipboard.ts`:
```ts
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return fallbackCopy(text)
  }
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
```

- [ ] **Step 5: Create download utility**

`src/lib/download.ts`:
```ts
export function downloadFile(
  data: string | Blob,
  filename: string,
  mimeType: string = 'text/plain',
): void {
  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/ tests/lib/
git commit -m "feat: add Result type, clipboard, and download utilities"
```

---

### Task 1.3: Design Tokens & Global Styles

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create global CSS with Tailwind 4 tokens**

`src/styles/global.css`:
```css
@import "tailwindcss";

@theme {
  --color-surface: #faf9f7;
  --color-surface-raised: #ffffff;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-accent: #0d9488;
  --color-accent-hover: #0f766e;
  --color-accent-light: #ccfbf1;
  --color-border: #e2e8f0;
  --color-border-focus: #0d9488;
  --color-success: #16a34a;
  --color-success-light: #dcfce7;
  --color-error: #dc2626;
  --color-error-light: #fee2e2;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --font-sans: 'Inter', 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}

.dark {
  --color-surface: #0f172a;
  --color-surface-raised: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-accent: #2dd4bf;
  --color-accent-hover: #5eead4;
  --color-accent-light: #042f2e;
  --color-border: #334155;
  --color-border-focus: #2dd4bf;
  --color-success: #4ade80;
  --color-success-light: #052e16;
  --color-error: #f87171;
  --color-error-light: #450a0a;
  --color-warning: #fbbf24;
  --color-warning-light: #451a03;
}

html {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
}

::selection {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

*:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Verify Tailwind processes the CSS**

Create a minimal `src/pages/index.astro` that imports `global.css`, run `npx astro dev`, check output.

- [ ] **Step 3: Commit**

```bash
git add src/styles/ src/pages/
git commit -m "feat: add Tailwind 4 design tokens and global styles"
```

---

### Task 1.4: Theme System

**Files:**
- Create: `src/lib/theme.tsx`

- [ ] **Step 1: Create ThemeProvider and useTheme**

`src/lib/theme.tsx`:
```tsx
import { createContext, createSignal, useContext, onMount, type ParentProps } from 'solid-js'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: () => Theme
  resolved: () => ResolvedTheme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>()

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider(props: ParentProps) {
  const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) as Theme | null
  const [theme, setThemeSignal] = createSignal<Theme>(stored ?? 'system')
  const [resolved, setResolved] = createSignal<ResolvedTheme>(
    stored === 'light' || stored === 'dark' ? stored : getSystemTheme()
  )

  function setTheme(t: Theme) {
    setThemeSignal(t)
    const r = t === 'system' ? getSystemTheme() : t
    setResolved(r)
    applyTheme(r)
    localStorage.setItem('theme', t)
  }

  function toggle() {
    setTheme(resolved() === 'dark' ? 'light' : 'dark')
  }

  onMount(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', () => {
      if (theme() === 'system') {
        const r = getSystemTheme()
        setResolved(r)
        applyTheme(r)
      }
    })
  })

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/theme.tsx
git commit -m "feat: add ThemeProvider with system preference detection"
```

---

### Task 1.5: Tool Registry

**Files:**
- Create: `src/config/tools.ts`
- Create: `tests/config/tools.test.ts`

- [ ] **Step 1: Create tool registry with all 27 tools**

`src/config/tools.ts` — define the `categories` const array, `Category` type, `ToolMeta` interface, and the full `toolRegistry` array with all 27 tools (id, category, icon, keywords, path). Export `getToolMeta()`, `getToolsByCategory()`.

Note: `searchTools()` from the spec is NOT implemented here — fuzzy search is handled entirely by fuse.js inside the CommandPalette island (Task 6.1). The registry provides the raw data; fuse.js provides the search.

Icons per tool:
- list-generator: `📋`, add-text-to-lines: `✏️`, convert-case: `🔠`, remove-duplicate-lines: `❌`, remove-line-breaks: `📏`, remove-lines-containing: `🚫`
- password-generator: `🔑`, username-generator: `👤`, pin-generator: `🔢`
- domain-extractor: `🌐`, email-extractor: `📧`
- count-duplicates: `🔢`
- pem-inspector: `📜`, password-strength: `🔒`, qr-code: `📱`
- emoji-shortcode: `😎`, base64: `🔐`, url-encoder: `🔗`
- json-formatter: `📄`, diff-checker: `🔍`, regex-tester: `🔤`, xml-beautifier: `📋`
- color-picker: `🎨`, timestamp-converter: `🕐`, time-convert: `⏱️`, reg2gpo: `🧩`, hash-generator: `🔏`

- [ ] **Step 2: Write tests for registry helpers**

`tests/config/tools.test.ts`: test `getToolMeta` returns correct tool, returns undefined for unknown ID, `getToolsByCategory` returns correct tools, all 27 tools have unique IDs, all paths start with `/tools/`.

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/config/tools.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/config/ tests/config/
git commit -m "feat: add tool registry with 27 tools and metadata"
```

---

### Task 1.6: i18n Setup

**Files:**
- Create: `src/i18n/messages/en.json`
- Create: `src/i18n/messages/it.json`
- Create: `src/i18n/index.ts`

- [ ] **Step 1: Create i18n helper with typed keys**

Since Paraglide.js + Astro 5 compatibility may be uncertain, implement a lightweight type-safe alternative:

`src/i18n/index.ts`:
```ts
import en from './messages/en.json'
import it from './messages/it.json'

export const languages = ['en', 'it'] as const
export type Language = typeof languages[number]
export const defaultLanguage: Language = 'en'

type Messages = typeof en
export type MessageKey = keyof Messages

const messages: Record<Language, Messages> = { en, it }

export function t(lang: Language, key: MessageKey): string {
  return messages[lang][key]
}

export function getLanguageFromPath(path: string): Language {
  const match = path.match(/^\/(en|it)\//)
  return match?.[1] as Language ?? defaultLanguage
}
```

This gives us:
- Compile-time key validation (typo = TS error)
- Missing key in IT = TS error (both JSONs must have identical keys via `Messages` type)
- Zero runtime overhead
- Can swap to Paraglide later without changing call sites

- [ ] **Step 2: Create English message file**

`src/i18n/messages/en.json` — Migrate all 321 keys from current `locales/en.json` to new namespace format:

```
app_* → from app.* (7 keys, remove emoji from title)
home_* → from home.* (6 keys)
categories_* → from sidebar.* (8 keys)
common_* → from common.* (6 keys) + messages.* (2 keys)
tools_{toolId}_* → from {toolNamespace}.* (per tool, remove emojis from titles)
```

All `nav.*` keys become the `tools_{toolId}_name` keys (without emoji prefix).

- [ ] **Step 3: Create Italian message file**

`src/i18n/messages/it.json` — Same structure as en.json, values from current `locales/it.json`.

- [ ] **Step 4: Write i18n helper tests**

`tests/i18n/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { t, getLanguageFromPath, languages, defaultLanguage } from '../../src/i18n'

describe('i18n', () => {
  it('t returns English string', () => {
    expect(t('en', 'app_title')).toBeTruthy()
  })
  it('t returns Italian string', () => {
    expect(t('it', 'app_title')).toBeTruthy()
  })
  it('getLanguageFromPath extracts en', () => {
    expect(getLanguageFromPath('/en/tools/json-formatter')).toBe('en')
  })
  it('getLanguageFromPath extracts it', () => {
    expect(getLanguageFromPath('/it/')).toBe('it')
  })
  it('getLanguageFromPath defaults to en', () => {
    expect(getLanguageFromPath('/')).toBe(defaultLanguage)
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/i18n/
```
Expected: PASS

- [ ] **Step 6: Verify TypeScript catches missing keys**

Add a test key to en.json but not it.json. Run `npx tsc --noEmit`. Expect error. Fix by adding the key to it.json.

Note on spec deviation: The spec references Paraglide.js compiled functions (`m.tools_jsonFormatter_name()`). This plan uses `t(lang, 'tools_jsonFormatter_name')` instead — same type safety, different API surface. If Paraglide.js becomes compatible with Astro 5, the migration is straightforward: replace `t(lang, key)` calls with `m.key()` and remove `src/i18n/index.ts`. The message JSON format is compatible.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ tests/i18n/
git commit -m "feat: add type-safe i18n with EN/IT translations"
```

---

## Chunk 2: Component Library

### Task 2.1: Button, StatusMessage, Badge, Card

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/StatusMessage.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Card.tsx`

- [ ] **Step 1: Create Button component**

`src/components/ui/Button.tsx` using `cva` for variants:
- Variants: `primary` (accent bg), `secondary` (border), `ghost` (transparent)
- Sizes: `sm`, `md`
- Props: `variant`, `size`, `disabled`, `class`, `onClick`, `children`, `type`
- All props typed, no `any`

- [ ] **Step 2: Create StatusMessage component**

`src/components/ui/StatusMessage.tsx`:
- Types: `success`, `error`, `warning`
- Accessible: `role="alert"` for errors, `role="status"` for success/warning
- Dismissible via close button

- [ ] **Step 3: Create Badge component**

`src/components/ui/Badge.tsx`:
- Variants: `info`, `success`, `error`
- Small inline element

- [ ] **Step 4: Create Card component**

`src/components/ui/Card.tsx`:
- Props: `title: string`, `description: string`, `icon: string`, `href: string`
- Renders as an `<a>` wrapping a card layout (icon + title + description)
- Hover state with accent border
- Used by HomeCatalog for the tool grid

- [ ] **Step 5: Verify components render**

Create a temporary test page `src/pages/test-ui.astro` that imports and renders all 4 components. Run `npx astro dev` and check. Delete the test page after.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Button, StatusMessage, Badge, Card components"
```

---

### Task 2.2: TextArea, Input, Select, Checkbox

**Files:**
- Create: `src/components/ui/TextArea.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Checkbox.tsx`

- [ ] **Step 1: Create TextArea component**

Props: `label`, `placeholder`, `rows`, `readonly`, `value`, `onInput`, `id`, `class`, `monospace` (boolean for code-like content). Auto-generates `id` if not provided. Label associated via `for`.

- [ ] **Step 2: Create Input component**

Props: `type` (`'text' | 'number' | 'password'`), `label`, `placeholder`, `value`, `onInput`, `min`, `max`, `step`, `id`. Same label pattern.

- [ ] **Step 3: Create Select component**

```ts
interface Option {
  value: string
  label: string
}
```
Props: `options: Option[]`, `label`, `value`, `onChange`, `id`.

- [ ] **Step 4: Create Checkbox component**

Props: `label`, `checked`, `onChange`, `id`.

- [ ] **Step 5: Verify all form components render**

Add components to the test page from Task 2.1 Step 5. Run `npx astro dev` and verify.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add TextArea, Input, Select, Checkbox components"
```

---

### Task 2.3: CopyButton, OutputPanel, FileInput, DownloadButton

**Files:**
- Create: `src/components/ui/CopyButton.tsx`
- Create: `src/components/ui/OutputPanel.tsx`
- Create: `src/components/ui/FileInput.tsx`
- Create: `src/components/ui/DownloadButton.tsx`

- [ ] **Step 1: Create CopyButton**

Uses `copyToClipboard` from `src/lib/clipboard.ts`. Shows transient "Copied!" state (1.5s). Props: `getValue: () => string`.

- [ ] **Step 2: Create OutputPanel**

Wraps a `TextArea` (readonly) with optional `CopyButton`. Props: `value`, `label`, `copyable` (default true), `monospace` (default true), `rows`.

- [ ] **Step 3: Create FileInput**

Styled file input with drag-and-drop zone. Props: `accept`, `label`, `onFile: (file: File) => void`. Shows filename after selection.

- [ ] **Step 4: Create DownloadButton**

Extends Button. Props: `getData: () => string | Blob`, `filename`, `mimeType`. Uses `downloadFile` from `src/lib/download.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add CopyButton, OutputPanel, FileInput, DownloadButton"
```

---

### Task 2.4: Toast System

**Files:**
- Create: `src/lib/toast.tsx`
- Create: `src/components/ui/Toast.tsx`

- [ ] **Step 1: Create ToastProvider context**

`src/lib/toast.tsx`:
- `ToastProvider` wraps app, provides `show(message, type)` function
- `useToast()` hook to access from any island
- Auto-dismiss after 3s
- Queue of toasts, max 3 visible
- Types: `success`, `error`, `info`

- [ ] **Step 2: Create Toast display component**

`src/components/ui/Toast.tsx`:
- Renders in fixed bottom-right corner
- `role="status"`, `aria-live="polite"`
- Slide-in/fade-out animation via Tailwind transitions
- Each toast has type-based color

- [ ] **Step 3: Commit**

```bash
git add src/lib/toast.tsx src/components/ui/Toast.tsx
git commit -m "feat: add toast notification system"
```

---

## Chunk 3: Layouts, Navigation & Pages

### Task 3.1: BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create BaseLayout**

`src/layouts/BaseLayout.astro`:
- HTML head: charset, viewport, title (from props), favicon, global.css import
- `<html lang={lang}>` from props
- `<link rel="canonical" href={canonicalUrl}>` — full URL for current page
- `<link rel="alternate" hreflang="en" href={enUrl}>` and `hreflang="it"` for SEO
- Theme flash prevention inline script (before any render)
- Legacy hash redirect inline script
- `ViewTransitions` from `astro:transitions` — note: test with Solid islands to verify hydration on back-navigation works
- Skip-to-content link: `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>`
- Slot for body content

- [ ] **Step 2: Commit**

```bash
git add src/layouts/
git commit -m "feat: add BaseLayout with theme init and legacy redirects"
```

---

### Task 3.2: Sidebar & ToolLayout

**Files:**
- Create: `src/components/Sidebar.astro`
- Create: `src/layouts/ToolLayout.astro`

- [ ] **Step 1: Create Sidebar component**

`src/components/Sidebar.astro`:
- Iterates `categories` and `getToolsByCategory()` from registry
- Renders `<nav>` with category headings and tool links
- Highlights current tool via `Astro.url.pathname` comparison
- Mobile-responsive: hidden by default on mobile, toggled via JS

- [ ] **Step 2: Create ToolLayout**

`src/layouts/ToolLayout.astro`:
- Extends `BaseLayout`
- Two-column grid: sidebar (280px) + main content
- Header bar with: home link, tool title, ThemeToggle island, LanguageSwitcher island
- `<main id="main-content">` with slot for tool component
- **Focus management**: tool heading (`<h1>`) has `tabindex="-1"` and receives focus on page load via a small inline script. This satisfies WCAG focus management on navigation.
- Mobile hamburger menu button
- CommandPalette island (loaded `client:idle`)

**Provider composition note**: Each Solid island is independent (Astro islands don't share a single component tree). ThemeProvider and ToastProvider must be wrapped INSIDE each island that needs them, not at the layout level. Create wrapper components if needed:
- `src/islands/ThemeToggle.tsx` wraps itself in `ThemeProvider`
- Tool components that need toast wrap themselves in `ToastProvider`
- Alternatively, use a shared `ToolIslandWrapper.tsx` that composes both providers around a slot

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.astro src/layouts/ToolLayout.astro
git commit -m "feat: add Sidebar and ToolLayout with responsive grid"
```

---

### Task 3.3: Theme Toggle & Language Switcher Islands

**Files:**
- Create: `src/islands/ThemeToggle.tsx`
- Create: `src/islands/LanguageSwitcher.tsx`

- [ ] **Step 1: Create ThemeToggle**

Simple button that calls `useTheme().toggle()`. Shows sun/moon icon based on resolved theme.

- [ ] **Step 2: Create LanguageSwitcher**

Button/dropdown that switches between EN/IT. Changes URL prefix (`/en/...` ↔ `/it/...`). Persists to localStorage.

- [ ] **Step 3: Commit**

```bash
git add src/islands/
git commit -m "feat: add ThemeToggle and LanguageSwitcher islands"
```

---

### Task 3.4: Homepage

**Files:**
- Create: `src/components/HomeCatalog.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/[lang]/index.astro`

- [ ] **Step 1: Create HomeCatalog**

`src/components/HomeCatalog.astro`:
- Hero section with title, description, optional logo (`/data/logo.png` with onerror fallback)
- Tool grid grouped by category
- Each tool as a `Card` component (link to tool page)
- Category accent colors via CSS variable cycling

- [ ] **Step 2: Create root index page with redirect**

`src/pages/index.astro`: Redirects to `/{detectedLang}/` using a meta refresh + JS redirect.

- [ ] **Step 3: Create language-specific homepage**

`src/pages/[lang]/index.astro` with `getStaticPaths` returning `['en', 'it']`. Renders `BaseLayout` + `HomeCatalog`.

- [ ] **Step 4: Verify homepage renders**

```bash
npx astro dev
```
Check `http://localhost:4321/en/` and `http://localhost:4321/it/`.

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeCatalog.astro src/pages/
git commit -m "feat: add homepage with tool catalog and language routing"
```

---

### Task 3.5: Dynamic Tool Page Route

**Files:**
- Create: `src/pages/[lang]/tools/[tool].astro`

- [ ] **Step 1: Create dynamic tool page**

`src/pages/[lang]/tools/[tool].astro`:
```astro
---
import type { GetStaticPaths } from 'astro'
import ToolLayout from '../../../layouts/ToolLayout.astro'
import { toolRegistry } from '../../../config/tools'
import { languages } from '../../../i18n'
import { toPascalCase } from '../../../lib/utils'

export const getStaticPaths: GetStaticPaths = () => {
  return languages.flatMap(lang =>
    toolRegistry.map(tool => ({
      params: { lang, tool: tool.id },
      props: { tool, lang },
    }))
  )
}

const { tool, lang } = Astro.props
// Dynamic component import based on tool.id
// Path is relative to THIS file at src/pages/[lang]/tools/[tool].astro
const components = import.meta.glob('../../../components/tools/*.tsx', { eager: true })
const componentPath = `../../../components/tools/${toPascalCase(tool.id)}.tsx`
const ToolComponent = (components[componentPath] as { default: any })?.default
---
<ToolLayout tool={tool} lang={lang}>
  {ToolComponent ? <ToolComponent client:load lang={lang} /> : <p>Tool not found</p>}
</ToolLayout>
```

Note: The `as { default: any }` cast is required because `import.meta.glob` returns `Record<string, unknown>`. This is an accepted library-boundary exception per the TS rules.

- [ ] **Step 2: Create a placeholder tool component for testing**

Create `src/components/tools/JsonFormatter.tsx` as a minimal placeholder (will be replaced by the real implementation in Task 5.5):
```tsx
export default function JsonFormatter() {
  return <div>JSON Formatter — coming soon</div>
}
```

- [ ] **Step 3: Verify the dynamic route works**

```bash
npx astro dev
```
Visit `http://localhost:4321/en/tools/json-formatter`. Expect to see the placeholder.

- [ ] **Step 4: Commit**

```bash
git add src/pages/[lang]/tools/ src/components/tools/JsonFormatter.tsx
git commit -m "feat: add dynamic tool page routing with getStaticPaths"
```

---

## Chunk 4: Tool Pure Logic + Tests (All 27)

Each tool follows TDD: write failing test → implement → verify pass → commit.

Tools are grouped by category. Each task covers the pure logic functions in `src/tools/` and their tests in `tests/tools/`.

**Pattern for every tool:**
1. Create `tests/tools/{tool-id}.test.ts` with test cases
2. Run test → expect fail
3. Create `src/tools/{tool-id}.ts` with pure function(s) returning `Result<T>`
4. Run test → expect pass
5. Commit

---

### Task 4.1: Text Processing Tools (6 tools)

**Files:**
- Create: `src/tools/list-generator.ts` + `tests/tools/list-generator.test.ts`
- Create: `src/tools/add-text-to-lines.ts` + `tests/tools/add-text-to-lines.test.ts`
- Create: `src/tools/convert-case.ts` + `tests/tools/convert-case.test.ts`
- Create: `src/tools/remove-duplicate-lines.ts` + `tests/tools/remove-duplicate-lines.test.ts`
- Create: `src/tools/remove-line-breaks.ts` + `tests/tools/remove-line-breaks.test.ts`
- Create: `src/tools/remove-lines-containing.ts` + `tests/tools/remove-lines-containing.test.ts`

**Tool signatures:**

```ts
// list-generator.ts
type ListFormat = 'numbered' | 'bulleted' | 'comma' | 'pipe'
function generateList(input: string, format: ListFormat): Result<string>

// add-text-to-lines.ts
type Position = 'start' | 'end'
function addTextToLines(input: string, addition: string, position: Position): Result<string>

// convert-case.ts
type CaseType = 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'constant'
function convertCase(input: string, caseType: CaseType): Result<string>

// remove-duplicate-lines.ts
interface DeduplicateOptions { caseSensitive: boolean; preserveOrder: boolean }
function removeDuplicateLines(input: string, options: DeduplicateOptions): Result<string>

// remove-line-breaks.ts
type BreakReplacement = 'space' | 'none' | { custom: string }
function removeLineBreaks(input: string, replacement: BreakReplacement): Result<string>

// remove-lines-containing.ts
interface FilterOptions { terms: string[]; caseSensitive: boolean }
interface FilterResult { output: string; removed: number; kept: number }
function removeLinesContaining(input: string, options: FilterOptions): Result<FilterResult>
```

- [ ] **Step 1: Write tests for all 6 text processing tools**

Cover: empty input, single line, multiline, edge cases per tool (e.g., case: unicode, duplicates: case sensitivity, breaks: custom separator).

- [ ] **Step 2: Run tests → expect all fail**

```bash
npx vitest run tests/tools/list-generator.test.ts tests/tools/add-text-to-lines.test.ts tests/tools/convert-case.test.ts tests/tools/remove-duplicate-lines.test.ts tests/tools/remove-line-breaks.test.ts tests/tools/remove-lines-containing.test.ts
```

- [ ] **Step 3: Implement all 6 pure logic functions**

Extract logic from current `app.js` methods: `initListGenerator` (line 909), `initAddTextToLines` (line 1173), `initConvertCase` (line 1211), `initRemoveDuplicates` (line 1343), `initRemoveLineBreaks` (line 1380), `initRemoveLinesContaining` (line 1406).

Wrap each in `Result<T>` return type. Validate empty input → `err('EMPTY_INPUT', ...)`.

- [ ] **Step 4: Run tests → expect all pass**

- [ ] **Step 5: Commit**

```bash
git add src/tools/ tests/tools/
git commit -m "feat: add text processing pure logic with tests (6 tools)"
```

---

### Task 4.2: Generator Tools (3 tools)

**Files:**
- Create: `src/tools/password-generator.ts` + `tests/tools/password-generator.test.ts`
- Create: `src/tools/username-generator.ts` + `tests/tools/username-generator.test.ts`
- Create: `src/tools/pin-generator.ts` + `tests/tools/pin-generator.test.ts`

**Tool signatures:**

```ts
// password-generator.ts
interface PasswordOptions {
  length: number
  count: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}
function generatePasswords(options: PasswordOptions): Result<string[]>
// Uses crypto.getRandomValues()

// username-generator.ts
type UsernameStyle = 'random' | 'tech' | 'fantasy' | 'cool'
function generateUsernames(style: UsernameStyle, count: number): Result<string[]>
// Word lists hardcoded, Math.random() for non-security

// pin-generator.ts
interface PinOptions { length: number; count: number; unique: boolean }
function generatePins(options: PinOptions): Result<string[]>
// Uses crypto.getRandomValues()
```

- [ ] **Step 1: Write tests**

Password: test charset filtering, length constraints, count, at least one of each selected charset. Pin: uniqueness constraint, length clamping. Username: each style produces expected format.

- [ ] **Step 2: Run tests → expect fail**

- [ ] **Step 3: Implement from `app.js` lines 951-1170**

- [ ] **Step 4: Run tests → expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/tools/password-generator.ts src/tools/username-generator.ts src/tools/pin-generator.ts tests/tools/password-generator.test.ts tests/tools/username-generator.test.ts tests/tools/pin-generator.test.ts
git commit -m "feat: add generator pure logic with tests (3 tools)"
```

---

### Task 4.3: Extraction & Analysis Tools (3 tools)

**Files:**
- Create: `src/tools/domain-extractor.ts` + test
- Create: `src/tools/email-extractor.ts` + test
- Create: `src/tools/count-duplicates.ts` + test

**Signatures:**

```ts
// domain-extractor.ts
function extractDomains(input: string, includeSubdomains: boolean): Result<string[]>

// email-extractor.ts
function extractEmails(input: string, removeDuplicates: boolean): Result<string[]>

// count-duplicates.ts
interface DuplicateEntry { value: string; count: number; percentage: number }
interface CountOptions { caseSensitive: boolean; sortByCount: boolean }
function countDuplicates(input: string, options: CountOptions): Result<DuplicateEntry[]>
```

- [ ] **Step 1-5: TDD cycle** (same as previous tasks)

- [ ] **Step 6: Commit**

```bash
git add src/tools/domain-extractor.ts src/tools/email-extractor.ts src/tools/count-duplicates.ts tests/tools/
git commit -m "feat: add extraction and analysis pure logic with tests (3 tools)"
```

---

### Task 4.4: Security Tools (3 tools)

**Files:**
- Create: `src/tools/pem-inspector.ts` + test
- Create: `src/tools/password-strength.ts` + test
- Create: `src/tools/qr-code.ts` + test

**Signatures:**

```ts
// pem-inspector.ts
interface CertInfo { fingerprint: string; derHex: string }
function inspectPem(pem: string): Promise<Result<CertInfo>>
// Async: uses crypto.subtle.digest

// password-strength.ts
interface StrengthResult {
  score: number          // 0-8
  level: 'weak' | 'medium' | 'strong'
  checks: { name: string; passed: boolean }[]
  suggestions: string[]
}
function checkPasswordStrength(password: string): Result<StrengthResult>

// qr-code.ts — generation only (reading is browser API, handled in UI)
// Uses 'qrcode' npm package
function generateQrDataUrl(text: string, size: number): Promise<Result<string>>
```

Note: `pem-inspector` and `qr-code` are async (crypto and canvas APIs). Tests will need `vi.mock` or run in a jsdom/happy-dom environment for Web Crypto. Alternatively, test the pure parsing logic only and mark async crypto calls as integration tests.

- [ ] **Step 1-5: TDD cycle**

For password-strength: test all scoring rules (length thresholds, charset checks, pattern penalties). For pem-inspector: test PEM format validation (the async crypto part can be tested with a known fixture).

- [ ] **Step 6: Commit**

```bash
git add src/tools/pem-inspector.ts src/tools/password-strength.ts src/tools/qr-code.ts tests/tools/
git commit -m "feat: add security pure logic with tests (3 tools)"
```

---

### Task 4.5: Converter Tools (3 tools)

**Files:**
- Create: `src/tools/emoji-shortcode.ts` + test
- Create: `src/tools/base64.ts` + test
- Create: `src/tools/url-encoder.ts` + test

**Signatures:**

```ts
// emoji-shortcode.ts
function toEmoji(input: string): Result<string>
function toShortcode(input: string): Result<string>

// base64.ts
function encodeBase64(input: string): Result<string>
function decodeBase64(input: string): Result<string>

// url-encoder.ts
type UrlEncodeMode = 'full' | 'component'
function encodeUrl(input: string, mode: UrlEncodeMode): Result<string>
function decodeUrl(input: string, mode: UrlEncodeMode): Result<string>
```

- [ ] **Step 1-5: TDD cycle**

Test: UTF-8 handling in base64, special chars in URL encoding, bidirectional emoji conversion.

- [ ] **Step 6: Commit**

```bash
git add src/tools/emoji-shortcode.ts src/tools/base64.ts src/tools/url-encoder.ts tests/tools/
git commit -m "feat: add converter pure logic with tests (3 tools)"
```

---

### Task 4.6: Development Tools (4 tools)

**Files:**
- Create: `src/tools/json-formatter.ts` + test
- Create: `src/tools/diff-checker.ts` + test
- Create: `src/tools/regex-tester.ts` + test
- Create: `src/tools/xml-beautifier.ts` + test

**Signatures:**

```ts
// json-formatter.ts
type JsonIndent = 2 | 4 | 'tab' | 'compact'
function formatJson(input: string, indent: JsonIndent): Result<string>
function validateJson(input: string): Result<boolean>

// diff-checker.ts
interface DiffOptions { ignoreCase: boolean; ignoreWhitespace: boolean }
interface DiffLine { type: 'unchanged' | 'added' | 'deleted'; content: string; lineNumber: number }
interface DiffResult { lines: DiffLine[]; additions: number; deletions: number; unchanged: number }
function computeDiff(left: string, right: string, options: DiffOptions): Result<DiffResult>

// regex-tester.ts
interface RegexMatch { fullMatch: string; index: number; groups: string[] }
interface RegexFlags { global: boolean; caseInsensitive: boolean; multiline: boolean }
function testRegex(pattern: string, text: string, flags: RegexFlags): Result<RegexMatch[]>

// xml-beautifier.ts
type XmlIndent = 2 | 4 | 'tab'
function formatXml(input: string, indent: XmlIndent): Result<string>
function validateXml(input: string): Result<boolean>
```

Note: `xml-beautifier` uses `DOMParser` which requires a DOM environment. The formatting algorithm itself is string-based and testable; the validation part needs `DOMParser`. Use `happy-dom` Vitest environment or split validation into a separate function tested differently.

- [ ] **Step 1-5: TDD cycle**

JSON: test valid/invalid input, all indent options, nested objects. Diff: test identical, additions, deletions, mixed, ignore options. Regex: test flags, capture groups, invalid pattern error. XML: test formatting, validation.

- [ ] **Step 6: Commit**

```bash
git add src/tools/json-formatter.ts src/tools/diff-checker.ts src/tools/regex-tester.ts src/tools/xml-beautifier.ts tests/tools/
git commit -m "feat: add development tool pure logic with tests (4 tools)"
```

---

### Task 4.7: Utility Tools (5 tools)

**Files:**
- Create: `src/tools/color-picker.ts` + test
- Create: `src/tools/timestamp-converter.ts` + test
- Create: `src/tools/time-convert.ts` + test
- Create: `src/tools/reg2gpo.ts` + test
- Create: `src/tools/hash-generator.ts` + test

**Signatures:**

```ts
// color-picker.ts
interface RgbColor { r: number; g: number; b: number }
interface HslColor { h: number; s: number; l: number }
function hexToRgb(hex: string): Result<RgbColor>
function rgbToHex(rgb: RgbColor): Result<string>
function rgbToHsl(rgb: RgbColor): Result<HslColor>
function parseColor(input: string): Result<{ hex: string; rgb: RgbColor; hsl: HslColor }>

// timestamp-converter.ts
interface TimestampResult {
  seconds: number; milliseconds: number
  iso: string; utc: string; locale: string
}
function convertTimestamp(input: number): Result<TimestampResult>
function currentTimestamp(): number

// time-convert.ts
type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd'
interface TimeConvertResult { [key in TimeUnit]: number } & { formatted: string }
function convertTime(value: number, fromUnit: TimeUnit): Result<TimeConvertResult>

// reg2gpo.ts
interface GpoResult { xml: string; entriesCount: number }
function convertRegToGpo(regContent: string): Result<GpoResult>
// Complex: hive mapping, hex decoding, XML generation

// hash-generator.ts
interface HashResult { sha1: string; sha256: string; sha512: string }
function generateHashes(input: string): Promise<Result<HashResult>>
// Async: uses crypto.subtle.digest
```

- [ ] **Step 1-5: TDD cycle**

Color: hex parsing, RGB→HSL math, edge cases (black, white, pure red). Timestamp: auto-detect seconds vs milliseconds. Time: unit conversions, formatted duration. Reg2GPO: sample .reg input → expected XML output. Hash: known input → known hash values.

- [ ] **Step 6: Commit**

```bash
git add src/tools/color-picker.ts src/tools/timestamp-converter.ts src/tools/time-convert.ts src/tools/reg2gpo.ts src/tools/hash-generator.ts tests/tools/
git commit -m "feat: add utility pure logic with tests (5 tools)"
```

---

### Task 4.8: Run Full Test Suite

- [ ] **Step 1: Run all tests with coverage**

```bash
npx vitest run --coverage
```

Expected: all pass, 100% coverage of `src/tools/`.

- [ ] **Step 2: Fix any failures**

- [ ] **Step 3: Commit if any fixes were needed**

---

## Chunk 5: Tool UI Components (All 27)

Each tool UI component follows the same pattern:
1. Import pure logic from `src/tools/`
2. Import UI components from `src/components/ui/`
3. Import i18n strings
4. Use Solid signals for state
5. Compose UI from shared components

Tools are grouped by complexity. Simple tools (text-in → text-out) are batched; complex tools (multiple inputs, async, file upload) get individual attention.

---

### Task 5.1: Simple Text Tools UI (6 tools)

**Files:**
- Create: `src/components/tools/ListGenerator.tsx`
- Create: `src/components/tools/AddTextToLines.tsx`
- Create: `src/components/tools/ConvertCase.tsx`
- Create: `src/components/tools/RemoveDuplicateLines.tsx`
- Create: `src/components/tools/RemoveLineBreaks.tsx`
- Create: `src/components/tools/RemoveLinesContaining.tsx`

All follow this pattern:

```tsx
import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { toolFunction } from '../../tools/{tool-id}'
import { t } from '../../i18n'

interface Props { lang: Language }

export default function ToolName(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  // Tool-specific options as signals

  const handleAction = () => {
    const result = toolFunction(input(), ...options)
    if (result.ok) { setOutput(result.value); setError(null) }
    else { setError(result.error.message) }
  }

  return (/* TextArea + options + Button + OutputPanel */)
}
```

- [ ] **Step 1: Implement ListGenerator UI**

TextArea input → format Select (numbered/bulleted/comma/pipe) → Button → OutputPanel

- [ ] **Step 2: Implement AddTextToLines UI**

TextArea input + Input (text to add) + radio (start/end) → real-time OutputPanel

- [ ] **Step 3: Implement ConvertCase UI**

TextArea input → Select (case types) → Button → OutputPanel

- [ ] **Step 4: Implement RemoveDuplicateLines UI**

TextArea input + Checkbox (case sensitive) + Checkbox (preserve order) → Button → OutputPanel

- [ ] **Step 5: Implement RemoveLineBreaks UI**

TextArea input + Select (space/none/custom) + conditional Input → Button → OutputPanel

- [ ] **Step 6: Implement RemoveLinesContaining UI**

TextArea input + Input (terms) + Checkbox (case sensitive) → Button → OutputPanel + stats Badge

- [ ] **Step 7: Verify all 6 render correctly**

```bash
npx astro dev
```
Navigate to each tool page.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat: add text processing tool UI components (6 tools)"
```

---

### Task 5.2: Generator Tools UI (3 tools)

**Files:**
- Create: `src/components/tools/PasswordGenerator.tsx`
- Create: `src/components/tools/UsernameGenerator.tsx`
- Create: `src/components/tools/PinGenerator.tsx`

- [ ] **Step 1: PasswordGenerator UI**

Input (length range slider) + Input (count) + 4x Checkbox (charsets) → Button → OutputPanel with each password on a line, individual CopyButton per password.

- [ ] **Step 2: UsernameGenerator UI**

Select (style) + Input (count) → Button → OutputPanel

- [ ] **Step 3: PinGenerator UI**

Input (length, 3-12) + Input (count, 1-50) + Checkbox (unique) → Button → OutputPanel

- [ ] **Step 4: Verify all 3 render and function**

`npx astro dev` → visit each generator tool page, enter test input, verify output.

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/PasswordGenerator.tsx src/components/tools/UsernameGenerator.tsx src/components/tools/PinGenerator.tsx
git commit -m "feat: add generator tool UI components (3 tools)"
```

---

### Task 5.3: Extraction, Analysis & Security Tools UI (6 tools)

**Files:**
- Create: `src/components/tools/DomainExtractor.tsx`
- Create: `src/components/tools/EmailExtractor.tsx`
- Create: `src/components/tools/CountDuplicates.tsx`
- Create: `src/components/tools/PemInspector.tsx`
- Create: `src/components/tools/PasswordStrength.tsx`
- Create: `src/components/tools/QrCode.tsx`

- [ ] **Step 1: DomainExtractor UI**

TextArea + Checkbox (include subdomains) → Button → OutputPanel

- [ ] **Step 2: EmailExtractor UI**

TextArea + Checkbox (remove duplicates) → Button → OutputPanel

- [ ] **Step 3: CountDuplicates UI**

TextArea + Checkbox (case sensitive) + Checkbox (sort by count) → Button → results table with value/count/percentage

- [ ] **Step 4: PemInspector UI**

TextArea (paste PEM) → Button (async) → result cards showing fingerprint, DER hex

- [ ] **Step 5: PasswordStrength UI**

Input (password, with show/hide toggle) → real-time strength display: score bar, level badge, checks list (✓/✗), suggestions

- [ ] **Step 6: QrCode UI**

TextArea (text to encode) + Select (size) → Button → generated QR image + DownloadButton.
FileInput for QR reading → result display. Feature detection for BarcodeDetector.

Install `qrcode` package:
```bash
npm install qrcode @types/qrcode
```

- [ ] **Step 7: Verify all 6 render and function**

`npx astro dev` → visit each tool page, test with sample data.

- [ ] **Step 8: Commit**

```bash
git add src/components/tools/DomainExtractor.tsx src/components/tools/EmailExtractor.tsx src/components/tools/CountDuplicates.tsx src/components/tools/PemInspector.tsx src/components/tools/PasswordStrength.tsx src/components/tools/QrCode.tsx
git commit -m "feat: add extraction, analysis, security tool UI (6 tools)"
```

---

### Task 5.4: Converter Tools UI (3 tools)

**Files:**
- Create: `src/components/tools/EmojiShortcode.tsx`
- Create: `src/components/tools/Base64.tsx`
- Create: `src/components/tools/UrlEncoder.tsx`

- [ ] **Step 1: EmojiShortcode UI**

TextArea + two buttons (To Emoji / To Shortcode) → OutputPanel

- [ ] **Step 2: Base64 UI**

TextArea + two buttons (Encode / Decode) → OutputPanel

- [ ] **Step 3: UrlEncoder UI**

TextArea + Select (mode: full/component) + two buttons (Encode / Decode) → OutputPanel

- [ ] **Step 4: Verify all 3 render and function**

`npx astro dev` → test each converter with sample data.

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/EmojiShortcode.tsx src/components/tools/Base64.tsx src/components/tools/UrlEncoder.tsx
git commit -m "feat: add converter tool UI components (3 tools)"
```

---

### Task 5.5: Development Tools UI (4 tools)

**Files:**
- Create: `src/components/tools/JsonFormatter.tsx` (replace placeholder)
- Create: `src/components/tools/DiffChecker.tsx`
- Create: `src/components/tools/RegexTester.tsx`
- Create: `src/components/tools/XmlBeautifier.tsx`

- [ ] **Step 1: JsonFormatter UI**

TextArea (monospace) + Select (indent: 2/4/tab/compact) → Button (Format) + Button (Validate) → OutputPanel + StatusMessage for validation

- [ ] **Step 2: DiffChecker UI**

Two TextAreas side-by-side + Checkbox (ignore case) + Checkbox (ignore whitespace) → Button → diff output with colored lines (added green, deleted red, unchanged gray) + stats badges

- [ ] **Step 3: RegexTester UI**

Input (pattern) + 3x Checkbox (flags: g/i/m) + TextArea (test text) → real-time match results: highlighted matches, match details table (index, groups)

- [ ] **Step 4: XmlBeautifier UI**

TextArea (monospace) + Select (indent: 2/4/tab) → Button (Format) + Button (Validate) → OutputPanel + StatusMessage

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add development tool UI components (4 tools)"
```

---

### Task 5.6: Utility Tools UI (5 tools)

**Files:**
- Create: `src/components/tools/ColorPicker.tsx`
- Create: `src/components/tools/TimestampConverter.tsx`
- Create: `src/components/tools/TimeConvert.tsx`
- Create: `src/components/tools/Reg2Gpo.tsx`
- Create: `src/components/tools/HashGenerator.tsx`

- [ ] **Step 1: ColorPicker UI**

Native `<input type="color">` + text Input (hex/rgb) → live preview square + output cards (HEX, RGB, RGBA, HSL) each with CopyButton

- [ ] **Step 2: TimestampConverter UI**

Input (timestamp) + Button (Current Time) → result cards (seconds, milliseconds, ISO, UTC, locale) each with CopyButton

- [ ] **Step 3: TimeConvert UI**

Input (value) + Select (unit) → result cards for all units + formatted duration string

- [ ] **Step 4: Reg2Gpo UI**

TextArea OR FileInput (.reg) → Button (Convert) → OutputPanel (XML, monospace) + DownloadButton (filename: `gpo-export.xml`)

- [ ] **Step 5: HashGenerator UI**

TextArea → Button (async) → result cards (SHA-1, SHA-256, SHA-512) each with CopyButton

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add utility tool UI components (5 tools)"
```

---

### Task 5.7: Full Integration Smoke Test

- [ ] **Step 1: Start dev server and test every tool**

```bash
npx astro dev
```

Visit each of the 27 tool pages. For each:
1. Enter sample input
2. Click action button
3. Verify output matches current app behavior
4. Test copy button
5. Test dark mode

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Commit fixes**

---

## Chunk 6: Command Palette & Final Polish

### Task 6.1: Command Palette

**Files:**
- Create: `src/islands/CommandPalette.tsx`

- [ ] **Step 1: Install fuse.js and create search index**

The search index combines `toolRegistry` with i18n-resolved names and descriptions.

- [ ] **Step 2: Create CommandPalette component**

`src/islands/CommandPalette.tsx`:
- Modal overlay with search input
- fuse.js instance searching over tool id, keywords, name, description
- Keyboard: `Ctrl/Cmd+K` opens, `Esc` closes, arrows navigate, `Enter` selects
- Focus trap: Tab cycles within modal
- `aria-modal="true"`, `role="dialog"`, search input has `role="combobox"`
- Results list: icon + name + category + description
- Click on result or Enter navigates to tool page via `window.location.href`
- Backdrop click dismisses

- [ ] **Step 3: Mount in ToolLayout and BaseLayout**

Add `<CommandPalette client:idle lang={lang} />` to both layouts.

- [ ] **Step 4: Verify keyboard shortcut works**

`npx astro dev` → press `Cmd+K` → type "json" → see JSON Formatter result → press Enter → navigate.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add command palette with fuzzy search and keyboard navigation"
```

---

### Task 6.2: Mobile Menu

**Files:**
- Create: `src/islands/MobileMenu.tsx`

- [ ] **Step 1: Create mobile hamburger menu island**

Toggles sidebar visibility on screens ≤ 768px. Overlay background. Close on tool link click. Close on Esc.

- [ ] **Step 2: Integrate into ToolLayout**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add mobile hamburger menu"
```

---

### Task 6.3: Deployment Configuration

**Files:**
- Modify: `astro.config.ts` (add Cloudflare adapter)
- Create: `public/_redirects`
- Update: `Dockerfile`
- Update: `compose.yaml`

- [ ] **Step 1: Verify Cloudflare Pages compatibility**

For pure static output (`output: 'static'`), the `@astrojs/cloudflare` adapter is NOT needed — Astro's default static output works directly with Cloudflare Pages. The adapter is only needed for SSR. Since we use SSG only, skip the adapter installation. Verify by running `npx astro build` and confirming the `dist/` directory contains static HTML files.

- [ ] **Step 2: Create `public/_redirects`**

```
/ /en/ 302
```

- [ ] **Step 3: Update Dockerfile**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 4: Update compose.yaml**

Update build context and volume for `public/data` → `dist/data`.

- [ ] **Step 5: Verify build**

```bash
npx astro build
```

Expected: clean build, all 56 pages generated (27 tools x 2 languages + 2 index + root redirect).

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: configure Cloudflare Pages deployment and Docker"
```

---

### Task 6.4: Cleanup & Final Verification

**Files:**
- Remove: `index.html`, `app.js`, `style.css`, `locales/`
- Update: `README.md`
- Update: `CHANGELOG.md`

- [ ] **Step 1: Remove old files**

```bash
git rm index.html app.js style.css locales/en.json locales/it.json
rmdir locales
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run --coverage
npx astro build
```

Both must pass with zero errors.

- [ ] **Step 3: Verify no console.log in production code**

```bash
grep -r 'console.log' src/ --include='*.ts' --include='*.tsx'
```

Expected: zero matches.

- [ ] **Step 4: Verify TypeScript strict compliance**

```bash
npx astro check
```

Expected: zero errors, zero warnings.

- [ ] **Step 5: Update CHANGELOG.md**

Add v1.0.0 entry documenting the complete rewrite.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: remove legacy files and update documentation"
```

- [ ] **Step 7: Final integration test**

```bash
npx astro dev
```

Test:
1. Homepage renders with catalog
2. Language switch works (EN ↔ IT)
3. Theme toggle works (light ↔ dark, no flash on reload)
4. Command palette opens with Cmd+K, search works, navigation works
5. All 27 tools functional
6. Mobile responsive
7. Legacy hash URLs redirect correctly
8. Skip-to-content link works (Tab from fresh page load)
9. Focus moves to tool heading on navigation
10. All form controls have associated labels (inspect with browser DevTools accessibility panel)
11. Color contrast check: verify text readability in both light and dark themes

---
