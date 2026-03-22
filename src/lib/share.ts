export const TOOL_STATE_REQUEST = 'tool-state-request'
export const TOOL_STATE_RESPONSE = 'tool-state-response'

type ShareEnvelope = { v: 1; state: Record<string, unknown> }

function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const result = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    result[i] = binary.charCodeAt(i)
  }
  return result
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
