// UUID v4 — delegate to native crypto
export function generateUUIDv4(): string {
  return crypto.randomUUID()
}

// UUID v7 — RFC 9562
// Layout: 48-bit unix_ts_ms | 4-bit ver=7 | 12-bit rand_a | 2-bit var=10 | 62-bit rand_b
let _lastMs = 0
let _lastRandA = 0

export function generateUUIDv7(): string {
  const ms = Date.now()
  const rand = crypto.getRandomValues(new Uint8Array(10))

  // rand is guaranteed 10 bytes; non-null assertions are safe here
  let randA = ((rand[0]! & 0x0f) << 8) | rand[1]!
  if (ms === _lastMs) {
    randA = (_lastRandA + 1) & 0x0fff
  }
  _lastMs = ms
  _lastRandA = randA

  const tsHex = ms.toString(16).padStart(12, '0')
  const randAHex = (0x7000 | randA).toString(16).padStart(4, '0')
  const varByte = (rand[2]! & 0x3f) | 0x80
  const randBBytes = [varByte, rand[3]!, rand[4]!, rand[5]!, rand[6]!, rand[7]!, rand[8]!, rand[9]!]
  const randBHex = randBBytes.map((b) => b.toString(16).padStart(2, '0')).join('')

  return `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-${randAHex}-${randBHex.slice(0, 4)}-${randBHex.slice(4)}`
}

// ULID — https://github.com/ulid/spec
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function encodeBase32(value: bigint, chars: number): string {
  let result = ''
  for (let i = 0; i < chars; i++) {
    result = CROCKFORD[Number(value & 31n)]! + result
    value >>= 5n
  }
  return result
}

let _lastUlidMs = 0
let _lastUlidRand = 0n

export function generateULID(): string {
  const ms = Date.now()
  let rand: bigint

  if (ms === _lastUlidMs) {
    rand = _lastUlidRand + 1n
  } else {
    const bytes = crypto.getRandomValues(new Uint8Array(10))
    rand = bytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n)
  }

  _lastUlidMs = ms
  _lastUlidRand = rand

  return encodeBase32(BigInt(ms), 10) + encodeBase32(rand, 16)
}
