'use client'

import { Sparkles } from 'lucide-react'

interface Props {
  clubName: string
  canCreate: boolean
  isCreating: boolean
  onCreate: () => void
}

/**
 * 페르소나가 아직 만들어지지 않은 상태.
 * 설명: "왜 이걸 만들어야 하는가"를 회장에게 한 문단으로 설득.
 */
export function PersonaEmptyState({ clubName, canCreate, isCreating, onCreate }: Props) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-surface-bg flex items-center justify-center">
        <Sparkles size={22} className="text-txt-secondary" />
      </div>
      <h2 className="text-base font-bold text-txt-primary mb-2">
        아직 브랜드 페르소나가 없습니다
      </h2>
      <p className="text-sm text-txt-secondary leading-relaxed mb-6 max-w-md mx-auto">
        {clubName}의 정체성, 톤, 독자를 한 번 정의해두면
        <br />
        주간 업데이트·모집 공고·SNS 캡션이 모두 같은 목소리로 발행됩니다.
      </p>
      {canCreate ? (
        <button
          onClick={onCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {isCreating ? '생성 중...' : '브랜드 페르소나 만들기'}
        </button>
      ) : (
        <p className="text-xs text-txt-tertiary">
          대표 또는 운영진만 페르소나를 만들 수 있습니다
        </p>
      )}
    </div>
  )
}
