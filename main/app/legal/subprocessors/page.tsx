import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: '수탁업체(서브프로세서) 목록 · Draft',
  description:
    'Draft 가 개인정보 처리를 위탁하는 모든 수탁업체의 목록·처리 범위·소재지·보안 근거를 공개합니다. PIPA 26조 공개 의무와 엔터프라이즈 DPA 대응.',
  alternates: { canonical: '/legal/subprocessors' },
  openGraph: {
    type: 'article',
    title: '수탁업체 목록 · Draft',
    description: 'Draft 의 개인정보 처리 수탁업체 전수 공개.',
    url: '/legal/subprocessors',
    locale: 'ko_KR',
  },
}

/**
 * /legal/subprocessors — 전체 데이터 서브프로세서 공개.
 *
 * 목적:
 *   - PIPA 26조(수탁업체 공개) 의무 충족.
 *   - 기관·기업 고객 DPA(데이터 처리 부속 계약) 체결 시 참조 문서.
 *   - 변경 이력을 /changelog 에 반영해 투명성 확보.
 *
 * 각 행은 실제 계약/SOC2/보안 근거를 기재. 미확인 항목은 "공개 문서 참조" 로
 * 표기하고 세부 자료는 실사 단계에서 제공.
 */

interface Subprocessor {
  vendor: string
  purpose: string
  region: string
  dataScope: string
  transferMechanism: string
  security: string
  url: string
}

const SUBPROCESSORS: Subprocessor[] = [
  {
    vendor: 'Supabase Inc. (USA)',
    purpose: '데이터베이스 호스팅 · 인증 서버 · 스토리지',
    region: 'ap-northeast-2 (서울 AWS)',
    dataScope: '회원 프로필, 프로젝트, 감사 로그 등 서비스 전 영역',
    transferMechanism: '국내 리전 저장 — 표준계약조항(SCC) 제출 불요',
    security: 'SOC 2 Type II · AWS KMS · Row-Level Security',
    url: 'https://supabase.com/security',
  },
  {
    vendor: 'Vercel Inc. (USA)',
    purpose: '웹 애플리케이션 호스팅 · Edge 네트워크 · 빌드 파이프라인',
    region: 'Global Edge (SEO1 등)',
    dataScope: 'HTTP 로그(IP·UA·경로) 72시간 보관, 정적 자산 캐시',
    transferMechanism: '표준계약조항(EU-US DPF / K-US 프레임워크)',
    security: 'SOC 2 Type II · ISO 27001 · DDoS 방어',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    vendor: 'Anthropic PBC (USA)',
    purpose: 'AI 초안 생성(주간 업데이트 Ghostwriter, 페르소나 엔진)',
    region: 'US-East',
    dataScope: '프롬프트·응답 (수집된 원문은 학습 미사용, 30일 후 삭제)',
    transferMechanism: '표준계약조항',
    security: 'SOC 2 Type II · HIPAA 준수 티어 보유 · zero-retention API',
    url: 'https://www.anthropic.com/legal/privacy',
  },
  {
    vendor: 'Google LLC (USA)',
    purpose: 'Gemini 임베딩·분류 · Google Analytics · Google OAuth',
    region: 'Global (데이터 리전 Google 정책 준수)',
    dataScope: '익명 임베딩 벡터, 사이트 접속 집계, OAuth 토큰',
    transferMechanism: '표준계약조항 · EU-US DPF',
    security: 'ISO 27001/27017/27018 · SOC 1/2/3',
    url: 'https://policies.google.com/privacy',
  },
  {
    vendor: 'Discord Inc. (USA)',
    purpose: 'Discord OAuth · 봇 메시지 수집 (FileTrail, GitHub DevSync 등)',
    region: 'US',
    dataScope: '유저가 명시적으로 연결한 길드 채널의 메시지·유저 ID',
    transferMechanism: '표준계약조항 · 이용자 명시적 동의 기반',
    security: 'SOC 2 Type II',
    url: 'https://discord.com/privacy',
  },
  {
    vendor: 'Meta Platforms, Inc. (USA)',
    purpose: 'Threads Graph API — 외부 SNS 자동 발행',
    region: 'US',
    dataScope: 'OAuth 액세스 토큰(AES-256-GCM 암호화 저장)·발행 텍스트/이미지',
    transferMechanism: '표준계약조항 · 이용자 명시적 연결·App Review',
    security: 'Meta Platform Terms § Data Security',
    url: 'https://developers.facebook.com/docs/development/maintaining-and-securing-your-account',
  },
  {
    vendor: 'Resend, Inc. (USA)',
    purpose: '트랜잭셔널 이메일 발송(가입 확인, 공지, 초대)',
    region: 'US · EU',
    dataScope: '수신자 이메일 주소, 본문, 발송 로그(30일)',
    transferMechanism: '표준계약조항',
    security: 'SOC 2 Type II (진행 중) · DKIM/SPF/DMARC',
    url: 'https://resend.com/legal/privacy-policy',
  },
  {
    vendor: 'Cloudflare, Inc. (USA)',
    purpose: 'DNS · WAF · DDoS 방어',
    region: 'Global Anycast',
    dataScope: 'HTTP 메타데이터(IP·UA)',
    transferMechanism: '표준계약조항 · EU-US DPF',
    security: 'SOC 2 Type II · ISO 27001 · PCI DSS',
    url: 'https://www.cloudflare.com/privacypolicy/',
  },
  {
    vendor: 'PostHog Inc. (USA)',
    purpose: '제품 분석 · 에러 추적 · Feature Flag',
    region: 'US-East',
    dataScope: '익명/로그인 유저 이벤트(페이지뷰·클릭·에러 스택)',
    transferMechanism: '표준계약조항',
    security: 'SOC 2 Type II · GDPR 준수 · 자체 호스팅 옵션 보유',
    url: 'https://posthog.com/privacy',
  },
  {
    vendor: 'Sentry (Functional Software, Inc.) (USA)',
    purpose: '예외·성능 모니터링 (opt-in)',
    region: 'US',
    dataScope: '스택 트레이스 · breadcrumb (PII 스크러빙 활성)',
    transferMechanism: '표준계약조항',
    security: 'SOC 2 Type II · ISO 27001',
    url: 'https://sentry.io/privacy/',
  },
  {
    vendor: 'Upstash, Inc. (USA)',
    purpose: 'Redis Rate Limit · 경량 캐시',
    region: 'us-east-1 / eu-west-1',
    dataScope: '레이트 리밋 카운터(유저 ID 해시), 일시 캐시',
    transferMechanism: '표준계약조항',
    security: 'SOC 2 Type II · TLS 1.3',
    url: 'https://upstash.com/trust/privacy',
  },
  {
    vendor: 'GitHub, Inc. (USA)',
    purpose: '소스 코드 저장소 · CI/CD · Dependabot · Secret Scan',
    region: 'Global',
    dataScope: '코드 리포지터리, 커밋 메타데이터 (이용자 개인정보 저장 없음)',
    transferMechanism: '표준계약조항 · EU-US DPF',
    security: 'SOC 1/2/3 · ISO 27001 · FedRAMP Moderate',
    url: 'https://docs.github.com/en/site-policy/privacy-policies',
  },
]

export default function SubprocessorsPage() {
  const lastUpdated = '2026-04-22'

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-brand mb-3">법적 고지</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          수탁업체(서브프로세서) 목록
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          Draft 가 서비스 제공을 위해 개인정보 처리를 위탁하는 수탁업체를 모두 공개합니다. 각 업체의
          처리 범위·보관 리전·국외 이전 근거·보안 증빙을 표로 정리했습니다. PIPA 제26조 및 엔터프라이즈
          DPA(Data Processing Agreement) 대응 문서입니다.
        </p>
        <p className="text-[12px] text-txt-tertiary mt-3">
          최종 개정: {lastUpdated} · 변경 시{' '}
          <Link href="/changelog" className="text-brand underline">
            공개 릴리스 노트
          </Link>
          에 기록.
        </p>
      </header>

      <div className="mb-10 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-sunken text-txt-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">업체</th>
              <th className="text-left px-4 py-3 font-semibold">목적</th>
              <th className="text-left px-4 py-3 font-semibold">리전</th>
              <th className="text-left px-4 py-3 font-semibold">이전 근거</th>
              <th className="text-left px-4 py-3 font-semibold">보안 증빙</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SUBPROCESSORS.map((s) => (
              <tr key={s.vendor} className="align-top">
                <td className="px-4 py-3">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline font-semibold"
                  >
                    {s.vendor}
                  </a>
                </td>
                <td className="px-4 py-3 text-txt-secondary">
                  <div>{s.purpose}</div>
                  <div className="text-[11px] text-txt-tertiary mt-1">{s.dataScope}</div>
                </td>
                <td className="px-4 py-3 text-txt-secondary">{s.region}</td>
                <td className="px-4 py-3 text-txt-secondary">{s.transferMechanism}</td>
                <td className="px-4 py-3 text-txt-secondary">{s.security}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">변경 고지 정책</h2>
        <p>
          새로운 수탁업체 추가, 처리 범위 변경, 리전 이동 등 영향도가 있는 변경이 발생하면 본 페이지를
          갱신하고 <Link href="/changelog" className="text-brand underline">공개 릴리스 노트</Link>{' '}
          에도 기재합니다. 엔터프라이즈 고객에게는 계약에 따라 14일 전 이메일 사전 고지가 기본입니다.
        </p>
        <p>
          이의 제기 기간 내 서면 반대 의사를 보내시면 해당 고객에 한해 이전 수탁 구조 유지 또는 계약
          종료 협의를 진행합니다.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-2">
        <p>
          본 목록과 개인정보처리방침 본문 간 차이가 있을 경우,{' '}
          <Link href="/legal/privacy" className="text-brand underline">
            개인정보처리방침
          </Link>{' '}
          제4조(수탁 현황)와 본 페이지를 합쳐서 해석합니다.
        </p>
        <p className="flex items-center gap-1.5">
          <Mail size={12} aria-hidden="true" />
          DPA 체결·수탁 이의제기:{' '}
          <a
            href="mailto:team@dailydraft.me?subject=DPA%20Request"
            className="text-brand underline"
          >
            team@dailydraft.me
          </a>
        </p>
      </footer>
    </main>
  )
}
