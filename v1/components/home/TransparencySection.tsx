import Link from 'next/link'
import { Activity, FileText, Compass, Shield, Sparkles } from 'lucide-react'

/**
 * 공개 투명성 자산 섹션 — 랜딩에서 엔터프라이즈 오디언스 신뢰 획득용.
 *
 * 노출 위치: SecuritySection 직하 (보안 신뢰 신호 뒤에 "공개 자료 직접 확인" 초대).
 * 각 카드는 공개 페이지로 바로 연결.
 */
export function TransparencySection() {
  return (
    <section id="transparency" aria-labelledby="transparency-heading" className="py-24 bg-surface-sunken/30">
      <div className="max-w-5xl mx-auto px-6">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-bg mb-4">
            <Sparkles size={12} className="text-brand" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-brand uppercase tracking-wide">공개 투명성</span>
          </div>
          <h2 id="transparency-heading" className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight">
            우리가 지금 무엇을 하고 있는지 모두 열어두었습니다
          </h2>
          <p className="text-[14px] text-txt-secondary mt-3 max-w-2xl mx-auto leading-relaxed">
            학교·기관 실사에서 필요한 내용은 별도 요청 없이 공개 URL 에 정리되어 있습니다. 서비스 가용성, 배포 이력, 로드맵, FAQ, API 레퍼런스까지 — 검토 단계에서 먼저 열어보시면 됩니다.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            href="/trust"
            icon={Shield}
            title="신뢰 센터"
            desc="SLO·개인정보·보안·약관·API·실사 자료를 한 URL 에. 기관 실사 시작점."
          />
          <Card
            href="/status"
            icon={Activity}
            title="시스템 상태"
            desc="실시간 헬스체크 + SLO 5종 + 최근 30일 인시던트 이력."
            badge="99.9% target"
          />
          <Card
            href="/changelog"
            icon={FileText}
            title="릴리스 노트"
            desc="주요 배포·보안·기능 변경 이력. Atom RSS 피드 구독 가능."
          />
          <Card
            href="/roadmap"
            icon={Compass}
            title="로드맵"
            desc="분기별 theme·planned/in-progress/shipped 상태. 파트너십 검토에 활용."
          />
          <Card
            href="/help"
            icon={FileText}
            title="자주 묻는 질문"
            desc="시작·운영·데이터·보안·도입·플랜 5개 카테고리."
          />
          <Card
            href="/api-docs"
            icon={FileText}
            title="공개 API"
            desc="지표·인시던트·RSS·QR·검색 등 파트너 연동용 엔드포인트 16개."
          />
        </div>
      </div>
    </section>
  )
}

function Card({
  href,
  icon: Icon,
  title,
  desc,
  badge,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  desc: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="group bg-surface-card border border-border rounded-2xl p-5 hover:border-txt-tertiary transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon size={18} className="text-brand" aria-hidden="true" />
        {badge && (
          <span className="text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-bold text-txt-primary mb-1 group-hover:text-brand transition-colors">
        {title}
      </h3>
      <p className="text-[12px] text-txt-tertiary leading-relaxed">{desc}</p>
    </Link>
  )
}
