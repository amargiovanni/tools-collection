import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

describe('dark mode via prefers-color-scheme', () => {
  it('global CSS uses prefers-color-scheme media query, not .dark class', () => {
    const css = readFileSync(join(ROOT, 'src', 'styles', 'global.css'), 'utf-8')
    expect(css).toContain('prefers-color-scheme: dark')
    expect(css).not.toContain('.dark {')
  })

  it('ToolLayout does not contain a theme-toggle button', () => {
    const layout = readFileSync(join(ROOT, 'src', 'layouts', 'ToolLayout.astro'), 'utf-8')
    expect(layout).not.toContain('id="theme-toggle"')
  })

  it('BaseLayout does not contain flash prevention script', () => {
    const layout = readFileSync(join(ROOT, 'src', 'layouts', 'BaseLayout.astro'), 'utf-8')
    expect(layout).not.toContain("classList.add('dark')")
  })
})
