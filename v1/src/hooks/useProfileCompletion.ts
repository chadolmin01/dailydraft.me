import { useMemo } from 'react'
import type { Profile } from '@/components/profile/types'

/**
 * 프로필 완성도 계산.
 * 매칭 정확도에 직접 영향 주는 필드 우선 가중:
 *   - 기본 정체성: 닉네임·포지션·대학교 (매칭 쿼리 기본 조건)
 *   - 자기소개·기술·관심사: AI 매칭 벡터 품질 향상
 *   - AI 인터뷰: 작업 스타일 시그널 풍부화
 *
 * hint 는 UI 카드에서 "이걸 채우면 뭐가 좋은가" 노출용.
 */
export function useProfileCompletion(profile: Profile | null | undefined) {
  return useMemo(() => {
    const bio = profile?.bio ?? null
    const skills = profile?.skills as Array<{ name: string; level: string }> | null
    const interests = profile?.interest_tags as string[] | null

    const fields = [
      { label: '닉네임', done: !!profile?.nickname, hint: '매칭 대상이 나를 발견하는 첫 단서' },
      { label: '포지션', done: !!profile?.desired_position, hint: '필요 역할 매칭의 기본 키' },
      { label: '대학교', done: !!profile?.university, hint: '같은 캠퍼스 팀 우선 추천' },
      { label: '자기소개', done: !!bio, hint: 'AI 가 어조·가치관을 학습' },
      { label: '기술', done: !!(skills && skills.length > 0), hint: '역할별 skill fit 계산' },
      { label: '관심사', done: !!(interests && interests.length > 0), hint: '도메인 매칭 정확도' },
      { label: 'AI 인터뷰', done: !!profile?.ai_chat_completed, hint: '작업 스타일·협업 선호 학습' },
    ]
    const completedCount = fields.filter(f => f.done).length
    const pct = Math.round((completedCount / fields.length) * 100)

    return { fields, completedCount, pct }
  }, [profile])
}
