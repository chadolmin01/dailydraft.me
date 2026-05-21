import type { Metadata } from 'next'
import Link from 'next/link'
import { Palette } from 'lucide-react'

export const metadata: Metadata = {
  title: '브랜드 가이드라인 · Draft',
  description:
    'Draft 브랜드 시각 체계 — 로고·컬러·타이포·여백·사용 금지 사례. 파트너·언론·기관용 공식 가이드.',
  alternates: { canonical: '/brand' },
  openGraph: {
    type: 'article',
    title: '브랜드 가이드라인 · Draft',
    description: '로고·컬러·타이포·금지 사례.',
    url: '/brand',
    locale: 'ko_KR',
  },
}

/**
 * /brand — 외부 파트너·언론용 브랜드 규칙.
 *
 * 내부 디자인 토큰(/design) 과 분리 — 이 페이지는 로고 사용 권리·여백·금지 사례에 집중.
 * 색 토큰 일부 노출하되 내부 surface/* 체계는 공개하지 않음.
 */

export default function BrandPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">브랜드</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 브랜드 가이드라인
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          파트너·언론·기관이 Draft 로고·컬러를 정확하게 재현할 수 있도록 원칙을 정리했습니다. 상업적
          사용·광고·브랜드 협업 전에는 반드시 이메일 확인 부탁드립니다.
        </p>
      </header>

      {/* 로고 */}
      <section className="mb-12">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">로고 사용 규칙</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-white border border-border rounded-2xl p-8 flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-black">Draft</span>
          </div>
          <div className="bg-black border border-black rounded-2xl p-8 flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-base">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Draft</span>
          </div>
        </div>
        <ul className="text-[13px] text-txt-secondary space-y-1.5 list-disc pl-5">
          <li>최소 크기: 심볼 높이 16px 이상 (웹), 인쇄 시 6mm 이상.</li>
          <li>여백: 심볼 높이의 50% 이상 사방에 확보.</li>
          <li>기본 워드마크는 라이트·다크 2가지. 단색 변형은 별도 협의.</li>
          <li>PNG·SVG 파일은{' '}
            <Link href="/press" className="text-brand underline">
              프레스킷
            </Link>{' '}
            에서 다운로드.
          </li>
        </ul>
      </section>

      {/* 컬러 */}
      <section className="mb-12">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">기본 컬러</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ColorSwatch name="Brand" hex="#3B82F6" subtitle="주요 CTA·링크" />
          <ColorSwatch name="Black" hex="#0F172A" subtitle="텍스트·로고" />
          <ColorSwatch name="Ink" hex="#1E293B" subtitle="본문 보조" />
          <ColorSwatch name="Mute" hex="#64748B" subtitle="메타 정보" />
          <ColorSwatch name="Surface" hex="#F8FAFC" subtitle="배경" />
          <ColorSwatch name="Border" hex="#E2E8F0" subtitle="구분선" />
        </div>
        <p className="text-[11px] text-txt-tertiary mt-3">
          모든 텍스트/배경 조합은 WCAG AA 대비 4.5:1 이상을 만족해야 합니다. 다크 모드 변형은 내부
          토큰 체계에서 자동 치환되며 외부 재현 시 주의 요망.
        </p>
      </section>

      {/* 타이포 */}
      <section className="mb-12">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">타이포그래피</h2>
        <ul className="text-[13px] text-txt-secondary space-y-2 list-disc pl-5">
          <li>
            <strong className="text-txt-primary">UI 본문:</strong> Inter (영문), Pretendard (한글).
            기본 크기 13~14px, leading 1.5.
          </li>
          <li>
            <strong className="text-txt-primary">헤드라인:</strong> tracking-tight · font-bold
            (700) · font-black (900) 큰 제목.
          </li>
          <li>
            <strong className="text-txt-primary">모노:</strong> JetBrains Mono (지표·숫자·시각 스탬프).
          </li>
        </ul>
      </section>

      {/* 톤 */}
      <section className="mb-12">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">카피 톤 & 매너</h2>
        <ul className="text-[13px] text-txt-secondary space-y-1.5 list-disc pl-5">
          <li>기본 어미는 합쇼체(&quot;-습니다/-입니다&quot;).</li>
          <li>과장 금지: &quot;혁명&quot;, &quot;최고&quot;, &quot;유일한&quot; 같은 단어 회피.</li>
          <li>
            개념어 과잉 금지: &quot;파이프라인&quot;, &quot;아젠다&quot;, &quot;레퍼런스&quot; 등을 한국어 풀어쓰기로 대체.
          </li>
          <li>장식 요소(그라디언트 액센트, 영문 대문자 모노 라벨) 금지.</li>
        </ul>
      </section>

      {/* 금지 사례 */}
      <section className="mb-12">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4">사용 금지 사례</h2>
        <ul className="text-[13px] text-txt-secondary space-y-1.5 list-disc pl-5">
          <li>로고를 회전·왜곡·그림자 효과 적용해 사용</li>
          <li>로고 색을 임의 변경해 배경과 섞기</li>
          <li>심볼과 워드마크를 분리해 별개 이미지로 재구성</li>
          <li>공식 자료에 명시되지 않은 슬로건·태그라인 생성</li>
          <li>Draft 가 승인하지 않은 파트너십·보증을 암시하는 문구 사용</li>
        </ul>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          브랜드 협의·상업적 사용 문의:{' '}
          <a href="mailto:team@dailydraft.me?subject=Brand%20Usage" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
        <p>
          관련 페이지:{' '}
          <Link href="/press" className="text-brand underline">
            프레스킷
          </Link>{' '}
          ·{' '}
          <Link href="/about" className="text-brand underline">
            Draft 소개
          </Link>
        </p>
      </footer>
    </main>
  )
}

function ColorSwatch({ name, hex, subtitle }: { name: string; hex: string; subtitle: string }) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      <div className="h-16" style={{ backgroundColor: hex }} />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-txt-primary">{name}</span>
          <code className="text-[11px] font-mono text-txt-tertiary">{hex}</code>
        </div>
        <div className="text-[11px] text-txt-tertiary mt-0.5">{subtitle}</div>
      </div>
    </div>
  )
}
