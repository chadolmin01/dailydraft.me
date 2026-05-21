// Gmail API wrapper — V1 은 drafts.create 만 사용 (D5: 자동 발송 X).
// scope: gmail.compose (드래프트 생성, 열기, 삭제 가능. 발송은 별도 scope 필요).

import { fetchWithRetry } from '@/src/lib/fetch-retry'

const GMAIL_DRAFTS_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'

export interface CreateDraftResult {
  id: string                 // draft id
  messageId: string          // 메시지 id
  threadId: string           // 스레드 id
  gmailUrl: string           // 매니저가 Gmail 에서 열어볼 수 있는 URL
}

/**
 * Gmail 초안함에 RFC 822 메시지를 새 draft 로 저장.
 *
 * 발송하지 않음 — 매니저가 Gmail 에서 직접 열어 검토 후 보냄.
 * 실패 시 throw (호출자가 mailto fallback 결정).
 */
export async function createGmailDraft(
  accessToken: string,
  input: { to: string[]; subject: string; body: string; cc?: string[]; bcc?: string[] },
): Promise<CreateDraftResult> {
  const mime = buildRfc822Message(input)
  const raw = base64Url(mime)

  const res = await fetchWithRetry(GMAIL_DRAFTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw } }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail draft create failed (${res.status}): ${text}`)
  }

  const data = await res.json() as { id: string; message: { id: string; threadId: string } }

  return {
    id: data.id,
    messageId: data.message.id,
    threadId: data.message.threadId,
    // Gmail 웹에서 초안함의 해당 draft 로 직접 이동
    gmailUrl: `https://mail.google.com/mail/u/0/#drafts?compose=${data.message.id}`,
  }
}

// ────────────────────────────────────────────────────────────
// RFC 822 메시지 빌더 — 한국어 제목 (UTF-8 base64 인코딩) 처리.
// 본문은 base64 transfer encoding 으로 안전하게.
// ────────────────────────────────────────────────────────────

interface MessageInput {
  to: string[]
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
}

function buildRfc822Message(input: MessageInput): string {
  const headers: string[] = []
  headers.push(`To: ${input.to.join(', ')}`)
  if (input.cc?.length) headers.push(`Cc: ${input.cc.join(', ')}`)
  if (input.bcc?.length) headers.push(`Bcc: ${input.bcc.join(', ')}`)
  headers.push(`Subject: ${encodeSubject(input.subject)}`)
  headers.push('MIME-Version: 1.0')
  headers.push('Content-Type: text/plain; charset=UTF-8')
  headers.push('Content-Transfer-Encoding: base64')

  const bodyBase64 = utf8ToBase64(input.body).match(/.{1,76}/g)?.join('\r\n') ?? ''
  return headers.join('\r\n') + '\r\n\r\n' + bodyBase64
}

// RFC 2047 encoded-word: =?UTF-8?B?<base64>?=
function encodeSubject(subject: string): string {
  // ASCII 만 있으면 인코딩 불필요
  if (/^[\x20-\x7E]*$/.test(subject)) return subject
  return `=?UTF-8?B?${utf8ToBase64(subject)}?=`
}

function utf8ToBase64(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64')
}

// Gmail API 는 base64url (RFC 4648 §5) 요구 — 표준 base64 의 +/= 를 -/_/생략 으로
function base64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
