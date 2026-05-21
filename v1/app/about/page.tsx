import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, Users, Target } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Draft 소개 · 동아리의 세대를 잇는 인프라',
  description:
    'Draft 의 미션·탄생 배경·팀. 대학 동아리가 세대를 넘어 기억을 축적하도록 돕는 운영 인프라를 만들고 있습니다.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'article',
    title: 'Draft 소개',
    description: '동아리의 세대를 잇는 인프라.',
    url: '/about',
    locale: 'ko_KR',
  },
}

/**
 * /about — Draft 의 미션·탄생 배경·팀.
 *
 * 포지셔닝 기조:
 *   - 기능 소개가 아니라 "왜 만들었는가" 를 전달.
 *   - 과장·hype 금지. 현재 단계는 1기 파일럿이라는 사실을 숨기지 않음.
 *   - 카피는 합쇼체.
 */

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-14">
        <p className="text-[12px] font-semibold text-brand mb-3">Draft 소개</p>
        <h1 className="text-[32px] font-bold text-txt-primary tracking-tight leading-tight">
          동아리의 세대를 잇는 인프라를 만들고 있습니다
        </h1>
        <p className="text-[15px] text-txt-secondary mt-4 leading-relaxed">
          학생 동아리는 매 학기 새 사람으로 바뀝니다. 운영진이 바뀌면 예전 회의록은 개인 드라이브에
          묻히고, 이전 기수가 쌓은 맥락은 인수인계 문서 한 장으로 요약됩니다. Draft 는 이 상실을
          구조적으로 막기 위해 만들어진 운영 인프라입니다.
        </p>
      </header>

      <section className="mb-14">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Compass size={14} className="text-brand" aria-hidden="true" />
          미션
        </h2>
        <p className="text-[14px] text-txt-secondary leading-relaxed">
          학생 동아리의 운영 기록을 기관의 자산으로 누적합니다. 학생은 평소처럼 Slack·Discord·
          Notion·카톡 등에서 소통하면서, 그 결과가 자동으로 구조화된 기억으로 축적되는 경험을 목표로
          합니다. 운영은 Draft에, 소통은 원하는 곳에 — 이것이 기본 약속입니다.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Target size={14} className="text-brand" aria-hidden="true" />
          왜 지금인가
        </h2>
        <div className="text-[14px] text-txt-secondary leading-relaxed space-y-3">
          <p>
            첫째, 학생 세대는 툴이 너무 많아져 오히려 "어디에 무엇이 있는지" 를 기억하지 못하는
            단계에 진입했습니다. 동아리가 관리해야 할 채널·시트·드라이브는 매년 증가하지만, 이것들을
            연결해 주는 계층은 여전히 공백입니다.
          </p>
          <p>
            둘째, 대학 창업교육센터·산학협력단은 동아리 활동을 기관 성과로 집계해야 하지만, 현실적으로
            매 학기 엑셀을 수거하는 방식으로 운영되고 있습니다. 자동화가 가능한 레이어가 분명히
            있음에도 아직 누구도 그 자리를 채우지 못했습니다.
          </p>
          <p>
            셋째, AI 가 충분히 저렴해지면서 "매일 5분의 인지 부하" 를 학생 쪽이 아니라 인프라 쪽에서
            대신 감당할 수 있는 시대가 왔습니다. Draft 는 이 타이밍에 나온 도구입니다.
          </p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-[17px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Users size={14} className="text-brand" aria-hidden="true" />
          팀
        </h2>
        <div className="text-[14px] text-txt-secondary leading-relaxed space-y-3">
          <p>
            Draft 는 2026년 초부터 소수 인원으로 설계·개발·운영되고 있습니다. 창립자 이성민(경희대학교
            국제캠퍼스 창업동아리 FLIP 10-1대 회장)이 실제 동아리 운영자의 시선에서 필요한 기능을
            정의하고, 기술 구현은 AI 보조(Claude Code·Cursor)와 함께 수행하는 구조입니다. 매 릴리스의
            근거와 의도는{' '}
            <Link href="/changelog" className="text-brand underline">
              공개 릴리스 노트
            </Link>{' '}
            에 남깁니다.
          </p>
          <p>
            투자·채용은 1기 파일럿 성과를 본 이후 단계적으로 확장할 예정입니다. 지금은 소규모로 빠르게
            반복하는 것이 더 중요하다고 판단했습니다.
          </p>
        </div>
      </section>

      <section className="mb-14 bg-surface-card border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-bold text-txt-primary mb-3">현재 단계 (솔직한 공개)</h2>
        <ul className="text-[13px] text-txt-secondary leading-relaxed space-y-1.5 list-disc pl-5">
          <li>
            첫 파일럿 기수(1기) 진행 중 — 동아리 3~5곳 내외, 한정된 규모에서만 실데이터를 쌓고
            있습니다.
          </li>
          <li>
            공개 런칭은 1기 데이터로{' '}
            <Link href="/trust" className="text-brand underline">
              신뢰 센터
            </Link>
            의 지표가 의미 있는 수준까지 채워진 뒤로 계획합니다.
          </li>
          <li>
            엔터프라이즈·대학 파트너십은 상시 협의 중이며, 실사 자료는{' '}
            <Link href="/legal" className="text-brand underline">
              법적 고지 모음
            </Link>
            에서 확인 가능합니다.
          </li>
        </ul>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          함께 만들고 싶으시다면{' '}
          <a href="mailto:team@dailydraft.me?subject=Join" className="text-brand underline">
            team@dailydraft.me
          </a>
          . 파일럿 참여는{' '}
          <Link href="/recruit" className="text-brand underline">
            1기 모집
          </Link>
          에서.
        </p>
      </footer>
    </main>
  )
}
