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
