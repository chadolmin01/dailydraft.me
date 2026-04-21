import type { Metadata } from 'next'
import Link from 'next/link'
import { Code, ExternalLink, Clock, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: '공개 API · Draft',
  description: 'Draft 가 제공하는 공개(익명 접근 가능) API 엔드포인트 목록. RSS 피드·지표·인시던트·QR 생성 등. 파트너·자동화 도구 연동에 사용하세요.',
  alternates: { canonical: '/api-docs' },
  openGraph: {
    type: 'article',
    title: '공개 API · Draft',
    description: '공개 API 엔드포인트 레퍼런스',
    url: '/api-docs',
    locale: 'ko_KR',
  },
}

/**
 * /api-docs — 공개 API 레퍼런스.
 *
 * 대상: 외부 파트너·자동화 도구 빌더·엔터프라이즈 통합.
 * 로그인 불필요. 개별 엔드포인트의 상세는 각 /api/... 코드에 docstring 으로 존재.
 */
export default function ApiDocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Code size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">Public API</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          공개 API 레퍼런스
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          로그인 없이 접근 가능한 엔드포인트만 정리합니다. 인증이 필요한 내부 API (클럽 관리·결제·관리자) 는 제외됩니다. RLS 정책이 앤온 접근 범위를 제한하므로 모든 응답은 공개 데이터에 한정됩니다.
        </p>
      </header>

      {/* 지표 */}
      <Section title="지표 · 텔레메트리">
        <EndpointCard
          method="GET"
          path="/api/metrics/public"
          desc="공개 집계 지표 5종 — public clubs, active opportunities, public profiles, weekly_updates 90일, public universities unique count."
          cache="10분 edge + stale 1시간"
          sample={`{
  "clubs_public": 12,
  "active_opportunities": 34,
  "profiles_public": 128,
  "weekly_updates_recent": 76,
  "public_universities": 5,
  "fetched_at": "2026-04-22T14:30:00.000Z"
}`}
        />

        <EndpointCard
          method="GET"
          path="/api/status/incidents"
          desc="공개 인시던트 이력 — SEV-0/1 장애의 타임라인·영향 컴포넌트·요약. 최근 30일 기본."
          params="since(ISO), limit(기본 20, 최대 50)"
          cache="1분 edge + stale 5분"
          sample={`{
  "incidents": [
    {
      "id": "uuid",
      "title": "DB timeout during morning peak",
      "severity": "sev2",
      "status": "resolved",
      "started_at": "...",
      "resolved_at": "...",
      "summary": "..."
    }
  ],
  "since": "...",
  "fetched_at": "..."
}`}
        />
      </Section>

      {/* QR */}
      <Section title="QR 생성">
        <EndpointCard
          method="GET"
          path="/api/qr?value=<string>&size=<int>"
          desc="임의 문자열의 QR 코드 SVG 생성. 공개 프로필 명함·클럽 초대·이벤트 체크인 등에서 사용. value ≤ 512자, size 64~1024."
          cache="1시간 edge"
          sample={`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">...</svg>`}
        />
      </Section>

      {/* RSS */}
      <Section title="RSS · Atom 피드">
        <EndpointCard
          method="GET"
          path="/changelog/feed.xml"
          desc="공개 릴리스 노트 Atom 1.0 피드. 최근 30 엔트리."
          cache="1시간 edge + stale 24시간"
        />

        <EndpointCard
          method="GET"
          path="/roadmap/feed.xml"
          desc="공개 로드맵 Atom 1.0 피드. 분기별 entry + 상태 이모지 (✅🛠️⏸️📌)."
          cache="1시간 edge + stale 24시간"
        />
      </Section>

      {/* 검색 */}
      <Section title="검색">
        <EndpointCard
          method="GET"
          path="/api/opportunities/search?q=<str>&limit=<n>"
          desc="공개 프로젝트 검색. status='active' 만. title/description ilike. q ≥ 2자."
          params="q(필수), limit(기본 10, 최대 20)"
          cache="30초 edge"
        />

        <EndpointCard
          method="GET"
          path="/api/profiles/public?q=<str>&limit=<n>"
          desc="공개 프로필 검색. profile_visibility='public' 만. nickname/desired_position/university ilike."
          params="q(필수), limit(기본 10, 최대 20)"
          cache="30초 edge"
        />
      </Section>

      {/* 삭제 웹훅 */}
      <Section title="Meta Platform 웹훅">
        <EndpointCard
          method="POST"
          path="/api/oauth/threads/deauthorize"
          desc="Meta 가 보내는 deauthorize 웹훅. signed_request HMAC-SHA256 검증. 유효하지 않으면 400."
          note="Meta App Review 필수. 외부에서 직접 호출하지 마세요."
        />

        <EndpointCard
          method="POST"
          path="/api/oauth/threads/data-deletion"
          desc="Meta 가 보내는 data-deletion 웹훅. 처리 후 confirmation_code 와 상태 조회 URL 반환."
          note="Meta App Review 필수. 외부에서 직접 호출하지 마세요."
        />

        <EndpointCard
          method="GET"
          path="/api/oauth/threads/data-deletion/status?code=<str>"
          desc="data-deletion 요청의 처리 상태 조회. 공개."
        />
      </Section>

      {/* 기타 공개 */}
      <Section title="기타 공개">
        <EndpointCard
          method="GET"
          path="/api/health"
          desc="시스템 헬스체크. /status 페이지가 30초마다 polling. DB·Auth 서브시스템 상태."
        />

        <EndpointCard
          method="GET"
          path="/sitemap.xml"
          desc="공개 라우트 sitemap (Next.js 자동 생성)."
        />

        <EndpointCard
          method="GET"
          path="/.well-known/security.txt"
          desc="RFC 9116 보안 연락처. 취약점 제보 경로 명시."
        />

        <EndpointCard
          method="GET"
          path="/api/og/default"
          desc="기본 Open Graph 이미지 (SVG)."
          note="/api/og/project/[id], /api/og/profile/[id], /api/og/club/[slug] 도 동일 스펙."
        />
      </Section>

      {/* 약관 */}
      <section className="mt-16 pt-8 border-t border-border text-[13px] text-txt-secondary space-y-2 leading-relaxed">
        <p>
          <Shield size={14} className="inline text-brand mr-1" aria-hidden="true" />
          본 API 는 공개 데이터에 한정되며, RLS 정책이 anon 접근 범위를 강제합니다. 인증이 필요한 API(클럽 관리·결제·관리자) 는 별도 토큰 체계로 제공될 예정이며 현재는 웹 UI 를 통한 접근만 지원합니다.
        </p>
        <p>
          Rate limit: anonymous 기준 기본 값(분당 20회)이 <code className="text-[12px] font-mono">X-RateLimit-*</code> 헤더로 반환됩니다. 과도한 요청은 <code className="text-[12px] font-mono">429</code> 와 재시도 지침으로 응답됩니다.
        </p>
        <p>
          변경·삭제 계획은 <Link href="/changelog" className="text-brand underline">릴리스 노트</Link> 와 <Link href="/roadmap" className="text-brand underline">로드맵</Link> 에 선제 공지됩니다. 이 페이지의 엔드포인트는 당분간 stable 로 유지될 예정이나, 기업 계약 단계에서는 별도 SLA·DPA 를 통해 보다 강한 보장을 제공합니다.
        </p>
        <p>
          연동 지원 · 버그 제보: <a href="mailto:team@dailydraft.me?subject=Public%20API" className="text-brand underline">team@dailydraft.me</a>
        </p>
      </section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[17px] font-bold text-txt-primary mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function EndpointCard({
  method,
  path,
  desc,
  params,
  cache,
  note,
  sample,
}: {
  method: string
  path: string
  desc: string
  params?: string
  cache?: string
  note?: string
  sample?: string
}) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${method === 'GET' ? 'bg-status-success-bg text-indicator-online' : 'bg-status-warn-bg text-status-warn-text'}`}>
          {method}
        </span>
        <code className="text-[13px] font-mono text-txt-primary break-all">{path}</code>
      </div>
      <p className="text-[13px] text-txt-secondary leading-relaxed">{desc}</p>
      {params && (
        <p className="text-[11px] text-txt-tertiary mt-2">
          <strong>파라미터:</strong> <code className="font-mono">{params}</code>
        </p>
      )}
      {cache && (
        <p className="text-[11px] text-txt-tertiary mt-1 inline-flex items-center gap-1">
          <Clock size={10} aria-hidden="true" />
          <code className="font-mono">{cache}</code>
        </p>
      )}
      {note && <p className="text-[11px] text-status-warn-text mt-2">⚠ {note}</p>}
      {sample && (
        <pre className="mt-3 p-3 bg-surface-sunken rounded-lg text-[11px] font-mono text-txt-secondary overflow-x-auto whitespace-pre-wrap">
          {sample}
        </pre>
      )}
    </div>
  )
}
