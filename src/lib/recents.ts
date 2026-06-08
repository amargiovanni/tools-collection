export const RECENTS_STORAGE_KEY = 'recent-tools'
export const RECENTS_UPDATED_EVENT = 'recents-updated'

const MAX_RECENTS = 12

export interface RecentEntry {
  readonly id: string
  readonly ts: number
}

function isEntry(value: unknown): value is RecentEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RecentEntry).id === 'string' &&
    typeof (value as RecentEntry).ts === 'number'
  )
}

export function getRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry)
  } catch {
    return []
  }
}

/** Record a tool visit, moving it to the front of the list. */
export function recordRecent(toolId: string): void {
  if (!toolId) return
  const current = getRecents().filter((r) => r.id !== toolId)
  const next = [{ id: toolId, ts: Date.now() }, ...current].slice(0, MAX_RECENTS)
  try {
    localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(RECENTS_UPDATED_EVENT))
  } catch {
    /* storage unavailable — silently skip */
  }
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(RECENTS_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(RECENTS_UPDATED_EVENT))
  } catch {
    /* ignore */
  }
}
