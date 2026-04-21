import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '데이터 보관·파기 정책 · Draft',
  description:
    '개인정보·운영 데이터의 보관 기간·파기 절차·법정 보존 예외를 데이터 유형별로 공개합니다. PIPA 21조·36조 준수.',
  alternates: { canonical: '/legal/retention' },
  openGraph: {
    type: 'article',
    title: '데이터 보관·파기 정책 · Draft',
    description: 'PIPA 기준 데이터 유형별 보관·파기 정책 전수 공개.',
    url: '/legal/retention',
    locale: 'ko_KR',
  },
}

/**
 * /legal/retention — 데이터 유형별 보관·파기 정책.
 *
 * PIPA 21조(목적 달성 시 즉시 파기) + 36조(삭제권) + 시행령 제16조(파기 방법) 대응.
 * 엔터프라이즈 DPA 별첨 · 대학 창업교육센터 실사 체크리스트의 핵심 섹션.
 */

interface RetentionRow {
  type: string
  scope: string
  period: string
  trigger: string
  legalBasis: string
}

const RETENTION: RetentionRow[] = [
  {
    type: '계정 프로필',
    scope: 'profiles, profiles_student_identity',
    period: '가입 후 ~ 탈퇴 30일',
    trigger: '탈퇴 신청 → 30일 유예 → cron 이 auth.users + cascade 로 hard delete',
    legalBasis: 'PIPA 21조(목적 달성) · 36조(삭제권)',
  },
  {
    type: '로그인·세션',
    scope: 'sessions, refresh tokens',
    period: '리프레시 30일 (연장 갱신)',
    trigger: '로그아웃 또는 30일 무사용',
    legalBasis: 'PIPA 21조',
  },
  {
    type: '감사 로그',
    scope: 'audit_logs (append-only)',
    period: '3년',
    trigger: '3년 경과 row 배치 삭제',
    legalBasis: '정보통신망법 47조 시행령 · PIPA 자율 보존',
  },
  {
    type: '에러·성능 로그',
    scope: 'error_logs, Sentry',
    period: '90일',
    trigger: '90일 TTL 자동 삭제',
    legalBasis: 'PIPA 21조',
  },
  {
    type: 'CSP 위반 리포트',
    scope: 'PostHog csp_violation 이벤트',
    period: 'PostHog 기본 90일',
    trigger: '자동 롤링',
    legalBasis: 'PostHog 데이터 보존 설정',
  },
  {
    type: 'AI 프롬프트·응답',
    scope: 'Anthropic API / Google Gemini',
    period: '30일 이하 (공급자 API 기본값)',
    trigger: '학습 미사용 계정 — zero-retention 옵션 사용',
    legalBasis: 'PIPA 17조 제3자 제공 · Anthropic Trust Terms',
  },
  {
    type: 'OAuth 액세스 토큰',
    scope: 'integrations_discord, threads_accounts',
    period: '연결 해제 시 즉시 완전 삭제',
    trigger: '유저 disconnect · 탈퇴 · 공급자 데이터 삭제 콜백',
    legalBasis: 'PIPA 21조 + Meta Platform Terms',
  },
  {
    type: '이메일 발송 로그',
    scope: 'Resend',
    period: '30일',
    trigger: 'Resend 기본 TTL',
    legalBasis: 'Resend 보존 정책',
  },
  {
    type: '결제·세금계산서',
    scope: '결제 기록(해당 시)',
    period: '5년',
    trigger: '법정 보존 기한 경과',
    legalBasis: '전자상거래법 6조',
  },
  {
    type: '정보주체 요청 기록',
    scope: '데이터 삭제·열람·정정 요청',
    period: '3년',
    trigger: '처리 완료 후 3년',
    legalBasis: 'PIPA 표준 안내 — 증빙 확보 목적',
  },
  {
    type: '분석 이벤트(익명)',
    scope: 'PostHog, Google Analytics',
    period: '1년 (GA4) / 1년 (PostHog)',
    trigger: '자동 롤링',
    legalBasis: '익명 집계 데이터',
  },
  {
    type: 'DB 백업',
    scope: 'Supabase Point-in-Time Recovery',
    period: '7일 PITR + 30일 일일 스냅샷',
    trigger: 'Supabase Pro 기본값',
    legalBasis: 'Supabase 백업 정책',
  },
]

export default function RetentionPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-brand mb-3">법적 고지</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          데이터 보관·파기 정책
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          Draft 가 보유하는 개인정보·운영 데이터의 유형별 보관 기간·파기 절차·법정 보존 예외를
          공개합니다. PIPA 21조(목적 달성 시 즉시 파기) 및 36조(삭제권)를 준수합니다.
        </p>
        <p className="text-[12px] text-txt-tertiary mt-3">최종 개정: 2026-04-22</p>
      </header>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">1. 원칙</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>수집 목적을 달성한 데이터는 지체 없이 파기합니다.</li>
          <li>법령에 의해 보존이 요구되는 데이터는 해당 기간 동안만 별도 DB 로 분리·보관합니다.</li>
          <li>파기 시 복구 불가능한 방식으로 삭제합니다(전자 파일: 영구 삭제, 백업: 롤오버).</li>
          <li>정보주체의 삭제권(PIPA 36조) 행사 시 30일 유예 후 hard delete 가 기본 동작입니다.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">2. 유형별 표</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-sunken text-txt-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">데이터 유형</th>
                <th className="text-left px-4 py-3 font-semibold">범위</th>
                <th className="text-left px-4 py-3 font-semibold">보관 기간</th>
                <th className="text-left px-4 py-3 font-semibold">파기 트리거</th>
                <th className="text-left px-4 py-3 font-semibold">근거</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RETENTION.map((r) => (
                <tr key={r.type} className="align-top">
                  <td className="px-4 py-3 font-semibold text-txt-primary">{r.type}</td>
                  <td className="px-4 py-3 text-txt-secondary font-mono text-[11px]">{r.scope}</td>
                  <td className="px-4 py-3 text-txt-secondary">{r.period}</td>
                  <td className="px-4 py-3 text-txt-secondary">{r.trigger}</td>
                  <td className="px-4 py-3 text-txt-secondary text-[11px]">{r.legalBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">3. 정보주체 권리 행사</h2>
        <p>
          이용자는 언제든{' '}
          <Link href="/me/data" className="text-brand underline">
            내 데이터 관리
          </Link>
          에서 본인 데이터 전체 열람 또는 탈퇴(삭제)를 신청하실 수 있습니다. 30일 유예 후 복구
          불가능한 삭제가 진행됩니다.
        </p>
        <p>
          외부 연결(Discord·Meta Threads 등) 해제는 해당 설정 페이지에서 즉시 가능하며, OAuth
          토큰은 해제와 동시에 완전 삭제됩니다.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          본 정책은{' '}
          <Link href="/legal/privacy" className="text-brand underline">
            개인정보처리방침
          </Link>{' '}
          및{' '}
          <Link href="/legal/subprocessors" className="text-brand underline">
            수탁업체 목록
          </Link>
          과 함께 해석합니다.
        </p>
        <p>
          문의:{' '}
          <a href="mailto:team@dailydraft.me?subject=Retention%20Policy" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
      </footer>
    </main>
  )
}
