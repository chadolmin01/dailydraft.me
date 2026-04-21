import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Download, Mail, Camera } from 'lucide-react'

export const metadata: Metadata = {
  title: '프레스킷 · Draft',
  description:
    '언론·파트너·콘퍼런스 주최측을 위한 Draft 프레스킷. 로고·팩트 시트·대표 프로필·인용 가능 문구.',
  alternates: { canonical: '/press' },
  openGraph: {
    type: 'article',
    title: '프레스킷 · Draft',
    description: '로고·팩트 시트·대표 프로필.',
    url: '/press',
    locale: 'ko_KR',
  },
}

/**
 * /press — 언론·파트너용 프레스킷.
 *
 * 포함:
 *   - 회사 한 줄 · 세 줄 · 한 문단 설명 (언론 복사용)
 *   - 대표 프로필 (이성민)
 *   - 주요 숫자 팩트 시트
 *   - 로고 자산 링크 (여기선 라이트/다크 SVG 1 파일씩 기본 제공)
 *   - 인용 가능 문구 3개
 */

export default function PressPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <p className="text-[12px] font-semibold text-brand mb-3">Press Kit</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">프레스킷</h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          취재·파트너십·콘퍼런스 스피커 발표 등에서 사용하실 수 있는 공식 자료를 모았습니다.
          인용·재구성 모두 자유이며, 원문이 필요하신 경우 이메일로 요청 주시면 Google Docs 초안을
          개별 공유드립니다.
        </p>
      </header>

      <section className="mb-10 space-y-3">
        <h2 className="text-[17px] font-bold text-txt-primary mb-2 flex items-center gap-2">
          <FileText size={14} aria-hidden="true" />
          회사 소개 (복사용)
        </h2>

        <PressBlock label="한 줄">
          Draft 는 대학 동아리의 운영 기록을 기관의 기억 자산으로 누적하는 운영 인프라입니다.
        </PressBlock>

        <PressBlock label="세 줄">
          Draft 는 대학 동아리가 세대를 넘어 기억을 축적하도록 돕는 SaaS 입니다. 학생은 Slack·
          Discord·카톡 등 기존 채널에서 평소처럼 소통하고, 그 결과가 Draft 안에서 구조화된 기록으로
          자동 저장됩니다. 대학 창업교육센터·산학협력단은 모은 데이터를 기관 성과 보고에 재사용할 수
          있습니다.
        </PressBlock>

        <PressBlock label="한 문단">
          Draft 는 2026년 초 출범한 대학생 동아리 운영 인프라입니다. 학생 동아리가 매 학기 새 사람으로
          교체되면서 잃어버리던 맥락을 구조화된 기록으로 전환하는 것을 목표로, 기존 소통 도구(Slack·
          Discord·카톡·Notion) 위에 &apos;기억 계층&apos;을 얹습니다. 현재 경희대학교 국제캠퍼스 등
          초기 파일럿 동아리와 함께 1기 프로그램을 운영 중이며, 공개 런칭은 파일럿 데이터로 신뢰 센터의
          지표가 의미 있는 수준에 이른 뒤로 계획하고 있습니다.
        </PressBlock>
      </section>

      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3">팩트 시트</h2>
        <dl className="bg-surface-card border border-border rounded-2xl divide-y divide-border">
          <FactRow label="설립" value="2026년" />
          <FactRow label="본사" value="대한민국 · 서울" />
          <FactRow label="대표" value="이성민 (FLIP 10-1대 회장)" />
          <FactRow label="단계" value="1기 파일럿 운영 중" />
          <FactRow label="주요 기술" value="Next.js · Supabase · Anthropic Claude · Google Gemini" />
          <FactRow label="컴플라이언스" value="PIPA · Meta Platform Terms · WCAG 2.1 AA 목표" />
          <FactRow
            label="공식 URL"
            value={
              <a href="https://dailydraft.me" className="text-brand underline">
                dailydraft.me
              </a>
            }
          />
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Camera size={14} aria-hidden="true" />
          로고 자산
        </h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed mb-4">
          기본 워드마크는 라이트·다크 2가지이며 PNG·SVG 모두 제공합니다. 추가 변형(심볼만, 컬러 변형
          등)이 필요하시면 이메일로 요청 주세요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LogoCard mode="light" />
          <LogoCard mode="dark" />
        </div>
        <p className="text-[11px] text-txt-tertiary mt-3">
          여백 규칙: 로고 둘레에 워드마크 높이의 50% 이상 여백을 확보해 주세요. 색 변경·회전·효과 적용은
          별도 협의.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3">인용 가능 문구</h2>
        <div className="space-y-3">
          <Quote author="이성민 (대표)">
            학생 동아리가 매 학기 사람이 바뀌어도 쌓아온 맥락이 증발하지 않도록, 일상 업무 위에 기억
            계층을 얹는다 — 이것이 Draft 의 핵심 제안입니다.
          </Quote>
          <Quote author="이성민 (대표)">
            우리는 소통 툴을 대체하지 않습니다. Slack·Discord·카톡을 그대로 쓰면서도, 그 결과가
            기관이 활용할 수 있는 구조화된 기록으로 쌓이는 것을 목표로 합니다.
          </Quote>
          <Quote author="이성민 (대표)">
            AI 가 충분히 저렴해진 지금은 학생 쪽이 감당하던 &apos;매일 5분의 인지 부하&apos;를
            인프라가 대신 감당할 수 있는 시대입니다.
          </Quote>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1.5">
        <p className="flex items-center gap-1.5">
          <Mail size={12} aria-hidden="true" />
          언론 문의:{' '}
          <a href="mailto:team@dailydraft.me?subject=Press" className="text-brand underline">
            team@dailydraft.me
          </a>{' '}
          (제목에 [Press] 포함 권장)
        </p>
        <p>
          관련 페이지:{' '}
          <Link href="/about" className="text-brand underline">
            Draft 소개
          </Link>{' '}
          ·{' '}
          <Link href="/changelog" className="text-brand underline">
            릴리스 노트
          </Link>{' '}
          ·{' '}
          <Link href="/enterprise" className="text-brand underline">
            기관 도입
          </Link>
        </p>
      </footer>
    </main>
  )
}

function PressBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-2">
        {label}
      </div>
      <p className="text-[14px] text-txt-primary leading-relaxed">{children}</p>
    </div>
  )
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <dt className="w-32 shrink-0 text-[12px] font-semibold text-txt-tertiary">{label}</dt>
      <dd className="flex-1 text-[13px] text-txt-primary">{value}</dd>
    </div>
  )
}

function LogoCard({ mode }: { mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark'
  return (
    <div
      className={`rounded-2xl border ${isDark ? 'bg-black border-black' : 'bg-white border-border'} p-8 flex flex-col items-center justify-center gap-4`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 ${isDark ? 'bg-white' : 'bg-black'} rounded-lg flex items-center justify-center`}>
          <span className={`${isDark ? 'text-black' : 'text-white'} font-bold text-base`}>D</span>
        </div>
        <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Draft
        </span>
      </div>
      <a
        href={`https://dailydraft.me/${isDark ? 'brand-dark.svg' : 'brand-light.svg'}`}
        download
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${isDark ? 'text-white/70 hover:text-white' : 'text-txt-tertiary hover:text-txt-primary'} transition-colors`}
      >
        <Download size={11} aria-hidden="true" />
        {isDark ? 'Dark SVG 다운로드' : 'Light SVG 다운로드'}
      </a>
    </div>
  )
}

function Quote({ author, children }: { author: string; children: React.ReactNode }) {
  return (
    <blockquote className="bg-surface-card border border-border rounded-xl p-5">
      <p className="text-[14px] text-txt-primary leading-relaxed">&ldquo;{children}&rdquo;</p>
      <footer className="text-[11px] text-txt-tertiary mt-2">— {author}</footer>
    </blockquote>
  )
}
