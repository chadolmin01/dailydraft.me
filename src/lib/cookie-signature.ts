/**
 * HMAC-SHA256 cookie signature using Web Crypto API (Edge Runtime compatible)
 *
 * Usage:
 *   const signed = await signCookie('value')     // → "value.signature"
 *   const value  = await verifyCookie(signed)     // → "value" | null
 */

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(COOKIE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer as ArrayBuffer
}

/** Sign a value → "value.hexSignature" */
export async function signCookie(value: string): Promise<string> {
  const key = await getKey()
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return `${value}.${bufToHex(sig)}`
}

/** Verify a signed cookie → original value or null if tampered */
export async function verifyCookie(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf('.')
  if (idx === -1) return null

  const value = signed.substring(0, idx)
  const sigHex = signed.substring(idx + 1)

  // Signature must be 64 hex chars (32 bytes SHA-256)
  if (sigHex.length !== 64) return null

  try {
    const key = await getKey()
    const enc = new TextEncoder()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBuf(sigHex),
      enc.encode(value),
    )
    return valid ? value : null
  } catch {
    return null
  }
}
