import nacl from 'tweetnacl'

// Discord 인터랙션 서명 검증 유틸.
// tweetnacl 사용 — Vercel Serverless 에서 안정적으로 동작.

const APP_PUBLIC_KEY = process.env.DISCORD_APP_PUBLIC_KEY ?? ''

/**
 * Ed25519 서명 검증 (Discord 필수 요구사항).
 * 엔드포인트 등록 시 Discord 가 서명된 PING 요청을 보내므로 반드시 통과해야 함.
 */
export function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!APP_PUBLIC_KEY) return false

  try {
    const sig = hexToUint8Array(signature)
    const publicKey = hexToUint8Array(APP_PUBLIC_KEY)
    const message = new TextEncoder().encode(timestamp + body)

    return nacl.sign.detached.verify(message, sig, publicKey)
  } catch {
    return false
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}
