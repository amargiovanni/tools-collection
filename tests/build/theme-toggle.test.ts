import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

describe('theme toggle', () => {
  it('global CSS uses data-theme attribute for dark mode', () => {
    const css = readFileSync(join(ROOT, 'src', 'styles', 'global.css'), 'utf-8')
    expect(css).toContain('[data-theme="dark"]')
  })

  it('ToolLayout contains a theme-toggle button', () => {
    const layout = readFileSync(join(ROOT, 'src', 'layouts', 'ToolLayout.astro'), 'utf-8')
    expect(layout).toContain('id="theme-toggle"')
  })

  it('BaseLayout contains theme initialization script', () => {
    const layout = readFileSync(join(ROOT, 'src', 'layouts', 'BaseLayout.astro'), 'utf-8')
    expect(layout).toContain('data-theme')
  })

  it('HomeCatalog contains a theme-toggle button', () => {
    const catalog = readFileSync(join(ROOT, 'src', 'components', 'HomeCatalog.astro'), 'utf-8')
    expect(catalog).toContain('id="theme-toggle"')
  })
})
