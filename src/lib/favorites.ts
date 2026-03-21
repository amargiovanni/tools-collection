const STORAGE_KEY = 'favorite-tools'

export function getFavorites(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId)
}

export function toggleFavorite(toolId: string): boolean {
  const current = [...getFavorites()]
  const index = current.indexOf(toolId)
  if (index === -1) {
    current.push(toolId)
  } else {
    current.splice(index, 1)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    return index === -1 ? false : true
  }
  return index === -1
}

export function addFavorite(toolId: string): void {
  const current = [...getFavorites()]
  if (!current.includes(toolId)) {
    current.push(toolId)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      // storage full – silently ignore
    }
  }
}

export function removeFavorite(toolId: string): void {
  const current = [...getFavorites()]
  const index = current.indexOf(toolId)
  if (index !== -1) {
    current.splice(index, 1)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      // silently ignore
    }
  }
}
