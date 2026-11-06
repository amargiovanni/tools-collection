import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { toolRegistry } from '../../src/config/tools'
import manual from '../../src/config/manual-pages.json'
import { manualHref, manualToolHref, manualSizeLabel } from '../../src/lib/manual'

// The PDF manual is built from the registry (docs/manual/build.mjs). A tool
// added without rebuilding the manual has no page: this test fails until the
// manual is regenerated, so the download never goes stale silently.
describe('user manual', () => {
  it('has a page for every tool in the registry', () => {
    const missing = toolRegistry.filter((tool) => !(tool.id in manual.tools)).map((tool) => tool.id)
    expect(missing).toEqual([])
  })

  it('lists no tool that is not in the registry', () => {
    const ids = new Set(toolRegistry.map((tool) => tool.id))
    expect(Object.keys(manual.tools).filter((id) => !ids.has(id))).toEqual([])
  })

  it('points every tool at a page inside the document', () => {
    for (const page of Object.values(manual.tools)) {
      expect(page).toBeGreaterThanOrEqual(1)
      expect(page).toBeLessThanOrEqual(manual.pages)
    }
  })

  it('ships the PDF it describes, with the recorded size', () => {
    const file = join(process.cwd(), 'public', manual.file)
    expect(existsSync(file)).toBe(true)
    expect(statSync(file).size).toBe(manual.bytes)
  })

  it('builds links to the document and to a tool page', () => {
    expect(manualHref()).toBe(manual.file)
    expect(manualToolHref('base64')).toBe(`${manual.file}#page=${manual.tools['base64' as keyof typeof manual.tools]}`)
    expect(manualToolHref('no-such-tool')).toBe(manual.file)
    expect(manualSizeLabel()).toMatch(/^\d+(\.\d)? MB$/)
  })
})
