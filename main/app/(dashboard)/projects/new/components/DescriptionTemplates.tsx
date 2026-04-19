'use client'

import { Sparkles } from 'lucide-react'

interface Template {
  key: string
  label: string
  body: string
}

export const PROJECT_DESCRIPTION_TEMPLATES: Template[] = [
  {
    key: 'side',
    label: '사이드 프로젝트',
    body: `[우리가 풀려는 문제]
- (구체적 상황과 불편함)

[지금까지 한 것]
- (아이디어 검증·프로토타입·사용자 인터뷰 등)

[현재 진행 단계]
- (주차 · 목표 마일스톤)

[함께하고 싶은 사람]
- (스킬·태도·관심 분야)`,
  },
  {
    key: 'startup',
    label: '창업 MVP',
    body: `[문제·타겟]
- (누구의 어떤 문제)

[우리의 가설]
- (왜 이 방법으로 풀릴 것이라 믿는가)

[현재 성과]
- (검증된 지표·피드백·선주문)

[함께 만들 역할]
- (CTO/CPO/디자인리드 등 — 지분·참여도 공유 의향)`,
  },
  {
    key: 'study',
    label: '학회/스터디',
    body: `[주제·목적]
- (무엇을 왜 배우려 하는가)

[커리큘럼 초안]
- 1주차: ...
- 2주차: ...

[원하는 멤버]
- (기초 지식·투자 가능 시간·학기 일정)`,
  },
  {
    key: 'hackathon',
    label: '해커톤·단기',
    body: `[대회·일정]
- (대회명 · D-Day · 결과 발표)

[아이디어 방향]
- (한줄 피치)

[필요한 역할]
- (개발 N명 · 디자인 N명 · 기획 N명)

[작업 방식]
- (온라인/오프라인 · 주당 시간)`,
  },
  {
    key: 'open',
    label: '오픈 프로젝트',
    body: `[프로젝트 목표]
- (미션·엔드유저)

[현재 상태]
- (공개 레포·문서·배포 URL)

[기여 방식]
- (이슈 라벨·PR 절차·커뮤니케이션 채널)

[원하는 참여자]
- (진입 난이도·멘토 가능 여부)`,
  },
]

interface Props {
  onInsert: (body: string) => void
  hasContent: boolean
}

export function DescriptionTemplates({ onInsert, hasContent }: Props) {
  if (hasContent) return null

  return (
    <div className="mb-2 flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[11px] text-txt-tertiary mr-1">
        <Sparkles size={10} />
        템플릿 시작:
      </span>
      {PROJECT_DESCRIPTION_TEMPLATES.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onInsert(t.body)}
          className="text-[11px] font-medium text-txt-secondary bg-surface-sunken hover:bg-brand-bg hover:text-brand px-2 py-1 rounded-full transition-colors"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
