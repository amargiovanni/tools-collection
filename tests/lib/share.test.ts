import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from '../../src/lib/share'

describe('share', () => {
  describe('encodeState / decodeState round-trip', () => {
    it('round-trips a simple string value', async () => {
      const state = { input: 'hello world' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips a large JSON payload (>1KB)', async () => {
      const state = { input: JSON.stringify({ a: 'x'.repeat(2000) }) }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips unicode and emoji', async () => {
      const state = { input: '日本語テスト 🚀 مرحبا' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })

    it('round-trips multiple fields', async () => {
      const state = { input: 'test', indent: 4, mode: 'encode' }
      const encoded = await encodeState(state)
      const decoded = await decodeState(encoded)
      expect(decoded).toEqual(state)
    })
  })

  describe('decodeState — invalid input', () => {
    it('returns null for null', async () => {
      expect(await decodeState(null)).toBeNull()
    })

    it('returns null for empty string', async () => {
      expect(await decodeState('')).toBeNull()
    })

    it('returns null for corrupt base64', async () => {
      expect(await decodeState('!!!not_valid_base64!!!')).toBeNull()
    })

    it('returns null for valid base64 but not compressed JSON', async () => {
      const plain = btoa('{"v":1,"state":{}}') // not compressed
      expect(await decodeState(plain)).toBeNull()
    })

    it('returns null for unknown version', async () => {
      // Manually build a v999 envelope and encode it
      const raw = new TextEncoder().encode(JSON.stringify({ v: 999, state: {} }))
      const cs = new CompressionStream('deflate-raw')
      const writer = cs.writable.getWriter()
      writer.write(raw)
      writer.close()
      const compressed = await new Response(cs.readable).arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(compressed)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      expect(await decodeState(b64)).toBeNull()
    })
  })
})

// The shared state must travel in the URL fragment: browsers never send the
// part after # to a server, while a ?query reaches the host and its logs.
describe('share URL — state in the fragment, never in the query', () => {
  it('buildShareUrl puts the state after # and nothing in the query', async () => {
    const { buildShareUrl } = await import('../../src/lib/share')
    const url = new URL(buildShareUrl('https://tools.example/en/tools/base64/', 'abc_-1'))
    expect(url.search).toBe('')
    expect(url.hash).toBe('#s=abc_-1')
  })

  it('buildShareUrl drops a legacy ?s= and keeps other query parameters', async () => {
    const { buildShareUrl } = await import('../../src/lib/share')
    const url = new URL(buildShareUrl('https://tools.example/en/tools/x/?s=old&lang=en#top', 'new'))
    expect(url.searchParams.has('s')).toBe(false)
    expect(url.searchParams.get('lang')).toBe('en')
    expect(url.hash).toBe('#s=new')
  })

  it('readSharedParam prefers the fragment', async () => {
    const { readSharedParam } = await import('../../src/lib/share')
    expect(readSharedParam({ search: '?s=legacy', hash: '#s=fresh' })).toEqual({ value: 'fresh', legacy: false })
  })

  it('readSharedParam still reads a legacy ?s= link and flags it', async () => {
    const { readSharedParam } = await import('../../src/lib/share')
    expect(readSharedParam({ search: '?s=legacy', hash: '' })).toEqual({ value: 'legacy', legacy: true })
  })

  it('readSharedParam returns null when there is no shared state', async () => {
    const { readSharedParam } = await import('../../src/lib/share')
    expect(readSharedParam({ search: '?x=1', hash: '#top' })).toBeNull()
  })

  it('withoutLegacyParam moves a legacy ?s= into the fragment', async () => {
    const { withoutLegacyParam } = await import('../../src/lib/share')
    const url = new URL(withoutLegacyParam('https://tools.example/en/tools/x/?s=legacy&lang=en'))
    expect(url.searchParams.has('s')).toBe(false)
    expect(url.searchParams.get('lang')).toBe('en')
    expect(url.hash).toBe('#s=legacy')
  })
})
