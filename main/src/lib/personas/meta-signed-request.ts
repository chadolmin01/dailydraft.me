import crypto from 'node:crypto'

export interface MetaSignedRequest {
  algorithm: string
  issued_at?: number
  user_id: string
}

// Meta의 deauthorize/data-deletion 웹훅은 signed_request(`{sig}.{payload}`)로 옴.
// payload 는 base64url JSON. sig 는 HMAC-SHA256(payload, client_secret).
// 서명 검증 실패 시 null. 호출부는 반드시 null 체크해서 400으로 응답할 것.
export function verifyMetaSignedRequest(
  signedRequest: string,
  clientSecret: string,
): MetaSignedRequest | null {
  if (!signedRequest || typeof signedRequest !== 'string') return null
  const [encodedSig, payload] = signedRequest.split('.')
  if (!encodedSig || !payload) return null

  const expected = crypto
    .createHmac('sha256', clientSecret)
    .update(payload)
    .digest()

  let received: Buffer
  try {
    received = Buffer.from(encodedSig, 'base64url')
  } catch {
    return null
  }

  if (received.length !== expected.length) return null
  if (!crypto.timingSafeEqual(received, expected)) return null

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    const data = JSON.parse(json) as MetaSignedRequest
    if (!data.user_id) return null
    return data
  } catch {
    return null
  }
}
