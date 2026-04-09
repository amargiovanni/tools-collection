export function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  const padded = base64 + '==='.slice(0, padding)
  const binary = atob(padded)
  const result = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    result[i] = binary.charCodeAt(i)
  }

  return result
}
