import { describe, it, expect } from 'vitest'

describe('useToolState', () => {
  it('module exports useToolState function', async () => {
    const mod = await import('../../src/lib/useToolState')
    expect(typeof mod.useToolState).toBe('function')
  })
})
