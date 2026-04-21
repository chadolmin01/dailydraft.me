import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '쿠키 사용 방침 · Draft',
  description:
    'Draft 가 사용하는 쿠키·로컬 스토리지 전수 공개. 필수·기능·측정·광고 카테고리별 설명, 보관 기간, 옵트아웃 경로를 제공합니다.',
  alternates: { canonical: '/legal/cookies' },
  openGraph: {
    type: 'article',
    title: '쿠키 사용 방침 · Draft',
    description: 'Draft 가 사용하는 쿠키·로컬 스토리지 전수 공개.',
    url: '/legal/cookies',
    locale: 'ko_KR',
  },
}

/**
 * /legal/cookies — 쿠키·스토리지 전수 공개.
 *
 * 목적:
 *   - PIPA 시행령 안내 + ePrivacy 유사 권고(Cookie Consent) 대응.
 *   - 엔터프라이즈 보안팀 검토에서 자주 요구되는 "사용 쿠키 전수" 항목 충족.
 *
 * 카테고리:
 *   1. Strictly Necessary (필수) — 인증·CSRF·보안
 *   2. Functional (기능) — 설정 저장
 *   3. Analytics (측정) — PostHog
 *   4. (해당 없음) 광고·프로파일링
 */

interface CookieRow {
  name: string
  provider: string
  purpose: string
  duration: string
  type: 'essential' | 'functional' | 'analytics'
}

const COOKIES: CookieRow[] = [
  {
    name: 'sb-*-auth-token',
    provider: 'Supabase',
    purpose: '로그인 세션 유지 (JWT). 재방문 시 인증 상태 복원.',
    duration: '1시간 (액세스) / 30일 (리프레시) 갱신형',
    type: 'essential',
  },
  {
    name: 'sb-*-auth-token-code-verifier',
    provider: 'Supabase',
    purpose: 'OAuth PKCE flow code verifier. CSRF 방어.',
    duration: '세션',
    type: 'essential',
  },
  {
    name: '__cf_bm',
    provider: 'Cloudflare',
    purpose: 'Bot 방어 · 관리 챌린지 결과 캐시.',
    duration: '30분',
    type: 'essential',
  },
  {
    name: 'vercel-*',
    provider: 'Vercel',
    purpose: '배포 스티키 세션 · Preview 리다이렉트.',
    duration: '최대 1년',
    type: 'essential',
  },
  {
    name: 'draft.onboarding.*',
    provider: 'Draft (localStorage)',
    purpose: '온보딩 진행 상태 저장(부분 완료 복원).',
    duration: '완료 시까지',
    type: 'functional',
  },
  {
    name: 'draft.theme',
    provider: 'Draft (localStorage)',
    purpose: '사용자 테마 설정(시스템/라이트/다크).',
    duration: '영구 (수동 변경 또는 로그아웃까지)',
    type: 'functional',
  },
  {
    name: 'ph_*_posthog',
    provider: 'PostHog',
    purpose: '제품 분석·에러 추적·기능 플래그 식별자.',
    duration: '1년',
    type: 'analytics',
  },
  {
    name: '_ga / _ga_*',
    provider: 'Google Analytics',
    purpose: '방문자 통계(익명 집계). GA4 기준.',
    duration: '2년',
    type: 'analytics',
  },
]

const TYPE_LABEL: Record<CookieRow['type'], { label: string; color: string }> = {
  essential: { label: '필수', color: 'bg-brand-bg text-brand' },
  functional: { label: '기능', color: 'bg-status-info-bg text-status-info-text' },
  analytics: { label: '측정', color: 'bg-status-warn-bg text-status-warn-text' },
}

export default function CookiePolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-brand mb-3">법적 고지</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">쿠키 사용 방침</h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          Draft 는 서비스 운영에 필요한 최소한의 쿠키와 로컬 스토리지만 사용합니다. 광고·프로파일링·
          제3자 판매 목적의 쿠키는 사용하지 않습니다.
        </p>
        <p className="text-[12px] text-txt-tertiary mt-3">최종 개정: 2026-04-22</p>
      </header>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">1. 카테고리 요약</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-txt-primary">필수 (Strictly Necessary):</strong> 로그인 세션,
            CSRF 방어, 봇 차단. 해제 시 서비스 이용 불가.
          </li>
          <li>
            <strong className="text-txt-primary">기능 (Functional):</strong> 온보딩 진행, 테마 설정.
            해제 시 재방문 시 초기값으로 복원됩니다.
          </li>
          <li>
            <strong className="text-txt-primary">측정 (Analytics):</strong> PostHog, Google
            Analytics. 익명 집계 위주이며 브라우저 Do-Not-Track 신호 존중.
          </li>
          <li className="text-txt-tertiary">
            광고·프로파일링은 사용하지 않습니다.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">2. 사용 쿠키 전수</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-sunken text-txt-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">이름</th>
                <th className="text-left px-4 py-3 font-semibold">제공자</th>
                <th className="text-left px-4 py-3 font-semibold">목적</th>
                <th className="text-left px-4 py-3 font-semibold">보관</th>
                <th className="text-left px-4 py-3 font-semibold">분류</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COOKIES.map((c) => {
                const badge = TYPE_LABEL[c.type]
                return (
                  <tr key={c.name} className="align-top">
                    <td className="px-4 py-3 font-mono text-[12px] text-txt-primary">{c.name}</td>
                    <td className="px-4 py-3 text-txt-secondary">{c.provider}</td>
                    <td className="px-4 py-3 text-txt-secondary">{c.purpose}</td>
                    <td className="px-4 py-3 text-txt-secondary">{c.duration}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">3. 옵트아웃</h2>
        <p>
          측정 카테고리 쿠키는 브라우저의 Do-Not-Track(DNT) 또는 Global Privacy Control(GPC) 신호를
          자동으로 존중합니다. 추가로 브라우저 설정에서 사이트별 쿠키를 차단하실 수 있습니다.
        </p>
        <p>
          필수·기능 쿠키는 서비스 제공을 위한 최소 범위이므로 별도 옵트아웃 수단을 제공하지 않습니다.
          이용을 원치 않으시면 회원 탈퇴로 처리됩니다.
        </p>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">4. 변경 고지</h2>
        <p>
          신규 쿠키 추가 또는 기존 쿠키의 보관 기간·범위 확대가 발생하면 본 페이지 갱신과 함께{' '}
          <Link href="/changelog" className="text-brand underline">
            공개 릴리스 노트
          </Link>
          에 기재합니다.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          본 방침은{' '}
          <Link href="/legal/privacy" className="text-brand underline">
            개인정보처리방침
          </Link>
          의 일부를 구성합니다. 상충 시 본문을 우선합니다.
        </p>
        <p>
          문의:{' '}
          <a href="mailto:team@dailydraft.me?subject=Cookie%20Policy" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
      </footer>
    </main>
  )
}
