import { describe, it, expect } from 'vitest'
import { sortToolsByLocalizedName } from '../../src/lib/tool-order'
import { toolRegistry } from '../../src/config/tools'

describe('sortToolsByLocalizedName', () => {
  it('sorts utilities alphabetically by localized tool name', () => {
    const utilities = toolRegistry.filter((tool) => tool.category === 'utilities')
    const sorted = sortToolsByLocalizedName('en', utilities)

    expect(sorted.map((tool) => tool.id)).toEqual([
      'color-picker',
      'csv-viewer',
      'hash-generator',
      'reg2gpo',
      'time-convert',
      'timestamp-converter',
    ])
  })
})
