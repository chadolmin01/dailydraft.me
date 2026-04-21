/**
 * PostHog Feature Flags 래퍼.
 *
 * 서버·클라 양쪽에서 일관된 API 로 flag 조회.
 *   - 서버: posthog-node 인스턴스로 RPC-style 조회
 *   - 클라: posthog-js 의 getFeatureFlag / isFeatureEnabled
 *
 * 운영 원칙:
 *   - 각 flag 의 default 값을 여기에 명시 — PostHog 연결 실패 시 안전한 fallback
 *   - flag 키는 snake_case 로 통일. 예: 'welcome_wizard_v2'
 *   - 새 flag 추가 시 이 파일의 FLAG_DEFAULTS 에 먼저 등록 → 타입 안전 사용
 *
 * PostHog 연결 없으면(로컬 dev·key 미설정) 항상 default 반환.
 */

import posthog from 'posthog-js'
import { PostHog } from 'posthog-node'

export type FeatureFlagKey =
  | 'landing_hero_variant'       // 'A' | 'B' | ... — 랜딩 hero A/B 테스트
  | 'welcome_wizard_v2'          // boolean — 새 온보딩 wizard
  | 'command_palette_enabled'    // boolean — Cmd+K kill switch
  | 'linkedin_media_upload'      // boolean — LinkedIn 이미지 업로드 베타
  | 'institution_admin_dashboard_v2' // boolean — 기관 대시보드 새 버전
  | 'pro_tier_cta_visible'       // boolean — Pro 요금제 CTA 노출

/** 연결 실패·flag 미정의 시 폴백 */
export const FLAG_DEFAULTS: Record<FeatureFlagKey, string | boolean> = {
  landing_hero_variant: 'A',
  welcome_wizard_v2: false,
  command_palette_enabled: true,
  linkedin_media_upload: false,
  institution_admin_dashboard_v2: false,
  pro_tier_cta_visible: false,
}

// ===== Client (브라우저) =====

/**
 * 클라이언트 컴포넌트에서 flag 조회.
 * 'use client' 컴포넌트에서 import 후 호출.
 */
export function getClientFlag<K extends FeatureFlagKey>(key: K): (typeof FLAG_DEFAULTS)[K] {
  try {
    if (typeof window === 'undefined') return FLAG_DEFAULTS[key]
    const val = posthog.getFeatureFlag(key as string)
    if (val === undefined || val === null) return FLAG_DEFAULTS[key]
    // 타입 정리 — PostHog 는 string|boolean 반환
    if (typeof FLAG_DEFAULTS[key] === 'boolean') {
      return (val === true || val === 'true') as (typeof FLAG_DEFAULTS)[K]
    }
    return val as (typeof FLAG_DEFAULTS)[K]
  } catch {
    return FLAG_DEFAULTS[key]
  }
}

/**
 * boolean flag 헬퍼 — 편의상 isEnabled 시맨틱 만족.
 */
export function isClientFlagEnabled(key: FeatureFlagKey): boolean {
  const val = getClientFlag(key)
  return val === true || val === 'true'
}

// ===== Server =====

let _serverClient: PostHog | null = null

function getServerClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (_serverClient) return _serverClient
  _serverClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return _serverClient
}

/**
 * 서버 컴포넌트·API 라우트에서 flag 조회.
 * distinctId 필수 — userId 또는 고정 'server' 등.
 */
export async function getServerFlag<K extends FeatureFlagKey>(
  key: K,
  distinctId: string,
): Promise<(typeof FLAG_DEFAULTS)[K]> {
  const client = getServerClient()
  if (!client) return FLAG_DEFAULTS[key]

  try {
    const val = await client.getFeatureFlag(key as string, distinctId)
    if (val === undefined || val === null) return FLAG_DEFAULTS[key]
    if (typeof FLAG_DEFAULTS[key] === 'boolean') {
      return (val === true || val === 'true') as (typeof FLAG_DEFAULTS)[K]
    }
    return val as (typeof FLAG_DEFAULTS)[K]
  } catch {
    return FLAG_DEFAULTS[key]
  }
}

export async function isServerFlagEnabled(
  key: FeatureFlagKey,
  distinctId: string,
): Promise<boolean> {
  const val = await getServerFlag(key, distinctId)
  return val === true || val === 'true'
}
