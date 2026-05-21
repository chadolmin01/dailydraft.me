/**
 * Threads Publisher
 *
 * Threads Graph API는 LinkedIn과 달리 "2단계 발행"입니다:
 *   1. 미디어 컨테이너 생성 (POST /{ig-user-id}/threads)
 *   2. 컨테이너 발행 (POST /{ig-user-id}/threads_publish)
 *
 * 텍스트 전용 게시가 가능합니다 (Instagram과의 결정적 차이).
 * 글자수 제한: 500자.
 *
 * 요구 scope: threads_content_publish (App Review 통과 필수).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import { decryptToken } from '@/src/lib/personas/token-crypto'

type Client = SupabaseClient<Database>

export interface ThreadsPublishInput {
  personaId: string
  /** 본문 (500자 이하). 초과 시 API가 422 반환. */
  content: string
}

export interface ThreadsPublishResult {
  success: boolean
  /** 발행된 thread id (예: "17841...") */
  thread_id?: string
  /** 사용자에게 보여줄 퍼마링크 */
  permalink?: string
  error?: string
}

const MAX_CHARS = 500

/**
 * Threads 개인 계정에 글 게시.
 *
 * 실패 시나리오:
 *   - credentials 없음 → "연결되지 않음"
 *   - 토큰 만료 (190 Meta 에러) → "재연결 필요"
 *   - 글자수 초과 (>500)
 *   - 컨테이너 생성 후 publish 실패 (보통 컨테이너가 "not ready" 상태)
 */
export async function publishToThreads(
  supabase: Client,
  input: ThreadsPublishInput,
): Promise<ThreadsPublishResult> {
  if (input.content.length > MAX_CHARS) {
    return {
      success: false,
      error: `Threads는 ${MAX_CHARS}자 이하만 허용합니다 (현재 ${input.content.length}자).`,
    }
  }

  // 1) 자격증명 조회
  const { data: credRows, error: credErr } = await supabase
    .from('persona_channel_credentials')
    .select('*')
    .eq('persona_id', input.personaId)
    .eq('channel_type', 'threads')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)

  if (credErr) {
    return { success: false, error: `credential 조회 실패: ${credErr.message}` }
  }
  const cred = (credRows ?? [])[0] as
    | {
        account_ref: string
        encrypted_token: string | null
        expires_at: string | null
      }
    | undefined

  if (!cred || !cred.encrypted_token) {
    return {
      success: false,
      error: 'Threads가 연결되어 있지 않습니다. 먼저 연결해주세요.',
    }
  }

  if (cred.expires_at && new Date(cred.expires_at).getTime() < Date.now()) {
    return {
      success: false,
      error: 'Threads 토큰이 만료되었습니다. 다시 연결해주세요.',
    }
  }

  let accessToken: string
  try {
    accessToken = decryptToken(cred.encrypted_token)
  } catch (err) {
    return {
      success: false,
      error: `토큰 복호화 실패: ${(err as Error).message}`,
    }
  }

  const userId = cred.account_ref

  try {
    // 2) 미디어 컨테이너 생성 (text-only)
    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${encodeURIComponent(userId)}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          media_type: 'TEXT',
          text: input.content,
          access_token: accessToken,
        }),
      },
    )

    if (!createRes.ok) {
      const body = await createRes.text().catch(() => '')
      const msg = `Threads container ${createRes.status}: ${body.slice(0, 300)}`
      console.error('[threads-publisher]', msg)
      return { success: false, error: msg }
    }

    const createJson = (await createRes.json()) as { id: string }
    const containerId = createJson.id

    // 3) 발행. 컨테이너가 "ready" 상태가 아닐 수 있으므로 Meta 권장 대기(텍스트는 거의 즉시 ready).
    //    프로덕션에서 status=FINISHED 폴링하도록 추후 개선 가능. 지금은 단순 publish.
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${encodeURIComponent(userId)}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken,
        }),
      },
    )

    if (!publishRes.ok) {
      const body = await publishRes.text().catch(() => '')
      const msg = `Threads publish ${publishRes.status}: ${body.slice(0, 300)}`
      console.error('[threads-publisher]', msg)
      return { success: false, error: msg }
    }

    const publishJson = (await publishRes.json()) as { id: string }
    const threadId = publishJson.id

    // 4) 퍼마링크 조회 (선택 — 실패해도 발행 자체는 성공이므로 error 무시)
    let permalink: string | undefined
    try {
      const permRes = await fetch(
        `https://graph.threads.net/v1.0/${encodeURIComponent(threadId)}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`,
      )
      if (permRes.ok) {
        const permJson = (await permRes.json()) as { permalink?: string }
        permalink = permJson.permalink
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      thread_id: threadId,
      permalink,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[threads-publisher] 네트워크 오류:', msg)
    return { success: false, error: `네트워크 오류: ${msg}` }
  }
}
