import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, FileCheck2, AlertCircle, Database, Mail, Server, Sparkles, Code } from 'lucide-react'
import { PublicMetricsStrip } from '@/components/trust/PublicMetricsStrip'

export const metadata: Metadata = {
  title: '신뢰 센터 · Draft',
  description: 'Draft 의 보안·개인정보 처리·서비스 수준·공개 인시던트·실사 자료를 한 화면에 정리합니다. 학교·기관 파트너십 검토 단계에 필요한 내용을 모았습니다.',
  alternates: { canonical: '/trust' },
  openGraph: {
    type: 'article',
    title: '신뢰 센터 · Draft',
    description: 'Draft 의 보안·개인정보 처리·서비스 수준·공개 인시던트·실사 자료를 한 화면에 정리합니다.',
    url: '/trust',
    locale: 'ko_KR',
  },
}

/**
 * /trust — 엔터프라이즈·기관 실사 대응 통합 신뢰 센터.
 *
 * 대상: 학교 창업교육센터·산학협력단·법무 담당자·VC 실사.
 * 목표: URL 하나 주면 보안·PIPA·SLO·인시던트·실사 자료 전부 찾을 수 있는 단일 출발점.
 *
 * 내용은 링크 모음이 주. 본문은 간단한 1-2 문장 요약만. 상세는 기존 페이지
 * (/status, /legal/*, /changelog, /.well-known/security.txt) 로 연결.
 */
export default function TrustCenterPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">신뢰 센터</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 의 보안·컴플라이언스·운영 투명성
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          학교·기관과의 파트너십 또는 법무·보안 실사 단계에서 필요한 내용을 한 화면에 모았습니다. 각 항목은 더 상세한 공개 페이지로 연결됩니다. 별도 요청이 필요한 실사 자료는 <a href="mailto:team@dailydraft.me?subject=Due%20Diligence%20Docs" className="text-brand underline">team@dailydraft.me</a> 로 요청 주시면 개별 공유드립니다.
        </p>
        <PublicMetricsStrip />
      </header>

      {/* 1. 서비스 상태 */}
      <Section
        id="service-level"
        icon={Server}
        title="서비스 수준 (SLO) 과 장애 공개"
      >
        <p>
          가용성 목표 99.9%, P95 API 응답 800ms 이하, 인시던트 복구(RTO) 4시간 이내, 데이터 손실 허용(RPO) 24시간 이내. 전체 목표는{' '}
          <LinkInline href="/status">시스템 상태 페이지</LinkInline> 에서 실시간 헬스체크와 함께 공개됩니다.
        </p>
        <p>
          SEV-0·SEV-1 등급 장애는 발생 시 동일 페이지의 "최근 30일 인시던트" 섹션에 타임라인·영향 컴포넌트·원인과 함께 공개됩니다. 인시던트 데이터는 append-only 로 관리됩니다.
        </p>
      </Section>

      {/* 2. 개인정보 */}
      <Section
        id="privacy"
        icon={FileCheck2}
        title="개인정보 처리"
      >
        <p>
          한국 개인정보 보호법(PIPA) 기준으로 수집·이용·위탁·국외 이전을 관리합니다. 전체 조항은{' '}
          <LinkInline href="/legal/privacy">개인정보처리방침</LinkInline> 에, 삭제 요청 경로는{' '}
          <LinkInline href="/legal/data-deletion">데이터 삭제 안내</LinkInline> 에 공개되어 있습니다.
        </p>
        <p>
          OAuth 액세스 토큰은 AES-256-GCM 으로 암호화 저장되고, 연결 해제 시 즉시 완전 삭제됩니다. 모든 수탁업체(Supabase·Vercel·Anthropic·Google·Discord·Resend 등 12곳)의 처리 범위·리전·이전 근거·보안 증빙은{' '}
          <LinkInline href="/legal/subprocessors">수탁업체 목록</LinkInline> 에서 전수 확인 가능합니다.
        </p>
      </Section>

      {/* 3. 보안 */}
      <Section
        id="security"
        icon={Lock}
        title="보안 통제"
      >
        <p>
          TLS 1.3, HSTS(1년 · includeSubDomains · preload), Row-Level Security 전 테이블 적용, 감사 로그 append-only 3년 보존이 기본 통제선입니다.
          부가로 Dependabot 주간 스캔, gitleaks·trufflehog secret-scan CI, 분기별 시크릿 로테이션 런북을 운영합니다.
        </p>
        <p>
          보안 연구자용 공식 제보 경로는 <LinkInline external href="/.well-known/security.txt">RFC 9116 security.txt</LinkInline>. 초기 응답 24시간, 초기 평가 72시간, 수정 배포 최대 30일의 대응 SLA 를 공개 <LinkInline href="https://github.com/chadolmin01/dailydraft.me/blob/main/main/SECURITY.md" external>SECURITY.md</LinkInline> 에 두고 있습니다.
        </p>
      </Section>

      {/* 4. 약관 */}
      <Section
        id="terms"
        icon={Database}
        title="약관과 이용 조건"
      >
        <p>
          <LinkInline href="/legal/terms">서비스 이용약관</LinkInline> 에 회원·기관·클럽 간 권리·의무, 자동 발행 기능 특약(제7조 — 운영진 승인 없이는 외부 발행 없음), 지적재산권, 준거법·관할이 정리되어 있습니다.
        </p>
      </Section>

      {/* 5. 릴리스 이력 */}
      <Section
        id="release"
        icon={Sparkles}
        title="배포·변경 이력"
      >
        <p>
          주요 배포와 보안·기능 변경은 <LinkInline href="/changelog">공개 릴리스 노트</LinkInline> 에, 세부 변경은{' '}
          <LinkInline external href="https://github.com/chadolmin01/dailydraft.me/commits/main">GitHub 커밋 히스토리</LinkInline> 에 열려 있습니다. 변경의 근거와 시점을 외부에서 직접 검증 가능하도록 한 것입니다.
        </p>
      </Section>

      {/* 6. Meta App Review */}
      <Section
        id="meta"
        icon={AlertCircle}
        title="Meta Threads API 통합 — App Review 준비"
      >
        <p>
          Threads 외부 발행 기능은 Meta Platform Terms 기준 App Review 절차를 거칩니다. 제출 대상 문서(use-case·compliance-attestation·security-architecture·reviewer-expectations) 은 내부적으로 작성되어 있고, 실사 단계에서 필요하시면 <LinkInline href="mailto:team@dailydraft.me?subject=Meta%20Review%20Docs" external>이메일 요청</LinkInline> 으로 개별 공유 드릴 수 있습니다.
        </p>
      </Section>

      {/* 6.5 공개 API */}
      <Section
        id="public-api"
        icon={Code}
        title="공개 API 레퍼런스"
      >
        <p>
          파트너·자동화 도구 빌더가 Draft 공개 데이터에 프로그래밍적으로 접근할 수 있는 엔드포인트를 <LinkInline href="/api-docs">공개 API 레퍼런스</LinkInline> 에 정리해두었습니다. 지표·인시던트·QR 생성·RSS 피드·검색 등 16개. 인증이 필요한 내부 API 는 별도 토큰 체계로 제공될 예정이며 기업 계약 단계에서 협의합니다.
        </p>
      </Section>

      {/* 7. 실사 자료 요청 */}
      <Section
        id="due-diligence"
        icon={Mail}
        title="추가 실사 자료 요청"
      >
        <p>
          PIPA 위탁업체 계약서 사본, 데이터 처리 위탁 현황(RoPA), 보안 아키텍처 상세 문서, 침입 시험 결과(예정) 등은 실사 단계에서 별도 공유합니다. 공개 자료로는 대체되지 않는 부분이 있어 서면 요청에 맞춰 제공하는 형태입니다.
        </p>
        <div className="mt-4">
          <a
            href="mailto:team@dailydraft.me?subject=Due%20Diligence%20Docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-inverse text-txt-inverse text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            실사 자료 이메일 요청
          </a>
        </div>
      </Section>

      <footer className="mt-16 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>본 페이지의 정보는 최신 공개 자료와 동일합니다. 개별 항목의 최종 개정 시점은 각 상세 페이지에서 확인하실 수 있습니다.</p>
        <p>보안 연구자 제보 · 실사 자료 요청 · 파트너십 문의: <a href="mailto:team@dailydraft.me" className="text-brand underline">team@dailydraft.me</a></p>
      </footer>
    </main>
  )
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="mb-10 scroll-mt-16">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-brand" aria-hidden="true" />
        <h2 id={`h-${id}`} className="text-[17px] font-bold text-txt-primary">
          {title}
        </h2>
      </div>
      <div className="text-[14px] text-txt-secondary leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

function LinkInline({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  if (external || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('/.well-known')) {
    return (
      <a href={href} className="text-brand underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className="text-brand underline">
      {children}
    </Link>
  )
}
