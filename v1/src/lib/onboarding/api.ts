import type { ProfileDraft, StructuredResponse } from './types'

// ─── Error classification ───
// 각 에러 유형에 따라 UI 는 다르게 응답해야 한다.
export type OnboardingErrorKind =
  | 'network' // 인터넷 연결 문제 (재시도 가치 있음)
  | 'rate_limit' // 429 — 잠시 후 재시도
  | 'auth' // 401 — 재로그인 필요
  | 'validation' // 400 — 사용자 입력 문제, 재시도 불가
  | 'server' // 500 — 재시도 가치 있음
  | 'unknown'

export class OnboardingError extends Error {
  constructor(
    public kind: OnboardingErrorKind,
    message: string,
    public retryAfterSec?: number,
  ) {
    super(message)
    this.name = 'OnboardingError'
  }
}

function classifyError(status: number): OnboardingErrorKind {
  if (status === 401) return 'auth'
  if (status === 400 || status === 422) return 'validation'
  if (status === 429) return 'rate_limit'
  if (status >= 500) return 'server'
  return 'unknown'
}

const FRIENDLY_MESSAGES: Record<OnboardingErrorKind, string> = {
  network: '인터넷 연결이 불안정합니다. 입력하신 내용은 기기에 보관되어 있으니 연결을 확인하신 뒤 다시 시도해 주세요.',
  rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  auth: '로그인이 만료되었습니다. 입력하신 내용은 기기에 보관되어 있으며, 다시 로그인하시면 이어서 진행하실 수 있습니다.',
  validation: '입력하신 내용에 문제가 있습니다. 각 항목을 다시 확인해 주세요.',
  server: '저장소 쪽에 문제가 있어 잠시 저장이 지연되고 있습니다. 입력하신 내용은 기기에 보관되어 있습니다.',
  unknown: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
}

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof OnboardingError) {
    return FRIENDLY_MESSAGES[err.kind] + (err.retryAfterSec ? ` (${err.retryAfterSec}초 후)` : '')
  }
  // TypeError: fetch 자체 실패 (network)
  if (err instanceof TypeError) return FRIENDLY_MESSAGES.network
  return FRIENDLY_MESSAGES.unknown
}

/**
 * Exponential backoff with jitter. 네트워크·서버 에러만 재시도, 4xx 는 즉시 포기.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { maxRetries?: number; signal?: AbortSignal } = {},
): Promise<Response> {
  const maxRetries = options.maxRetries ?? 2
  let lastErr: unknown = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: options.signal })
      // 4xx 는 재시도해도 같음
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res
      }
      // 429 / 5xx 는 재시도
      if (!res.ok && attempt < maxRetries) {
        const retryAfter = res.headers.get('Retry-After')
        const waitSec = retryAfter ? parseInt(retryAfter, 10) || 1 : Math.min(2 ** attempt, 4)
        await new Promise(r => setTimeout(r, waitSec * 1000 + Math.random() * 300))
        continue
      }
      return res
    } catch (err) {
      lastErr = err
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, (2 ** attempt) * 1000 + Math.random() * 300))
        continue
      }
    }
  }
  throw lastErr ?? new OnboardingError('network', '네트워크 오류')
}

/** Save profile checkpoint (basic data, onboarding_completed: true) */
export async function saveProfileCheckpoint(profile: ProfileDraft): Promise<void> {
  let res: Response
  try {
    res = await fetchWithRetry('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: profile.name.trim(),
        desiredPosition: profile.position,
        affiliationType: profile.affiliationType || 'student',
        university: profile.university || undefined,
        major: profile.major || undefined,
        location: profile.locations.length > 0 ? profile.locations.join(', ') : undefined,
        currentSituation: profile.situation || undefined,
        skills: profile.skills.map(s => ({ name: s })),
        interestTags: profile.interests,
        personality: { risk: 3, time: 3, communication: 3, planning: 3, quality: 3, teamRole: 3 },
        // 2026-04-23: 유입 경로. 이후 GuideCTA 가 경로별 랜딩을 결정.
        onboardingSource: profile.source,
        // Phase 1-a
        studentId: profile.studentId,
        department: profile.department,
        universityId: profile.universityId,
        entranceYear: profile.entranceYear,
        // P0-1c: PIPA 동의 기록. IntroScreen 에서 필수 3종 체크 없이는 시작 자체가 불가.
        dataConsent: true,
      }),
    })
  } catch (err) {
    throw new OnboardingError('network', friendlyErrorMessage(err))
  }
  if (!res.ok) {
    const kind = classifyError(res.status)
    const retryAfter = res.headers.get('Retry-After')
    throw new OnboardingError(
      kind,
      FRIENDLY_MESSAGES[kind],
      retryAfter ? parseInt(retryAfter, 10) : undefined,
    )
  }
}

/** Save profile after scripted interview — single API call handles everything */
export async function saveProfileFromInterview(
  profile: ProfileDraft,
  structuredResponses: StructuredResponse[],
): Promise<void> {
  const byId = Object.fromEntries(structuredResponses.map(r => [r.questionId, r.value]))

  // ── All 5 spectrum values: direct 1-5 scale ──
  const communication = (byId['spectrum_communication'] as number | undefined) ?? 3
  const risk = (byId['spectrum_risk'] as number | undefined) ?? 3
  const planning = (byId['spectrum_planning'] as number | undefined) ?? 3
  const quality = (byId['spectrum_quality'] as number | undefined) ?? 3
  const teamRole = (byId['spectrum_teamrole'] as number | undefined) ?? 3

  const hoursRaw = byId['quick_number_hours'] as { hours?: number; semesterAvailable?: boolean } | undefined
  const hours = hoursRaw?.hours ?? 10
  const time = Math.min(Math.round(hours / 6), 5) || 1

  const strengthsRaw = byId['emoji_grid_strengths'] as string[] | undefined

  // ── Vision summary (for profile display + matching) ──
  const visionSummary = {
    work_style: { planning },
    team_preference: {
      role: teamRole >= 4 ? '리더' : teamRole <= 2 ? '팔로워' : '유연',
    },
    strengths: strengthsRaw,
    availability: {
      hours_per_week: hours,
      semester_available: hoursRaw?.semesterAvailable,
    },
  }

  let res: Response
  try {
    res = await fetchWithRetry('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: profile.name.trim(),
        desiredPosition: profile.position,
        affiliationType: profile.affiliationType || 'student',
        university: profile.university || undefined,
        major: profile.major || undefined,
        location: profile.locations.length > 0 ? profile.locations.join(', ') : undefined,
        currentSituation: profile.situation || 'exploring',
        skills: profile.skills.map(s => ({ name: s })),
        interestTags: profile.interests,
        personality: { risk, time, communication, planning, quality, teamRole },
        visionSummary: JSON.stringify(visionSummary),
        aiChatCompleted: true,
        // 2026-04-23: 유입 경로 (interview 단계에서는 이미 checkpoint 로 저장했지만
        // 직접 진입 케이스 대비 중복 전송).
        onboardingSource: profile.source,
        // Phase 1-a
        studentId: profile.studentId,
        department: profile.department,
        universityId: profile.universityId,
        entranceYear: profile.entranceYear,
        // P0-1c: PIPA 동의 기록. IntroScreen 에서 필수 3종 체크 없이는 시작 자체가 불가.
        dataConsent: true,
      }),
    })
  } catch (err) {
    throw new OnboardingError('network', friendlyErrorMessage(err))
  }

  if (!res.ok) {
    const kind = classifyError(res.status)
    const errData = await res.json().catch(() => null)
    const serverMsg = errData?.error?.message || (typeof errData?.error === 'string' ? errData.error : null)
    const retryAfter = res.headers.get('Retry-After')
    throw new OnboardingError(
      kind,
      serverMsg || FRIENDLY_MESSAGES[kind],
      retryAfter ? parseInt(retryAfter, 10) : undefined,
    )
  }
}
