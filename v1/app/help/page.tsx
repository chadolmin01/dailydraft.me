import type { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle, MessageSquare, BookOpen, Shield, Rocket, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: '자주 묻는 질문 · Draft',
  description: 'Draft 를 처음 쓰시거나 학교·기관 도입을 검토 중이시라면 가장 많이 받는 질문을 먼저 확인해보세요.',
  alternates: { canonical: '/help' },
  openGraph: {
    type: 'article',
    title: '자주 묻는 질문 · Draft',
    description: 'Draft 를 처음 쓰시거나 학교·기관 도입을 검토 중이시라면 가장 많이 받는 질문을 먼저 확인해보세요.',
    url: '/help',
    locale: 'ko_KR',
  },
}

/**
 * /help — 공개 FAQ + 문의 페이지.
 *
 * 카테고리: 시작하기 / 운영 / 데이터·보안 / 학교·기관 도입 / 결제
 * 각 질문은 이름 기반 anchor 로 직접 링크 가능. 공개·검색 노출.
 *
 * 문의는 team@dailydraft.me 단일 채널 (subject 로 분기).
 */
export default function HelpPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">자주 묻는 질문</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 를 처음이라면
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          동아리 회장·운영진·학교 담당자가 가장 많이 주시는 질문을 먼저 정리해둡니다. 더 궁금한 점은 페이지 하단 문의로 바로 답해드립니다.
        </p>
      </header>

      {/* 카테고리 네비 */}
      <nav aria-label="FAQ 카테고리" className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-12">
        <CategoryLink href="#start" icon={Rocket} label="시작하기" />
        <CategoryLink href="#ops" icon={BookOpen} label="운영" />
        <CategoryLink href="#data" icon={Shield} label="데이터·보안" />
        <CategoryLink href="#institution" icon={Building2} label="학교·기관 도입" />
        <CategoryLink href="#billing" icon={MessageSquare} label="결제·플랜" />
      </nav>

      <section id="start" aria-labelledby="h-start" className="mb-14 scroll-mt-16">
        <h2 id="h-start" className="text-[20px] font-bold text-txt-primary mb-6">시작하기</h2>

        <FaqItem id="what-is-draft" question="Draft 는 뭐 하는 서비스인가요?">
          대학교 동아리·학회의 운영을 돕는 SaaS 입니다. Slack·카톡·Discord 같은 기존 소통 채널을 그대로 쓰시면서, 그 위에서 오가는 대화와 활동이 자동으로 주간 기록·기수별 포트폴리오로 쌓이도록 돕습니다. 창업 동아리만 대상으로 하는 서비스는 아니고, 학술동아리·프로젝트 팀·일반 중앙동아리까지 모두 적용 가능합니다.
        </FaqItem>

        <FaqItem id="how-to-start" question="가입하면 뭐부터 하면 되나요?">
          세 가지 순서를 추천드립니다. 먼저 본인 프로필을 채우시고, 동아리를 하나 만드시거나 초대 코드로 들어오십시오. 그 다음 Discord 서버를 연결하시면 자동 요약이 다음 주부터 시작됩니다. 이 모든 과정은 10분 내외입니다.
        </FaqItem>

        <FaqItem id="is-free" question="무료인가요?">
          현재 클로즈드 베타 단계이고, 모든 기능을 무료로 이용하실 수 있습니다. 향후 기관 단위 도입 시 별도의 플랜이 나올 수 있으며, 개별 학생·동아리 운영진 대상 Free 플랜은 유지될 예정입니다.
        </FaqItem>

        <FaqItem id="no-discord" question="Discord 를 안 쓰는 동아리도 쓸 수 있나요?">
          네, 가능합니다. Draft 는 Discord 연결을 선택적으로 제공하며, 연결하지 않으셔도 멤버 관리·주간 업데이트 수동 작성·공개 포트폴리오 등 주요 기능은 동일하게 사용하실 수 있습니다. 카톡으로 주로 소통하시는 동아리라면 주간 업데이트를 운영진이 직접 작성하셔도 됩니다.
        </FaqItem>
      </section>

      <section id="ops" aria-labelledby="h-ops" className="mb-14 scroll-mt-16">
        <h2 id="h-ops" className="text-[20px] font-bold text-txt-primary mb-6">운영</h2>

        <FaqItem id="weekly-update" question="주간 업데이트는 어떻게 생성되나요?">
          Discord·GitHub 활동이 있으면 매주 AI 가 초안을 자동 생성해 드립니다. 운영진은 초안을 검토·수정한 뒤 승인 버튼을 누르시면 됩니다. 초안이 자동으로 외부에 발행되는 경우는 없으며, 모든 외부 발행은 명시적 승인 단계를 거칩니다.
        </FaqItem>

        <FaqItem id="persona" question="페르소나 엔진이 뭔가요?">
          동아리의 어투·스타일·대표 키워드를 학습해두면, 승인된 글을 Threads·Instagram·LinkedIn 같은 외부 채널에 일관된 브랜드 톤으로 발행해주는 기능입니다. 학습 데이터는 편집자에게만 공개되며, 학습 중인 원문이 외부로 노출되지는 않습니다.
        </FaqItem>

        <FaqItem id="cohort" question="기수(cohort) 는 어떻게 관리되나요?">
          각 기수를 독립된 단위로 기록해두기 때문에, 회장이 교체되어도 이전 기수의 활동·프로젝트·주간 업데이트가 URL 로 보존됩니다. 새로 들어온 운영진은 "지난 학기에 뭐 했는지" 를 한 화면에서 확인하실 수 있습니다.
        </FaqItem>

        <FaqItem id="invite-code" question="부원을 한꺼번에 가입시키려면요?">
          클럽 관리자 페이지에서 초대 코드를 만드시고, QR 코드로 인쇄해서 오프라인 모임에 붙여두시면 됩니다. 부원은 QR 을 스캔해서 바로 가입·자동 합류됩니다. 카톡 공유용·Discord 공지용 템플릿 문구도 함께 제공해드립니다.
        </FaqItem>
      </section>

      <section id="data" aria-labelledby="h-data" className="mb-14 scroll-mt-16">
        <h2 id="h-data" className="text-[20px] font-bold text-txt-primary mb-6">데이터·보안</h2>

        <FaqItem id="privacy" question="수집된 개인정보는 어떻게 보관되나요?">
          PIPA(개인정보 보호법) 기준에 맞춰 수집·보관합니다. 자세한 범위·보관 기간·제3자 제공 여부는 <Link href="/legal/privacy" className="text-brand underline">개인정보처리방침</Link> 에 정리해두었습니다. 외부 연동(OAuth) 으로 받는 액세스 토큰은 AES-256-GCM 으로 암호화 저장되고, 연결 해제 시 즉시 완전 삭제됩니다.
        </FaqItem>

        <FaqItem id="delete" question="계정·데이터를 삭제하고 싶습니다.">
          세 가지 경로가 있습니다. 앱 내 <Link href="/me/data" className="text-brand underline">내 데이터 페이지</Link> 에서 직접 요청하시거나, Threads/Instagram 앱에서 Draft 를 제거하시거나 (자동 삭제), 이메일(team@dailydraft.me) 로 요청하실 수 있습니다. 자세한 처리 기한·대상 항목은 <Link href="/legal/data-deletion" className="text-brand underline">데이터 삭제 안내</Link> 를 참조해주십시오.
        </FaqItem>

        <FaqItem id="security" question="보안 관련 자료는 어디서 확인하나요?">
          공개 <Link href="/status" className="text-brand underline">시스템 상태 페이지</Link> 에서 SLO·인시던트 이력을, <Link href="/.well-known/security.txt" className="text-brand underline">security.txt</Link> 에서 보안 연구자용 공식 제보 경로를 제공합니다. 학교·기관 실사 시점에는 보다 상세한 보안 아키텍처 문서를 별도 제공해드립니다.
        </FaqItem>

        <FaqItem id="data-export" question="내 데이터를 내려받을 수 있나요?">
          네. <Link href="/me/data" className="text-brand underline">내 데이터 페이지</Link> 에서 본인의 프로필·활동 기록을 JSON 파일로 즉시 다운로드하실 수 있습니다. 기관 관리자는 소속 학생 통합 리포트를 CSV·JSON·PDF 형식으로 내려받으실 수 있습니다.
        </FaqItem>
      </section>

      <section id="institution" aria-labelledby="h-inst" className="mb-14 scroll-mt-16">
        <h2 id="h-inst" className="text-[20px] font-bold text-txt-primary mb-6">학교·기관 도입</h2>

        <FaqItem id="institution-intro" question="학교 차원의 도입은 어떻게 진행되나요?">
          창업교육센터·학생지원처·산학협력단 등 기관 담당자분과 먼저 30분 정도 인터뷰를 하며 니즈를 파악하고, 소속 동아리 1~2개에서 시범 운영한 뒤 확대 여부를 함께 판단하는 순서로 진행합니다. 도입 전 별도의 보안·개인정보 실사 자료가 필요하시면 이메일로 요청 부탁드립니다.
        </FaqItem>

        <FaqItem id="institution-report" question="실적 보고서는 어떤 형태로 나오나요?">
          기관 관리자 화면에서 소속 학생·동아리의 활동 현황을 CSV·JSON·PDF 형식으로 내려받으실 수 있습니다. LINC 3.0 실적 보고 등 학기말 보고서에 곧바로 들어갈 수 있는 형태로 설계되었으며, 감사 로그도 별도 포함됩니다.
        </FaqItem>

        <FaqItem id="branding" question="학교 로고·테마로 커스터마이즈 가능한가요?">
          기관 계약 단계에서 로고·색상·도메인 커스터마이즈를 지원할 예정입니다. 현재는 클로즈드 베타 범위 내에서 기본 테마로 제공되며, 정식 도입 논의 시 협의 가능합니다.
        </FaqItem>
      </section>

      <section id="billing" aria-labelledby="h-billing" className="mb-14 scroll-mt-16">
        <h2 id="h-billing" className="text-[20px] font-bold text-txt-primary mb-6">결제·플랜</h2>

        <FaqItem id="pricing" question="유료 플랜은 언제부터 나오나요?">
          현재 모든 기능이 무료입니다. 향후 유료 플랜은 (1) 개별 학생·동아리 운영진용 Free 유지, (2) 고급 자동화·외부 연동을 원하는 동아리 Pro, (3) 학교·기관 단위 Enterprise 의 3단계로 검토 중입니다. 구체 가격·시점은 아직 미정이며, 기존 유저에게는 충분한 사전 공지를 드리겠습니다.
        </FaqItem>

        <FaqItem id="beta-migration" question="베타 종료 후 유료로 전환되나요?">
          베타 기간에 만든 콘텐츠·클럽·페르소나는 모두 그대로 유지됩니다. Free 플랜에 포함되는 범위는 모두 계속 무료이며, 일부 고급 기능만 Pro·Enterprise 로 분리될 가능성이 있습니다. 해당 전환 시점이 오면 이메일로 선택지를 드리겠습니다.
        </FaqItem>
      </section>

      {/* 문의 */}
      <section aria-labelledby="h-contact" className="mt-16 pt-12 border-t border-border">
        <h2 id="h-contact" className="text-[20px] font-bold text-txt-primary mb-3">더 궁금하신 게 있다면</h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed mb-6">
          위에 없는 질문은 편하게 이메일로 문의해주십시오. 보통 영업일 기준 72시간 이내, 보안 관련은 24시간 이내 답변드립니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:team@dailydraft.me?subject=Draft%20%EB%AC%B8%EC%9D%98"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-inverse text-txt-inverse text-[14px] font-bold hover:opacity-90 transition-opacity"
          >
            일반 문의
          </a>
          <a
            href="mailto:team@dailydraft.me?subject=Institution%20Inquiry"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-txt-primary text-[14px] font-bold hover:border-txt-tertiary transition-colors"
          >
            학교·기관 문의
          </a>
          <a
            href="mailto:team@dailydraft.me?subject=Security%20Report"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-txt-primary text-[14px] font-bold hover:border-txt-tertiary transition-colors"
          >
            보안 제보
          </a>
        </div>
      </section>
    </main>
  )
}

function CategoryLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface-card text-[13px] font-semibold text-txt-primary hover:border-txt-tertiary transition-colors"
    >
      <Icon size={14} className="text-brand" aria-hidden="true" />
      {label}
    </a>
  )
}

function FaqItem({ id, question, children }: { id: string; question: string; children: React.ReactNode }) {
  return (
    <details id={id} className="group mb-3 scroll-mt-16 rounded-xl border border-border bg-surface-card">
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-[15px] font-semibold text-txt-primary">
        <span className="flex-1">{question}</span>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-txt-tertiary group-open:rotate-45 transition-transform"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 text-[14px] text-txt-secondary leading-relaxed">
        {children}
      </div>
    </details>
  )
}
