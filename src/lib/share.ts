import { fromBase64Url, toBase64Url } from './base64url'

export const TOOL_STATE_REQUEST = 'tool-state-request'
export const TOOL_STATE_RESPONSE = 'tool-state-response'

type ShareEnvelope = { v: 1; state: Record<string, unknown> }

/**
 * Shared state lives in the URL fragment (#s=…). Browsers never send the
 * fragment to a server, so a shared link does not hand the tool's input —
 * possibly a password or a token — to the host, its logs or a proxy. Links
 * made before this used ?s=, which does reach the server; they are still read
 * and rewritten in place.
 */
const PARAM = 's'

export function buildShareUrl(href: string, encoded: string): string {
  const url = new URL(href)
  url.searchParams.delete(PARAM)
  url.hash = `${PARAM}=${encoded}`
  return url.toString()
}

export function readSharedParam(loc: {
  search: string
  hash: string
}): { value: string; legacy: boolean } | null {
  const fromHash = new URLSearchParams(loc.hash.replace(/^#/, '')).get(PARAM)
  if (fromHash) return { value: fromHash, legacy: false }
  const fromQuery = new URLSearchParams(loc.search).get(PARAM)
  if (fromQuery) return { value: fromQuery, legacy: true }
  return null
}

export function withoutLegacyParam(href: string): string {
  const url = new URL(href)
  const value = url.searchParams.get(PARAM)
  if (!value) return href
  return buildShareUrl(href, value)
}

export async function encodeState(state: Record<string, unknown>): Promise<string> {
  const envelope: ShareEnvelope = { v: 1, state }
  const json = JSON.stringify(envelope)
  const raw = new TextEncoder().encode(json)

  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(raw)
  writer.close()

  const compressed = await new Response(cs.readable).arrayBuffer()
  return toBase64Url(compressed)
}

export async function decodeState(
  param: string | null
): Promise<Record<string, unknown> | null> {
  if (!param) return null
  try {
    const compressed = fromBase64Url(param)
    const ds = new DecompressionStream('deflate-raw')

    // Use a manual reader + writer loop so we can properly cancel both sides
    // on error, preventing unhandled rejections from Node.js's native zlib stream.
    const writer = ds.writable.getWriter()
    const reader = ds.readable.getReader()

    // Kick off the write concurrently; errors surface on the read side.
    const writePromise = writer
      .write(compressed as unknown as Uint8Array<ArrayBuffer>)
      .then(() => writer.close())
      .catch(() => {
        /* will surface as a read error */
      })

    const chunks: Uint8Array[] = []
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
    } catch {
      // Explicitly cancel both sides to absorb any pending native stream errors.
      reader.cancel().catch(() => {})
      writer.abort().catch(() => {})
      return null
    } finally {
      reader.releaseLock()
    }

    await writePromise

    const total = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    const json = new TextDecoder().decode(result)
    const envelope: unknown = JSON.parse(json)

    if (
      typeof envelope !== 'object' ||
      envelope === null ||
      (envelope as ShareEnvelope).v !== 1 ||
      typeof (envelope as ShareEnvelope).state !== 'object' ||
      (envelope as ShareEnvelope).state === null
    ) {
      return null
    }

    return (envelope as ShareEnvelope).state
  } catch {
    return null
  }
}
