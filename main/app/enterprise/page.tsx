import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Shield, FileCheck2, Headphones, Zap, Users, Database, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: '기관·기업 도입 · Draft',
  description:
    '대학 창업교육센터·산학협력단·기업용 Draft 도입 가이드. 단일 로그인(SSO), 관리자 대시보드, 커스텀 필드, DPA, 실사 자료, 전용 지원 제공.',
  alternates: { canonical: '/enterprise' },
  openGraph: {
    type: 'website',
    title: '기관·기업 도입 · Draft',
    description: '대학 창업교육센터·산학협력단·기업용 도입 패키지.',
    url: '/enterprise',
    locale: 'ko_KR',
  },
}

/**
 * /enterprise — 기관·기업 도입 공개 설명.
 *
 * 타겟: 대학 창업교육센터·산학협력단·기업 HR·혁신팀 리더십.
 * 목적: 영업 미팅 전에 "Draft 가 기관용 기능을 갖추고 있는가" 를 URL 로 확인시킴.
 *
 * 가격은 "협의" 로 표기 — 계약 구조가 케이스별이고 공개 리스트프라이싱은 아직 미정.
 */

interface Feature {
  title: string
  desc: string
  icon: typeof Shield
}

const FEATURES: Feature[] = [
  {
    title: '멤버·팀 관리 콘솔',
    desc: '학생·멘토·운영진 대량 초대, 역할 배정, 소속 조회, 이탈 회수 처리까지.',
    icon: Users,
  },
  {
    title: '성과 보고 자동화',
    desc: '주간/월간/분기 리포트를 CSV·PDF 로 내보내고, 대시보드에서 연도 대비 추이를 확인.',
    icon: BarChart3,
  },
  {
    title: 'SSO·도메인 가입 잠금',
    desc: '학교 메일(@ac.kr / @edu) 인증, Google Workspace / Microsoft 365 SSO(단계적 도입).',
    icon: Shield,
  },
  {
    title: '커스텀 필드·브랜딩',
    desc: '기관 고유 가입 필드(학번·학부·기수), 로고·컬러·이메일 발신자명까지 기관 단위 설정.',
    icon: Building2,
  },
  {
    title: 'DPA·실사 자료 제공',
    desc: 'PIPA 수탁 계약서, RoPA, 보안 아키텍처 문서, 공개 법적 고지 6종을 일괄 공유.',
    icon: FileCheck2,
  },
  {
    title: '전용 지원·SLA',
    desc: '영업일 24시간 초기 응답, SEV-0 장애 4시간 RTO 목표, 분기 리뷰 세션.',
    icon: Headphones,
  },
  {
    title: 'AI 자동화 상한 확장',
    desc: '주간 업데이트 Ghostwriter·페르소나 엔진의 월간 생성 횟수 한도를 협의 단위로 확장.',
    icon: Zap,
  },
  {
    title: '데이터 온프레미스·리전 선택',
    desc: '한국 내 저장이 기본이며, 필요 시 전용 Supabase 프로젝트 분리(리전 고정) 협의 가능.',
    icon: Database,
  },
]

export default function EnterprisePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">기관·기업 도입</p>
        </div>
        <h1 className="text-[32px] font-bold text-txt-primary tracking-tight leading-tight">
          동아리 운영을 기관의 기억 자산으로
        </h1>
        <p className="text-[15px] text-txt-secondary mt-3 leading-relaxed max-w-2xl">
          Draft 는 대학 창업교육센터·산학협력단·기업 혁신팀이 소속 동아리·팀·프로젝트를 한 곳에서
          관찰하고 성과를 증빙할 수 있도록 설계된 운영 인프라입니다. 공용 Slack·Notion·엑셀을 대체할
          목적이 아니라, 그 위에 올라가는 구조화 계층입니다.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <a
            href="mailto:team@dailydraft.me?subject=Partnership"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-inverse text-txt-inverse text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            도입 상담 요청
          </a>
          <Link
            href="/trust"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-txt-primary text-[13px] font-semibold hover:border-txt-tertiary transition-colors"
          >
            신뢰 센터 보기
          </Link>
          <Link
            href="/legal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-txt-primary text-[13px] font-semibold hover:border-txt-tertiary transition-colors"
          >
            법적 고지 모음
          </Link>
        </div>
      </header>

      <section className="mb-14">
        <h2 className="text-[10px] font-medium text-txt-tertiary mb-4">기관용 패키지에 포함된 것</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-surface-card border border-border rounded-2xl p-5 hover:border-txt-tertiary transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-brand" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-txt-primary">{f.title}</h3>
                    <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-14 bg-surface-card border border-border rounded-2xl p-6">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3">도입 절차</h2>
        <ol className="space-y-3 text-[13px] text-txt-secondary list-decimal pl-5">
          <li>
            <strong className="text-txt-primary">무료 상담 (30분).</strong> 기관 규모·대상 동아리·목표
            KPI 파악.
          </li>
          <li>
            <strong className="text-txt-primary">실사 자료 공유.</strong> DPA 초안·PIPA 수탁 계약서·
            RoPA·보안 아키텍처 문서 전달.
          </li>
          <li>
            <strong className="text-txt-primary">파일럿 (1개월).</strong> 동아리 3곳 내외로 시범 운영,
            운영진 트레이닝 1회.
          </li>
          <li>
            <strong className="text-txt-primary">확장 계약.</strong> 멤버 수·AI 자동화 상한 기준으로
            연간 계약. 기관용 브랜딩·커스텀 필드 활성화.
          </li>
        </ol>
      </section>

      <section className="mb-14">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">가격</h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed mb-3">
          리스트프라이싱은 준비 중입니다. 계약은 멤버 수·AI 자동화 상한·브랜딩 범위·SLA 티어
          기준으로 협의합니다.
        </p>
        <p className="text-[13px] text-txt-secondary leading-relaxed">
          대학·비영리 기관 대상 파일럿 할인, 학생 창업 생태계 지원 프로그램 지정 기관 할인은 별도
          협의 가능합니다.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">자주 받는 질문</h2>
        <div className="space-y-3">
          <Faq
            q="개인정보는 어디에 저장되나요?"
            a="기본은 Supabase 서울 리전(AWS ap-northeast-2)입니다. 기관 요구에 따라 전용 프로젝트 분리·리전 고정 계약 협의 가능합니다."
          />
          <Faq
            q="기존 Slack·Notion 을 버려야 하나요?"
            a="아니요. Draft 는 소통 툴을 대체하지 않습니다. Discord 통합·외부 SNS 자동 발행 등 기존 툴 위에 구조화 계층으로 동작합니다."
          />
          <Faq
            q="DPA 체결은 언제 하나요?"
            a="파일럿 시작 전 초안을 공유하고, 확장 계약 체결과 동시에 정식 DPA 를 함께 서명합니다. 초안은 이메일 요청 즉시 보내 드립니다."
          />
          <Faq
            q="학생의 개인 SNS 계정 관리도 가능한가요?"
            a="개인 계정은 학생 본인이 직접 연결해야 하며, 기관이 일괄 관리할 수 없습니다(OAuth 본인 동의 필수)."
          />
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          도입 상담:{' '}
          <a href="mailto:team@dailydraft.me?subject=Partnership" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
        <p>
          관련 문서:{' '}
          <Link href="/trust" className="text-brand underline">
            신뢰 센터
          </Link>{' '}
          ·{' '}
          <Link href="/legal" className="text-brand underline">
            법적 고지
          </Link>{' '}
          ·{' '}
          <Link href="/status" className="text-brand underline">
            시스템 상태
          </Link>{' '}
          ·{' '}
          <Link href="/changelog" className="text-brand underline">
            릴리스 노트
          </Link>
        </p>
      </footer>
    </main>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-surface-card border border-border rounded-xl p-4 group">
      <summary className="text-[14px] font-semibold text-txt-primary cursor-pointer list-none flex items-center justify-between">
        {q}
        <span className="text-txt-tertiary text-[11px] group-open:hidden">열기</span>
        <span className="text-txt-tertiary text-[11px] hidden group-open:inline">닫기</span>
      </summary>
      <p className="text-[13px] text-txt-secondary mt-3 leading-relaxed">{a}</p>
    </details>
  )
}
