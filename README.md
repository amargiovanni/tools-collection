# Tools Collection

A modular, type-safe collection of 27 browser-based developer tools. Built with Astro, Solid.js, TypeScript strict, and Tailwind CSS 4. Deployable on Cloudflare Pages or any static hosting.

![CI](https://github.com/amargiovanni/tools-collection/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)
![Astro](https://img.shields.io/badge/Astro-6-ff5d01.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## What it does

27 tools that run entirely in your browser — no data leaves your machine (except QR generation, which uses an external API). Five languages (EN/IT/ES/FR/DE), theme switcher (light/dark/system), and a command palette (`Ctrl/Cmd+K`) for instant navigation.

## Tools

| Category | Tools |
|---|---|
| **Text Processing** | List Generator, Add Text to Lines, Convert Case, Remove Duplicate Lines, Remove Line Breaks, Remove Lines Containing |
| **Generators** | Password Generator (crypto API), Username Generator, PIN Generator |
| **Extraction** | Domain Extractor, Email Extractor |
| **Analysis** | Count Duplicates |
| **Security** | PEM Certificate Inspector, Password Strength Checker, QR Code Generator/Reader |
| **Converters** | Emoji Shortcode, Base64 Encoder/Decoder, URL Encoder/Decoder |
| **Development** | JSON Formatter/Validator, Diff Checker, Regex Tester, XML Beautifier |
| **Utilities** | Color Picker, Timestamp Converter, Time Convert, Reg2GPO, Hash Generator |

## Tech Stack

| Layer | Technology |
|---|---|
| Meta-framework | [Astro](https://astro.build/) 6 — static site generation, per-page code splitting |
| UI framework | [Solid.js](https://www.solidjs.com/) — fine-grained reactivity, zero virtual DOM |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 — `@theme` design tokens, theme switcher (light/dark/system) |
| Type safety | TypeScript strict — `noUncheckedIndexedAccess`, zero `any` |
| i18n | Type-safe JSON messages, compile-time key validation |
| Search | [Fuse.js](https://www.fusejs.io/) — fuzzy search in command palette |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — 300+ unit tests, 56 e2e browser tests |
| Variants | [cva](https://cva.style/) — type-safe component variants |

## Architecture

Each tool is cleanly separated into three layers:

```
src/tools/json-formatter.ts        ← Pure logic (no DOM, returns Result<T>)
src/components/tools/JsonFormatter.tsx  ← Solid.js UI (composes shared components)
src/pages/en/tools/[tool].astro    ← Astro page (mounts island via client:load)
```

```
src/
├── components/
│   ├── ui/              # 13 reusable Solid components (Button, TextArea, OutputPanel, ...)
│   ├── tools/           # 27 tool UI components (one per tool)
│   ├── Sidebar.astro    # Category navigation
│   └── HomeCatalog.astro
├── config/
│   ├── tools.ts         # Tool registry (27 entries with metadata)
│   └── tool-components.ts # Lazy component mapping (code splitting via SolidJS lazy())
├── i18n/
│   ├── index.ts         # Type-safe t(lang, key) helper
│   └── messages/        # en/it/es/fr/de.json (375 keys each)
├── islands/
│   ├── CommandPalette.tsx # Ctrl/Cmd+K fuzzy search
│   └── ToolRenderer.tsx   # Dynamic tool component dispatcher
├── layouts/
│   ├── BaseLayout.astro   # HTML head, SEO, legacy redirects
│   └── ToolLayout.astro   # Sidebar + header + tool slot
├── lib/
│   ├── result.ts        # Result<T> type for error handling
│   ├── clipboard.ts     # Copy with fallback
│   └── download.ts      # File download utility
├── pages/
│   ├── index.astro      # Root redirect → /{lang}/
│   ├── en/              # English pages
│   ├── it/              # Italian pages
│   ├── es/              # Spanish pages
│   ├── fr/              # French pages
│   └── de/              # German pages
├── styles/
│   └── global.css       # Tailwind 4 @theme tokens + dark mode
└── tools/               # 27 pure logic modules (zero DOM)
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install & Run

```bash
git clone https://github.com/amargiovanni/tools-collection.git
cd tools-collection
npm install
npm run dev
```

Open `http://localhost:4321`.

### Build for Production

```bash
npm run build
npm run preview
```

Output goes to `dist/` — 141 static HTML pages (28 per language x 5) ready for any hosting.

### Docker

```bash
docker compose up --build -d
```

Available at `http://localhost:8080`.

To set the default language served on the first visit, pass `DEFAULT_LANGUAGE` (`en`, `it`, `es`, `fr`, or `de`) through Docker Compose:

```bash
DEFAULT_LANGUAGE=it docker compose up --build -d
```

If the browser already has a saved language preference in `localStorage`, that preference still wins.

### Custom Logo

The application can display a custom logo from `data/logo.png` in the homepage hero and next to `Online Tools` in the tool sidebar/header.

- Expected repository path: `./data/logo.png`
- Expected container path: `/usr/share/nginx/html/data/logo.png`
- If the file is missing or unreadable, the built-in fallback logo is shown instead

#### File Permissions

The image must be readable by the web server running inside the container. Avoid restrictive permissions such as `0600`.

Recommended setting:

```bash
chmod 0644 data/logo.png
```

### Deploy to Cloudflare Pages

No adapter needed — Astro's default static output works directly:

1. Connect the GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`

## Development

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production (141 pages) |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run Playwright e2e browser tests |
| `npm run test:e2e:ui` | Run e2e tests with interactive UI |
| `npm run check` | Astro type check |

### Testing

300+ unit tests (Vitest) covering all 27 pure logic modules, i18n, and shared components:

```bash
npm test
```

56 end-to-end browser tests (Playwright) covering every tool and navigation:

```bash
npm run build && npm run test:e2e
```

Use `npm run test:e2e:ui` for an interactive UI where you can run tests one at a time and inspect the browser state.

### Adding a New Tool

1. **Pure logic** — Create `src/tools/my-tool.ts` returning `Result<T>`
2. **Tests** — Create `tests/tools/my-tool.test.ts`
3. **UI component** — Create `src/components/tools/MyTool.tsx` composing `src/components/ui/*`
4. **Registry** — Add entry to `src/config/tools.ts`
5. **Component map** — Add import to `src/config/tool-components.ts`
6. **i18n** — Add keys to all 5 locale files (`en.json`, `it.json`, `es.json`, `fr.json`, `de.json`)
7. **e2e test** — Create `e2e/tools/my-tool.spec.ts` using the `toolTest` helper

The tool automatically gets a page at `/{lang}/tools/my-tool` and appears in the sidebar, homepage, and command palette.

### Design Tokens

Colors are defined as CSS custom properties in `src/styles/global.css` via Tailwind 4's `@theme` directive. Dark mode is controlled via a `data-theme` attribute on `<html>`. Users can switch between light, dark, and system (follows device setting) via the theme toggle button. The preference is persisted in `localStorage`.

## Privacy

- All processing happens in the browser
- No analytics, no tracking, no cookies
- QR Code generation is the only exception: it uses `api.qrserver.com`
- Passwords and PINs use `crypto.getRandomValues()` (cryptographically secure)

## License

MIT — see [LICENSE](LICENSE).

## Authors

- **Andrea Margiovanni** — [@amargiovanni](https://github.com/amargiovanni)
- **Giovanni "Gioxx" Solone** — [@gioxx](https://github.com/gioxx)

---

<div align="center">
  <a href="https://github.com/amargiovanni/tools-collection/issues">Report a Bug</a> · <a href="https://github.com/amargiovanni/tools-collection/issues">Request a Feature</a>
</div>
