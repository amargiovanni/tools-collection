# E2E Browser Tests — Design Spec

## Goal

Add end-to-end browser tests for all 27 tools using Playwright, covering happy path, error states, and tool-specific behavior. Tests run locally and in GitHub Actions CI.

## Framework

**Playwright** with `@playwright/test`. Single browser (Chromium) in CI. Multi-browser optional locally.

## Directory Structure

```
e2e/
├── helpers/
│   └── tool-test.ts        # Reusable helper for the common input->action->output pattern
├── tools/
│   ├── list-generator.spec.ts
│   ├── add-text-to-lines.spec.ts
│   ├── convert-case.spec.ts
│   ├── remove-duplicate-lines.spec.ts
│   ├── remove-line-breaks.spec.ts
│   ├── remove-lines-containing.spec.ts
│   ├── password-generator.spec.ts
│   ├── username-generator.spec.ts
│   ├── pin-generator.spec.ts
│   ├── domain-extractor.spec.ts
│   ├── email-extractor.spec.ts
│   ├── count-duplicates.spec.ts
│   ├── pem-inspector.spec.ts
│   ├── password-strength.spec.ts
│   ├── qr-code.spec.ts
│   ├── emoji-shortcode.spec.ts
│   ├── base64.spec.ts
│   ├── url-encoder.spec.ts
│   ├── json-formatter.spec.ts
│   ├── diff-checker.spec.ts
│   ├── regex-tester.spec.ts
│   ├── xml-beautifier.spec.ts
│   ├── color-picker.spec.ts
│   ├── timestamp-converter.spec.ts
│   ├── time-convert.spec.ts
│   ├── reg2gpo.spec.ts
│   └── hash-generator.spec.ts
└── navigation.spec.ts       # Home, language switcher, command palette
playwright.config.ts
```

## Conventions

- One spec file per tool — isolated, parallelizable
- All tests use `/en/tools/{tool-id}/` URLs (trailing slash matches Astro's static output: `en/tools/{id}/index.html`)
- i18n key parity is already covered by unit tests — e2e tests only run in English
- Stable selectors via `data-testid` attributes on shared UI components
- No testing of pure logic (already covered by vitest unit tests in `tests/tools/`)
- **Button labels in tests must match the English i18n translations** from `src/i18n/messages/en.json` (e.g., `common_convert` = `"Convert"`, not `"Generate"`)
- Local dev requires a prior `npm run build` before `npm run preview` serves content from `dist/`

## data-testid Attributes

Added to shared UI components. Each component accepts an optional `testId` prop to disambiguate when multiple instances appear on the same page:

| Component | Default attribute | Disambiguation |
|-----------|-------------------|----------------|
| `TextArea` | `data-testid="textarea"` | `testId` prop (e.g., `"textarea-original"`, `"textarea-modified"`) |
| `Input` | `data-testid="input"` | `testId` prop |
| `OutputPanel` | `data-testid="output-panel"` (on wrapper div) | — |
| `ResultCard` | `data-testid="result-card"` | — (selected by index or label text) |
| `StatusMessage` | `data-testid="status-message"` | — |
| `Select` | `data-testid="select"` | `testId` prop |
| `CopyButton` | `data-testid="copy-button"` | — |
| `FileInput` | `data-testid="file-input"` | — |
| `Checkbox` | Selected via `label` text: `page.getByLabel('Ignore case')` | — |
| `Badge` | Selected via text content: `page.getByText('Additions: 3')` | — |
| `DownloadButton` | Selected by role+name: `page.getByRole('button', { name })` | — |

**Special cases:**
- `OutputPanel` wraps a `TextArea` internally. The `data-testid="output-panel"` goes on the `OutputPanel` wrapper `<div>`. Tests read output via the inner `<textarea>` element within the `[data-testid="output-panel"]` container.
- `ColorPicker` uses a native `<input type="color">` outside the shared `Input` component. Tests select it via `page.locator('input[type="color"]')`.
- `PemInspector` does not use `ResultCard` — it renders custom `<div>` blocks. Tests select its results via text content (e.g., `page.getByText('SHA-256 fingerprint')`).

Buttons are selected by role+name matching the English i18n value: `page.getByRole('button', { name: 'Encode Base64' })`.

## Reusable Helper: `tool-test.ts`

Encapsulates the common pattern shared by ~20 of 27 tools:

```ts
interface ToolTestOptions {
  toolId: string
  input: string
  action: string              // English button text to click (must match i18n en.json)
  expectOutput?: string       // exact or partial match on output panel
  expectOutputContains?: string
  expectError?: string        // expected error message
}

async function toolTest(page: Page, options: ToolTestOptions): Promise<void>
```

The helper:
1. Navigates to `/en/tools/{toolId}/`
2. Fills the first `[data-testid="textarea"]` with `input`
3. Clicks the button matching `action`
4. Asserts output or error

Tools with non-standard UI use custom test logic:
- **DiffChecker**: two textareas (disambiguated via `testId` props)
- **PasswordStrength**: reactive (no button — fill input, wait for score)
- **QrCode**: dual mode (generate + file upload)
- **RegexTester**: separate pattern input + flag checkboxes + test textarea
- **ColorPicker**: native color picker + text input + ResultCard grid
- **CountDuplicates**: HTML table output (not OutputPanel)

## Test Coverage Per Tool

### Single-action tools (11 tools)

Each gets: happy path, empty input error, select/checkbox variation.

| Tool | Happy path input | Action button (en.json) | Expected output | Variation test |
|------|-----------------|------------------------|----------------|----------------|
| list-generator | `"a\nb\nc"` | `"Convert"` | `"1. a\n2. b\n3. c"` | Switch to bulleted format |
| add-text-to-lines | `"line1\nline2"` + prefix `"> "` | `"Convert"` | `"> line1\n> line2"` | Switch to append mode |
| convert-case | `"hello world"` | `"Convert"` | `"HELLO WORLD"` | Switch to camelCase |
| remove-duplicate-lines | `"a\nb\na"` | `"Remove Duplicates"` | `"a\nb"` | — |
| remove-line-breaks | `"a\nb\nc"` | `"Remove Line Breaks"` | `"a b c"` | Custom separator |
| remove-lines-containing | `"keep\nremove this\nkeep"` + filter `"remove"` | `"Remove Lines"` | `"keep\nkeep"` | — |
| domain-extractor | `"https://example.com/path"` | `"Extract Domains"` | `"example.com"` | Include subdomains toggle |
| email-extractor | `"contact test@example.com here"` | `"Extract Emails"` | `"test@example.com"` | Remove duplicates toggle |
| count-duplicates | `"a\nb\na"` | `"Analyze"` | Table with `a` count `2` | Sort by count toggle |
| json-formatter | `'{"a":1}'` | `"Format JSON"` | Formatted JSON | Indent option, valid message |
| xml-beautifier | `"<root><item>x</item></root>"` | `"Format XML"` | Formatted XML | Indent option, valid message |

### Dual-action tools (3 tools)

Each gets: encode happy path, decode happy path, empty input error.

| Tool | Encode action | Encode input | Encode output | Decode action | Decode input | Decode output |
|------|--------------|-------------|--------------|--------------|-------------|--------------|
| base64 | `"Encode Base64"` | `"Hello"` | `"SGVsbG8="` | `"Decode Base64"` | `"SGVsbG8="` | `"Hello"` |
| url-encoder | `"Encode URL"` | `"hello world"` | `"hello%20world"` | `"Decode URL"` | `"hello%20world"` | `"hello world"` |
| emoji-shortcode | `"Shortcode → Emoji"` | `":heart:"` | Contains `❤` | `"Emoji → Shortcode"` | `"❤️"` | Contains `:heart:` |

### ResultCard grid tools (4 tools)

Each gets: happy path verifying card labels+values, empty input error.

| Tool | Input | Action button | Cards verified |
|------|-------|---------------|---------------|
| color-picker | `"#FF5733"` via text input | `"Convert Color"` | HEX, RGB, RGBA, HSL values present (4 cards) |
| timestamp-converter | `"1700000000"` | `"Convert"` | Unix seconds, Unix milliseconds, ISO 8601, UTC, Locale (5 cards) |
| time-convert | `"3600"` (unit defaults to Seconds, no Select change needed) | `"Convert Time"` | ms, s, min, h, d, HH:MM:SS (6 cards) |
| hash-generator | `"test"` | `"Generate Hash"` | SHA-1, SHA-256, SHA-512 non-empty (async — wait for loading to clear) |

### Generator tools (3 tools)

Each gets: generate happy path (check output line count), validation error.

| Tool | Config | Action button | Assertion |
|------|--------|---------------|-----------|
| password-generator | length 16, count 3, uppercase+lowercase checked | `"Generate Password"` | 3 lines, each 16 chars |
| username-generator | count 5 | `"Generate Usernames"` | 5 lines of non-empty output |
| pin-generator | length 6, count 4 | `"Generate PINs"` | 4 lines, each 6 digits |

### Special tools (6 tools)

**password-strength** (reactive — no action button):
- `page.fill()` a weak password (e.g., `"abc"`) → wait for score badge → verify text "Weak" visible
- `page.fill()` a strong password (e.g., `"C0mpl3x!Pass#2024"`) → wait for score badge → verify text "Strong" visible
- No button click needed — component uses `createEffect` to evaluate on every keystroke

**pem-inspector** (async, custom result blocks):
- Paste a valid PEM certificate → click `"Extract Information"` → wait for loading → verify text `"SHA-256 fingerprint"` is visible (uses text selector, not ResultCard)
- Invalid PEM → error message visible

**qr-code** (dual mode):
- Enter text → click `"Generate QR Code"` → `img[alt="QR Code"]` is visible
- Empty input → error message visible

**diff-checker** (two textareas, badges, colored diff):
- Fill textarea `"textarea-original"` and `"textarea-modified"` with different text → click `"Compare Texts"` → badges with additions/deletions counts visible
- Same text in both → `"No differences found"` message

**regex-tester** (separate pattern input + flag checkboxes):
- Type `test` into pattern input field, check `"Global (g)"` and `"Ignore Case (i)"` checkboxes, fill test text with `"Test test TEST"` → click `"Test Regex"` → matches count badge shows `3`
- Empty pattern → error message

**reg2gpo** (textarea + file input + download):
- Paste reg content with a valid `[HKEY_LOCAL_MACHINE\Software\Example]` section → click `"Generate GPO XML"` → XML output visible + entries count badge
- Empty input → error message

### Navigation tests

- Home page loads, shows 27 tool cards (verify count)
- Click a tool card → tool page opens with correct heading
- Language dropdown opens, click a language → navigates to correct locale URL
- Command palette opens with Ctrl+K, shows search results

## Playwright Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
})
```

Note: `npm run preview` serves from `dist/`. In CI the build step runs first. Locally, run `npm run build` before the first `npm run test:e2e`, or use `reuseExistingServer` with an already-running preview.

## CI Integration

Added to existing `.github/workflows/ci.yml`, after the build step. Uses `actions/upload-artifact@v7` (matching the existing workflow version):

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npx playwright test

- name: Upload Playwright report
  if: failure()
  uses: actions/upload-artifact@v7
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

## package.json Scripts

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

## Estimated Test Count

~80-100 test cases across 28 spec files (27 tools + 1 navigation).

## Out of Scope

- Multi-browser testing in CI (Chromium only; Firefox/WebKit optional locally)
- Visual regression testing (screenshots for diff comparison)
- i18n-specific e2e tests (key parity already covered by unit tests)
- Performance benchmarks
- Mobile viewport testing (can be added later)
