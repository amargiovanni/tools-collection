import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const DIST = join(process.cwd(), 'dist')

function ensureBuild() {
  if (!existsSync(join(DIST, 'en', 'tools', 'json-formatter', 'index.html'))) {
    execSync('npx astro build', { stdio: 'ignore' })
  }
}

describe('dark mode via prefers-color-scheme', () => {
  it('global CSS uses prefers-color-scheme media query', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'styles', 'global.css'), 'utf-8')
    expect(css).toContain('prefers-color-scheme: dark')
    expect(css).not.toContain('.dark {')
  })

  it('tool page does NOT contain a theme-toggle button', () => {
    ensureBuild()
    const html = readFileSync(
      join(DIST, 'en', 'tools', 'json-formatter', 'index.html'),
      'utf-8',
    )
    expect(html).not.toContain('id="theme-toggle"')
  })

  it('base layout does NOT contain flash prevention script', () => {
    ensureBuild()
    const html = readFileSync(join(DIST, 'en', 'index.html'), 'utf-8')
    expect(html).not.toContain("classList.add('dark')")
  })
})
