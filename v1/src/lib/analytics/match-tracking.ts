/**
 * Match Interaction Tracking — 추천/매치 카드의 노출·클릭·전환을 PostHog 로 캡처.
 *
 * 목적:
 *   1. 매치 품질 관측성 (CTR by score band, by sort method, by surface)
 *   2. 추천 알고리즘 A/B 비교용 베이스라인 데이터
 *   3. 향후 collaborative filtering / 학습 신호로 재활용
 *
 * 설계 원칙:
 *   - 매치 노출(impression)은 viewport 진입 시 한 번만 발화 (중복 방지)
 *   - PII 없음 — userId/targetId 모두 PostHog distinctId 또는 properties.target_id 로만
 *   - 실패해도 호출자 흐름 막지 않음 (PostHog 미설치/네트워크 오류 무시)
 *   - 서버사이드 매치 결정(추천 API)은 별도 captureServerEvent 로 처리
 *
 * 이벤트 명명 규칙:
 *   match_<surface>_<action>
 *   - match_people_impression  : 사람 카드 노출 (network/explore 양쪽)
 *   - match_people_click       : 사람 카드 클릭 → 모달 또는 /u/[id]
 *   - match_project_impression : 프로젝트 카드 노출
 *   - match_project_click      : 프로젝트 카드 클릭
 *   - match_apply              : 매치된 프로젝트에 지원 (서버 발화)
 */

'use client'

import posthog from 'posthog-js'

/** 매치 카드가 노출된 surface — analytics 슬라이싱 기준 */
export type MatchSurface =
  | 'network'           // /network 그리드
  | 'explore_people'    // /explore?tab=people
  | 'explore_projects'  // /explore?tab=projects
  | 'dashboard'         // 대시보드 추천 위젯
  | 'profile_modal'     // 프로필 상세 모달
  | 'project_detail'    // 프로젝트 상세

export type MatchSortMethod = 'ai' | 'latest' | 'popular' | 'unspecified'

export type MatchKind = 'people' | 'project'

interface BaseProps {
  surface: MatchSurface
  sortMethod: MatchSortMethod
  /** 0-100 — 매치 점수가 없으면 null */
  matchScore: number | null
  /** 카드의 리스트 내 위치 (0-indexed) — CTR by position 분석용 */
  position?: number
  /** 어떤 dimension 이 가장 높았는지 — 'skill'|'interest'|'situation'|'teamfit' 등 */
  topDimension?: string | null
}

interface ImpressionProps extends BaseProps {
  /** 매치 대상 (user_id 또는 opportunity_id) — 익명화된 식별자 */
  targetId: string
}

interface ClickProps extends ImpressionProps {
  /** 클릭 → 다음 화면이 모달인지 페이지인지 */
  destination?: 'modal' | 'page'
}

/**
 * 동일 세션에서 같은 (surface, target) 임프레션 중복 방지 — 메모리 Set.
 * 페이지 새로고침/탭 전환마다 리셋되어도 OK (세션 단위 분석에 충분).
 */
const impressionDedup = new Set<string>()

function impressionKey(p: { surface: MatchSurface; targetId: string }): string {
  return `${p.surface}:${p.targetId}`
}

/**
 * 매치 카드가 viewport 에 들어왔을 때 호출.
 * IntersectionObserver 등에서 트리거하며, 동일 (surface, target) 은 세션당 1회만.
 */
export function trackMatchImpression(
  kind: MatchKind,
  props: ImpressionProps,
): void {
  try {
    const key = impressionKey(props)
    if (impressionDedup.has(key)) return
    impressionDedup.add(key)

    posthog.capture(`match_${kind === 'people' ? 'people' : 'project'}_impression`, {
      surface: props.surface,
      sort_method: props.sortMethod,
      match_score: props.matchScore,
      score_band: scoreBand(props.matchScore),
      position: props.position ?? null,
      top_dimension: props.topDimension ?? null,
      target_id: props.targetId,
    })
  } catch {
    // PostHog 미초기화/네트워크 오류 등은 조용히 무시 — 호출자 흐름 보호
  }
}

/**
 * 매치 카드 클릭 시 호출. 임프레션과 달리 중복 허용 (한 카드 여러 번 클릭 가능).
 */
export function trackMatchClick(
  kind: MatchKind,
  props: ClickProps,
): void {
  try {
    posthog.capture(`match_${kind === 'people' ? 'people' : 'project'}_click`, {
      surface: props.surface,
      sort_method: props.sortMethod,
      match_score: props.matchScore,
      score_band: scoreBand(props.matchScore),
      position: props.position ?? null,
      top_dimension: props.topDimension ?? null,
      destination: props.destination ?? null,
      target_id: props.targetId,
    })
  } catch {
    // noop
  }
}

/**
 * 페이지 전환·sortBy 변경 시 호출하여 dedup set 을 비운다.
 * 같은 카드가 다른 정렬에서 다시 노출되면 새 임프레션으로 셈.
 */
export function resetMatchImpressionDedup(): void {
  impressionDedup.clear()
}

/**
 * 매치 점수 → 분석용 밴드 분류.
 * PostHog 에서 funnel/cohort 분석할 때 score 자체보다 밴드별 CTR 비교가 의미 있음.
 */
function scoreBand(score: number | null): string {
  if (score == null) return 'unscored'
  if (score >= 80) return '80-100'
  if (score >= 60) return '60-79'
  if (score >= 40) return '40-59'
  if (score >= 20) return '20-39'
  return '0-19'
}
