import { describe, it, expect } from 'vitest'
import { toolRegistry, getToolMeta, getToolsByCategory, categories } from '../../src/config/tools'
import type { Category } from '../../src/config/tools'

describe('toolRegistry', () => {
  it('has exactly 34 tools', () => {
    expect(toolRegistry).toHaveLength(34)
  })

  it('all tools have unique IDs', () => {
    const ids = toolRegistry.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all paths start with /tools/', () => {
    for (const tool of toolRegistry) {
      expect(tool.path).toMatch(/^\/tools\//)
    }
  })

  it('all tools have at least one keyword', () => {
    for (const tool of toolRegistry) {
      expect(tool.keywords.length).toBeGreaterThan(0)
    }
  })

  it('all tool categories are valid', () => {
    const validCategories = new Set<string>(categories)
    for (const tool of toolRegistry) {
      expect(validCategories.has(tool.category)).toBe(true)
    }
  })
})

describe('getToolMeta', () => {
  it('returns correct tool for known ID', () => {
    const tool = getToolMeta('json-formatter')
    expect(tool).toBeDefined()
    expect(tool?.id).toBe('json-formatter')
    expect(tool?.category).toBe('development')
  })

  it('returns undefined for unknown ID', () => {
    expect(getToolMeta('nonexistent-tool')).toBeUndefined()
  })
})

describe('getToolsByCategory', () => {
  it('returns text-processing tools', () => {
    const tools = getToolsByCategory('text-processing')
    expect(tools.length).toBe(6)
    for (const tool of tools) {
      expect(tool.category).toBe('text-processing')
    }
  })

  it('returns empty array for category with no tools would not happen but test boundary', () => {
    // All categories in the const have at least one tool
    const allCategories: readonly Category[] = categories
    for (const cat of allCategories) {
      expect(getToolsByCategory(cat).length).toBeGreaterThan(0)
    }
  })

  it('covers every tool across all categories', () => {
    let totalTools = 0
    for (const cat of categories) {
      totalTools += getToolsByCategory(cat).length
    }
    expect(totalTools).toBe(34)
  })
})
