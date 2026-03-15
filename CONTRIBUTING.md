# Contributing

Thanks for your interest in contributing to Tools Collection.

## Getting Started

```bash
git clone https://github.com/amargiovanni/tools-collection.git
cd tools-collection
npm install
npm run dev
```

## Adding a New Tool

Each tool is three files + registry entries:

### 1. Pure logic — `src/tools/my-tool.ts`

```ts
import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export function myToolFunction(input: string): Result<string> {
  if (!input.trim()) return err('EMPTY_INPUT', 'Please enter some input')
  // transform input
  return ok(result)
}
```

- Returns `Result<T>`, never throws
- Zero DOM, zero side effects
- Independently testable

### 2. Tests — `tests/tools/my-tool.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { myToolFunction } from '../../src/tools/my-tool'

describe('myToolFunction', () => {
  it('returns error for empty input', () => {
    const r = myToolFunction('')
    expect(r.ok).toBe(false)
  })

  it('transforms input correctly', () => {
    const r = myToolFunction('test')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('expected')
  })
})
```

### 3. UI component — `src/components/tools/MyTool.tsx`

```tsx
import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { myToolFunction } from '../../tools/my-tool'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props { lang: Language }

export default function MyTool(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  const handle = () => {
    const result = myToolFunction(input())
    if (result.ok) { setOutput(result.value); setError(null) }
    else { setError(translateError(props.lang, result.error)) }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea onInput={(e) => setInput(e.currentTarget.value)} />
      <Button onClick={handle}>Go</Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} />
    </div>
  )
}
```

### 4. Wire it up

- **Registry** — add entry to `src/config/tools.ts` (id, category, icon, keywords, path)
- **Component map** — add import to `src/config/tool-components.ts`
- **i18n** — add `tools_myTool_name` and `tools_myTool_description` keys to both `src/i18n/messages/en.json` and `src/i18n/messages/it.json`
- **Error keys** — add `errors_MY_ERROR_CODE` to both locale files if your tool has custom error codes

The tool automatically gets pages at `/en/tools/my-tool` and `/it/tools/my-tool`, appears in the sidebar, homepage, and command palette.

## Development Workflow

### Branch naming

```
feature/short-description
fix/short-description
```

### Commit messages

```
type(scope): short description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`

### Before submitting a PR

```bash
npm test              # all tests pass
npm run build         # 57+ pages build
npm run check         # no type errors
```

Verify there are no `console.log` in `src/`:

```bash
grep -rn 'console.log' src/ --include='*.ts' --include='*.tsx'
```

## Code Standards

- **TypeScript strict** — no `any`, no `@ts-ignore`, no unsafe casts
- **Pure logic in `src/tools/`** — no DOM, no imports from UI layer
- **Shared components in `src/components/ui/`** — tool UIs compose these, never duplicate
- **i18n for all visible text** — use `t(lang, key)`, never hardcode strings
- **Error handling via `Result<T>`** — use `ok()` / `err()`, never throw in tool logic
- **Use `translateError()`** for error display — never `as any`

## Reporting Issues

Open an issue at https://github.com/amargiovanni/tools-collection/issues with:

- What you expected
- What happened
- Browser and OS
- Steps to reproduce
