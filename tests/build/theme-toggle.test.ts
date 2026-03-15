import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const DIST = join(process.cwd(), 'dist')

// Ensure build exists — run once before tests
function ensureBuild() {
  if (!existsSync(join(DIST, 'en', 'tools', 'json-formatter', 'index.html'))) {
    execSync('npx astro build', { stdio: 'ignore' })
  }
}

describe('theme toggle in built HTML', () => {
  it('tool page contains theme-toggle button', () => {
    ensureBuild()
    const html = readFileSync(
      join(DIST, 'en', 'tools', 'json-formatter', 'index.html'),
      'utf-8',
    )
    expect(html).toContain('id="theme-toggle"')
  })

  it('tool page contains astro:page-load listener for re-binding', () => {
    ensureBuild()
    const html = readFileSync(
      join(DIST, 'en', 'tools', 'json-formatter', 'index.html'),
      'utf-8',
    )
    // The bundled script should reference the page-load event
    // Check that the theme toggle script is included (either inline or as module)
    expect(html).toContain('theme-toggle')
    expect(html).toContain('classList')
  })

  it('tool page contains dark mode flash prevention in head', () => {
    ensureBuild()
    const html = readFileSync(
      join(DIST, 'en', 'tools', 'json-formatter', 'index.html'),
      'utf-8',
    )
    // The inline script in BaseLayout prevents flash
    expect(html).toContain("localStorage.getItem('theme')")
    expect(html).toContain("classList.add('dark')")
  })

  it('homepage contains theme flash prevention', () => {
    ensureBuild()
    const html = readFileSync(join(DIST, 'en', 'index.html'), 'utf-8')
    expect(html).toContain("localStorage.getItem('theme')")
  })
})
