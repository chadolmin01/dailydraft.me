/**
 * LinkedIn Publisher
 *
 * persona_channel_credentials의 암호화된 access_token으로
 * POST /v2/ugcPosts 호출 → 개인 프로필에 글 게시.
 *
 * 요구 scope: w_member_social
 * 발행 대상: 개인 피드 (urn:li:person:{sub})
 * Company Page 게시는 Marketing Developer Platform 승인 후 별도 구현.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import { decryptToken } from '@/src/lib/personas/token-crypto'

type Client = SupabaseClient<Database>

export interface LinkedInPublishInput {
  personaId: string
  /** 발행할 본문 (hashtags 포함, 3000자 이하) */
  content: string
  /** visibility — PUBLIC(공개) / CONNECTIONS(1촌) */
  visibility?: 'PUBLIC' | 'CONNECTIONS'
}

export interface LinkedInPublishResult {
  success: boolean
  /** 발행된 포스트 URN. 예: urn:li:share:123... */
  post_urn?: string
  /** 사용자에게 보여줄 링크 (본인 프로필 활동 피드). 정확한 single-post URL은 API가 주지 않음. */
  profile_activity_url?: string
  error?: string
}

/**
 * LinkedIn 개인 프로필에 글 게시.
 *
 * 실패 시나리오:
 *   - credentials 없음 → "연결되지 않음"
 *   - 토큰 만료 (401) → "재연결 필요"
 *   - 글자수 초과 (422)
 *   - 알 수 없는 에러 (5xx)
 */
export async function publishToLinkedIn(
  supabase: Client,
  input: LinkedInPublishInput,
): Promise<LinkedInPublishResult> {
  // 1) active credential 조회 (같은 페르소나에 여러 개면 가장 최근)
  const { data: credRows, error: credErr } = await supabase
    .from('persona_channel_credentials')
    .select('*')
    .eq('persona_id', input.personaId)
    .eq('channel_type', 'linkedin')
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
      error: 'LinkedIn이 연결되어 있지 않습니다. 먼저 연결해주세요.',
    }
  }

  // 토큰 만료 확인
  if (cred.expires_at && new Date(cred.expires_at).getTime() < Date.now()) {
    return {
      success: false,
      error: 'LinkedIn 토큰이 만료되었습니다. 다시 연결해주세요.',
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

  // 2) UGC Post API 호출
  const authorUrn = `urn:li:person:${cred.account_ref}`
  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: input.content },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': input.visibility ?? 'PUBLIC',
    },
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const msg = `LinkedIn API ${res.status}: ${body.slice(0, 300)}`
      console.error('[linkedin-publisher]', msg)
      return { success: false, error: msg }
    }

    // LinkedIn은 성공 시 응답 헤더 x-restli-id 또는 body의 id 필드로 URN 반환
    const postUrn =
      res.headers.get('x-restli-id') ||
      ((await res.json().catch(() => ({}))) as { id?: string }).id

    return {
      success: true,
      post_urn: postUrn ?? undefined,
      // LinkedIn은 단일 post URL을 직접 주지 않음. 프로필 활동 피드 링크로 대체.
      profile_activity_url: `https://www.linkedin.com/in/${cred.account_ref}/recent-activity/all/`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[linkedin-publisher] 네트워크 오류:', msg)
    return { success: false, error: `네트워크 오류: ${msg}` }
  }
}
