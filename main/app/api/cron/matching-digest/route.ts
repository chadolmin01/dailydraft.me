/**
 * Matching Digest — 매일 09:00 KST (00:00 UTC)
 *
 * 어제 하루 매칭 관련 지표를 Discord 웹훅으로 발송.
 * PostHog UI 열지 않고도 "매칭이 작동하나" 감 잡는 daily pulse.
 *
 * 받는 곳: process.env.DISCORD_MATCHING_DIGEST_URL (private)
 * 미설정 시 조용히 skip — 실패 아님.
 *
 * 데이터 소스: DB 직접 쿼리 (PostHog API 의존성 없음)
 *   - applications (지원 건수 + match_score 분포)
 *   - profiles (온보딩 완료)
 *   - coffee_chats (커피챗 신청)
 *
 * 왜 PostHog 안 씀: PERSONAL_API_KEY 세팅 + PostHog SQL 쿼리 러닝 오버헤드.
 *   raw 이벤트 집계는 대시보드의 장점이고, "어제 지원 몇 건" 같은 간단 카운트는
 *   Supabase 쿼리가 훨씬 단순. 추후 CTR(impression→click) 필요해지면 PostHog
 *   API 추가 가능.
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withCronCapture } from '@/src/lib/posthog/with-cron-capture'

export const runtime = 'nodejs'

interface Application {
  match_score: number | null
  status: string | null
  created_at: string
}

interface ScoreDistribution {
  total: number
  avgScore: number
  band80Plus: number
  band60to79: number
  band40to59: number
  bandBelow40: number
}

function computeScoreDistribution(apps: Application[]): ScoreDistribution {
  const n = apps.length
  if (n === 0) {
    return { total: 0, avgScore: 0, band80Plus: 0, band60to79: 0, band40to59: 0, bandBelow40: 0 }
  }
  let sum = 0
  let band80 = 0, band60 = 0, band40 = 0, bandLow = 0
  for (const a of apps) {
    const s = a.match_score ?? 0
    sum += s
    if (s >= 80) band80++
    else if (s >= 60) band60++
    else if (s >= 40) band40++
    else bandLow++
  }
  return {
    total: n,
    avgScore: Math.round(sum / n),
    band80Plus: band80,
    band60to79: band60,
    band40to59: band40,
    bandBelow40: bandLow,
  }
}

function formatDigest(
  dateLabel: string,
  apps: ScoreDistribution,
  newProfiles: number,
  coffeeChats: number,
  acceptedApps: number,
): { embeds: Array<Record<string, unknown>> } {
  // 인사이트 한 줄 — 숫자만 주는 게 아니라 해석을 같이.
  let insight = ''
  if (apps.total === 0 && newProfiles === 0) {
    insight = '조용한 하루 — 트래픽 점검 필요할 수도'
  } else if (apps.band80Plus > 0 && apps.total > 0) {
    const highPct = Math.round((apps.band80Plus / apps.total) * 100)
    insight = `80+ 매치 ${apps.band80Plus}/${apps.total} (${highPct}%) — AI 정렬이 고신호 유도 중`
  } else if (apps.total > 0 && apps.avgScore < 40) {
    insight = '평균 매치 낮음 — 프로필 완성도 개선 필요'
  } else if (newProfiles > apps.total * 3) {
    insight = '유입은 있는데 지원 전환이 낮음 — empty state · 첫 매치 경험 점검'
  } else {
    insight = '정상 범위'
  }

  return {
    embeds: [
      {
        title: '📊 매칭 다이제스트',
        description: `어제 ${dateLabel} 요약`,
        color: 0x5E6AD2, // Electric Indigo (brand)
        fields: [
          {
            name: '🎯 지원',
            value: apps.total === 0
              ? '0건'
              : `**${apps.total}건** (평균 매치 ${apps.avgScore}%)\n└ 수락 ${acceptedApps}건`,
            inline: true,
          },
          {
            name: '☕ 커피챗',
            value: `${coffeeChats}건`,
            inline: true,
          },
          {
            name: '🆕 프로필 완성',
            value: `${newProfiles}명`,
            inline: true,
          },
          {
            name: '📈 매치 점수 분포',
            value: apps.total === 0
              ? '_지원 없음_'
              : [
                  `80+ : ${apps.band80Plus}`,
                  `60-79: ${apps.band60to79}`,
                  `40-59: ${apps.band40to59}`,
                  `<40 : ${apps.bandBelow40}`,
                ].join('\n'),
            inline: false,
          },
          {
            name: '💡 통찰',
            value: insight,
            inline: false,
          },
        ],
        footer: { text: 'PostHog 대시보드에서 상세 퍼널 확인 가능' },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

async function postToDiscord(webhookUrl: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[matching-digest] Discord webhook failed:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('[matching-digest] Discord post error:', e)
    return false
  }
}

export const POST = withCronCapture('matching-digest', async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return ApiResponse.unauthorized()
  }

  const webhookUrl = process.env.DISCORD_MATCHING_DIGEST_URL
  if (!webhookUrl) {
    // 미설정 — 조용히 OK (실패 아님). 셋업 전이거나 일시적으로 비활성.
    return ApiResponse.ok({ skipped: 'DISCORD_MATCHING_DIGEST_URL 미설정' })
  }

  const admin = createAdminClient()

  // 어제 00:00 ~ 오늘 00:00 (UTC 기준). KST 09:00 실행이면 어제 KST 09:00 ~ 오늘 KST 09:00
  // 이 되지만, 발송 시점이 오전이라 "어제" 로 느껴지는 감각이 맞음.
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const yesterday = new Date(today.getTime() - 86_400_000)
  const dateLabel = yesterday.toISOString().slice(0, 10) // YYYY-MM-DD

  // 3개 쿼리 병렬 — 서로 독립
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appsResult, profilesResult, coffeeResult] = await Promise.all([
    (admin as any)
      .from('applications')
      .select('match_score, status, created_at')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString()),
    (admin as any)
      .from('profiles')
      .select('user_id')
      .eq('onboarding_completed', true)
      .gte('updated_at', yesterday.toISOString())
      .lt('updated_at', today.toISOString()),
    (admin as any)
      .from('coffee_chats')
      .select('id')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString()),
  ])

  const apps = (appsResult.data || []) as Application[]
  const newProfiles = (profilesResult.data || []).length
  const coffeeChats = (coffeeResult.data || []).length
  const acceptedApps = apps.filter(a => a.status === 'accepted').length

  const distribution = computeScoreDistribution(apps)
  const payload = formatDigest(dateLabel, distribution, newProfiles, coffeeChats, acceptedApps)

  const posted = await postToDiscord(webhookUrl, payload)

  return ApiResponse.ok({
    date: dateLabel,
    posted,
    stats: {
      applications: apps.length,
      acceptedApps,
      newProfiles,
      coffeeChats,
    },
  })
})
