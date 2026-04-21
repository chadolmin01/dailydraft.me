import type { Metadata } from 'next'
import Link from 'next/link'
import { Accessibility, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: '접근성 선언 · Draft',
  description:
    'Draft 의 웹 접근성 목표·현재 준수 수준·사용한 기법·한계·제보 경로. WCAG 2.1 AA 및 KWCAG 2.2 기준.',
  alternates: { canonical: '/accessibility' },
  openGraph: {
    type: 'article',
    title: '접근성 선언 · Draft',
    description: 'WCAG 2.1 AA / KWCAG 2.2 준수 현황과 제보 경로.',
    url: '/accessibility',
    locale: 'ko_KR',
  },
}

/**
 * /accessibility — 공개 접근성 선언(Accessibility Statement).
 *
 * 한국 공공기관·대학 파트너십 요건:
 *   - 국가정보화기본법 시행령 제34조 및 KWCAG 2.2 권고
 *   - 장애인차별금지법 제21조
 *
 * 엔터프라이즈 계약 체크리스트에서 "접근성 선언 URL" 을 자주 요청.
 */

export default function AccessibilityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Accessibility size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">접근성 선언</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 의 웹 접근성 방침
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          Draft 는 장애 여부·기기·네트워크 환경과 무관하게 모든 이용자가 동등하게 서비스를 이용할 수
          있도록 설계합니다. WCAG 2.1 AA(Level AA) 및 한국형 웹 콘텐츠 접근성 지침(KWCAG) 2.2 를
          준수 목표로 삼고 있으며, 본 선언은 현재 상태·한계·개선 계획을 투명하게 기록하기 위한
          공개 문서입니다.
        </p>
        <p className="text-[12px] text-txt-tertiary mt-3">최종 개정: 2026-04-22</p>
      </header>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">1. 준수 수준</h2>
        <p>
          <strong className="text-txt-primary">부분 준수 (Partial Conformance) — WCAG 2.1 AA.</strong>{' '}
          인증 기관 심사는 받지 않았으며, 자체 점검과 지속 개선을 통해 준수 항목을 확장하고 있습니다.
        </p>
        <p>
          자체 점검은 릴리스마다 axe DevTools·Lighthouse·NVDA/VoiceOver 수동 테스트로 수행합니다.
          외부 감사는 상용화 시점 전까지 확보 예정입니다.
        </p>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">2. 적용된 기법</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>모든 대화형 요소에 키보드 포커스·tab order 유지 (focus-visible ring 명시)</li>
          <li>버튼·아이콘 링크에 aria-label 또는 visually-hidden 텍스트</li>
          <li>색 대비 WCAG AA(4.5:1) 토큰 체계 — txt-primary/surface 조합 전수 검증</li>
          <li>시스템 테마 자동 감지 + 수동 다크/라이트 전환</li>
          <li>skip-to-content 링크 (첫 Tab 에 노출)</li>
          <li>ARIA live region 으로 토스트·스크린리더 알림 동시 전달</li>
          <li>
            이미지 대체 텍스트: 의미 전달용 이미지는 alt, 장식용은 alt="" + aria-hidden 분리
          </li>
          <li>폼 입력: label 연결, 에러 시 aria-invalid + aria-describedby</li>
          <li>
            prefers-reduced-motion 존중 — 사용자 설정 시 스프링 애니메이션 short-circuit
          </li>
          <li>시맨틱 랜드마크(header/main/nav/aside/footer) 사용</li>
        </ul>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">3. 알려진 한계</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>일부 모달·커맨드 팔레트(Cmd+K) 에서 Focus trap 이 일부 브라우저에서 미세하게 깨질 수 있음</li>
          <li>복잡한 대시보드(차트·리스트) 의 screen reader 요약은 텍스트 대안이 아직 간소함</li>
          <li>일부 3rd-party OAuth 동의 페이지(Discord·Meta)는 외부 도메인이라 Draft 통제 범위 밖</li>
          <li>모바일 접근성은 WebView 테스트가 진행 중. 네이티브 앱 계획 없음 — PWA 우선 개선.</li>
          <li>Discord 봇 임베드 메시지는 Discord 의 자체 접근성 수준을 따름</li>
        </ul>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">4. 대체 채널</h2>
        <p>
          웹 UI 로 접근이 어려우신 경우, 이메일로 문의 주시면 같은 기능을 수동 절차로 대체 제공해
          드립니다. 대학·기관의 보조 수단 요청(PDF 대체 문서, 오디오 요약 등)도 개별 대응합니다.
        </p>
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">5. 피드백·제보</h2>
        <p>
          접근성 관련 문제를 발견하셨다면 아래 경로로 제보 부탁드립니다. 가능한 경우 7영업일 이내
          확인·대응 계획을 회신드리며, 수정 배포 일정을 공유합니다.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <a
            href="mailto:team@dailydraft.me?subject=Accessibility%20Report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-inverse text-txt-inverse text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            <Mail size={14} aria-hidden="true" />
            접근성 문제 이메일 제보
          </a>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-txt-primary text-[13px] font-semibold hover:border-txt-tertiary transition-colors"
          >
            자주 묻는 질문
          </Link>
        </div>
      </section>

      <footer className="mt-16 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>본 선언은 분기별 재검토를 원칙으로 하며, 변경 시 릴리스 노트에 기재합니다.</p>
        <p>
          관련 문서:{' '}
          <Link href="/legal/privacy" className="text-brand underline">
            개인정보처리방침
          </Link>{' '}
          ·{' '}
          <Link href="/security" className="text-brand underline">
            보안 제보
          </Link>{' '}
          ·{' '}
          <Link href="/trust" className="text-brand underline">
            신뢰 센터
          </Link>
        </p>
      </footer>
    </main>
  )
}
