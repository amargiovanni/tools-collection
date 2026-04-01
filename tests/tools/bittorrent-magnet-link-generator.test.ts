import { describe, it, expect } from 'vitest'
import { generateMagnetLink, DEFAULT_MAGNET_TRACKERS } from '../../src/tools/bittorrent-magnet-link-generator'

describe('generateMagnetLink', () => {
  it('returns an error when hash is missing', () => {
    const result = generateMagnetLink({ hash: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('HASH_REQUIRED')
    }
  })

  it('returns an error for an invalid info hash', () => {
    const result = generateMagnetLink({ hash: 'not-a-hash' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_INFO_HASH')
    }
  })

  it('uses the normalized hash as fallback resource name', () => {
    const result = generateMagnetLink({ hash: '0123456789abcdef0123456789abcdef01234567' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.resourceName).toBe('0123456789ABCDEF0123456789ABCDEF01234567')
      expect(result.value.trackers).toEqual([...DEFAULT_MAGNET_TRACKERS])
    }
  })

  it('builds a magnet link with encoded name and trackers', () => {
    const result = generateMagnetLink({
      hash: '0123456789abcdef0123456789abcdef01234567',
      name: 'Ubuntu ISO',
      trackers: 'udp://tracker.example:1337/announce\nhttp://tracker.example/announce',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.magnetLink).toContain('xt=urn:btih:0123456789ABCDEF0123456789ABCDEF01234567')
      expect(result.value.magnetLink).toContain('dn=Ubuntu+ISO')
      expect(result.value.magnetLink).toContain('tr=udp%3A%2F%2Ftracker.example%3A1337%2Fannounce')
      expect(result.value.magnetLink).toContain('tr=http%3A%2F%2Ftracker.example%2Fannounce')
    }
  })
})
