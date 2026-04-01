import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface MagnetLinkOptions {
  hash: string
  name?: string
  trackers?: string
}

export interface MagnetLinkResult {
  magnetLink: string
  normalizedHash: string
  resourceName: string
  trackers: string[]
}

export const DEFAULT_MAGNET_TRACKERS = [
  'http://tracker.opentrackr.org:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
] as const

const TRACKER_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i
const HEX_HASH_PATTERN = /^[A-F0-9]{40}$/i
const BASE32_HASH_PATTERN = /^[A-Z2-7]{32}$/i

function normalizeTrackers(input?: string): string[] {
  if (typeof input === 'undefined') return [...DEFAULT_MAGNET_TRACKERS]

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => TRACKER_PATTERN.test(line))
}

function isValidInfoHash(hash: string): boolean {
  return HEX_HASH_PATTERN.test(hash) || BASE32_HASH_PATTERN.test(hash)
}

export function generateMagnetLink(options: MagnetLinkOptions): Result<MagnetLinkResult> {
  const normalizedHash = options.hash.trim().toUpperCase()
  if (!normalizedHash) {
    return err('HASH_REQUIRED', 'Info hash is required')
  }

  if (!isValidInfoHash(normalizedHash)) {
    return err('INVALID_INFO_HASH', 'Info hash must be a 40-character hex or 32-character base32 value')
  }

  const trackers = normalizeTrackers(options.trackers)
  const resourceName = (options.name ?? '').trim() || normalizedHash
  const params = new URLSearchParams({
    xt: `urn:btih:${normalizedHash}`,
    dn: resourceName,
  })

  trackers.forEach((tracker) => params.append('tr', tracker))

  return ok({
    magnetLink: `magnet:?${params.toString()}`,
    normalizedHash,
    resourceName,
    trackers,
  })
}
