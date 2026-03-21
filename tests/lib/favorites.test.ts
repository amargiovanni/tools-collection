import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getFavorites, isFavorite, toggleFavorite } from '../../src/lib/favorites'

describe('favorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getFavorites', () => {
    it('returns empty array when nothing stored', () => {
      expect(getFavorites()).toEqual([])
    })

    it('returns stored favorites', () => {
      localStorage.setItem('favorite-tools', JSON.stringify(['json-formatter', 'base64']))
      expect(getFavorites()).toEqual(['json-formatter', 'base64'])
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem('favorite-tools', 'not-json')
      expect(getFavorites()).toEqual([])
    })

    it('returns empty array when stored value is not an array', () => {
      localStorage.setItem('favorite-tools', JSON.stringify({ a: 1 }))
      expect(getFavorites()).toEqual([])
    })

    it('filters out non-string values', () => {
      localStorage.setItem('favorite-tools', JSON.stringify(['json-formatter', 42, null, 'base64']))
      expect(getFavorites()).toEqual(['json-formatter', 'base64'])
    })
  })

  describe('isFavorite', () => {
    it('returns false when no favorites', () => {
      expect(isFavorite('json-formatter')).toBe(false)
    })

    it('returns true for a stored favorite', () => {
      localStorage.setItem('favorite-tools', JSON.stringify(['json-formatter']))
      expect(isFavorite('json-formatter')).toBe(true)
    })

    it('returns false for a non-favorite tool', () => {
      localStorage.setItem('favorite-tools', JSON.stringify(['base64']))
      expect(isFavorite('json-formatter')).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('adds a tool when not in favorites and returns true', () => {
      const result = toggleFavorite('json-formatter')
      expect(result).toBe(true)
      expect(getFavorites()).toEqual(['json-formatter'])
    })

    it('removes a tool when already in favorites and returns false', () => {
      localStorage.setItem('favorite-tools', JSON.stringify(['json-formatter', 'base64']))
      const result = toggleFavorite('json-formatter')
      expect(result).toBe(false)
      expect(getFavorites()).toEqual(['base64'])
    })

    it('handles toggle on empty storage', () => {
      toggleFavorite('base64')
      expect(getFavorites()).toEqual(['base64'])
      toggleFavorite('base64')
      expect(getFavorites()).toEqual([])
    })
  })

  describe('localStorage error handling', () => {
    it('getFavorites handles localStorage.getItem throwing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('quota') })
      expect(getFavorites()).toEqual([])
      vi.restoreAllMocks()
    })

    it('toggleFavorite handles localStorage.setItem throwing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
      // Should not throw, returns the intended state
      const result = toggleFavorite('json-formatter')
      // When setItem fails on add, returns false (failed to add)
      expect(result).toBe(false)
      vi.restoreAllMocks()
    })
  })
})
