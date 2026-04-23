'use client'

import { ArrowRight, CheckCircle2, Check } from 'lucide-react'
import { SOURCE_OPTIONS } from '@/src/lib/onboarding/constants'
import type { ProfileDraft } from '@/src/lib/onboarding/types'

// localStorage 에 의미 있는 draft 가 있을 때 intro 대신 먼저 노출.
// "계속 작성하기 / 새로 시작하기" 두 선택지.
//
// 통일 토큰: ob-atmos 풀블리드 + w-14 아이콘 + ob-stagger-item 60ms + Title milestone + 합쇼체.
// 카드 wrapper(bg-surface-card border shadow-xl)는 제거 — 다른 milestone 화면들과 동일한 톤.
interface RecoveryOfferProps {
  draft: ProfileDraft
  onResume: () => void
  onDiscard: () => void
}

export function RecoveryOffer({ draft, onResume, onDiscard }: RecoveryOfferProps) {
  const filled: string[] = []
  if (draft.name?.trim()) filled.push(`닉네임 "${draft.name.trim()}"`)
  if (draft.source) {
    const src = SOURCE_OPTIONS.find(s => s.value === draft.source)
    if (src) filled.push(src.label.replace(/ 왔습니다$|이시다면$/, ''))
  }
  if (draft.position) filled.push('활동 분야')
  if (draft.interests.length > 0) filled.push(`관심 분야 ${draft.interests.length}개`)
  if (draft.skills.length > 0) filled.push(`스킬 ${draft.skills.length}개`)

  return (
    // 3-layer 센터링 (다른 milestone 화면과 동일).
    <div className="fixed inset-0 ob-atmos overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full flex flex-col items-center py-4">
        <div
          className="ob-stagger-item w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center mb-4"
          style={{ ['--stagger' as string]: '0ms' }}
        >
          <CheckCircle2 size={24} className="text-brand" strokeWidth={2} />
        </div>
        <h2
          className="ob-stagger-item text-[22px] sm:text-[24px] font-black text-txt-primary mb-2 leading-tight text-center"
          style={{ ['--stagger' as string]: '60ms' }}
        >
          이전에 작성하시던 내용이 있습니다
        </h2>
        <p
          className="ob-stagger-item text-[13px] text-txt-secondary leading-relaxed mb-4 break-keep text-center max-w-sm"
          style={{ ['--stagger' as string]: '120ms' }}
        >
          이어서 작성하실 수 있도록 기기에 자동 저장되어 있었습니다. 처음부터 다시 시작하시려면 &quot;새로 시작하기&quot; 를 눌러 주십시오.
        </p>
        {filled.length > 0 && (
          <div
            className="ob-stagger-item w-full bg-surface-sunken rounded-2xl p-3.5 mb-4"
            style={{ ['--stagger' as string]: '180ms' }}
          >
            <p className="text-[11px] font-semibold text-txt-tertiary mb-1.5">
              저장된 항목
            </p>
            <ul className="text-[12px] text-txt-secondary space-y-0.5">
              {filled.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Check size={11} className="text-brand shrink-0 mt-1" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div
          className="ob-stagger-item w-full space-y-2"
          style={{ ['--stagger' as string]: '240ms' }}
        >
          <button
            type="button"
            onClick={onResume}
            className="ob-press-spring w-full flex items-center justify-center gap-2 py-4 bg-surface-inverse text-txt-inverse rounded-full text-[14px] font-black hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.3)]"
          >
            <ArrowRight size={15} />
            이어서 작성하기
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full py-3 text-[13px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
          >
            새로 시작하기
          </button>
        </div>
        <p
          className="ob-stagger-item text-[11px] text-txt-tertiary text-center mt-3 leading-relaxed"
          style={{ ['--stagger' as string]: '300ms' }}
        >
          저장된 내용은 기기에만 보관되며, 새로 시작하시면 완전히 삭제됩니다.
        </p>
        </div>
      </div>
    </div>
  )
}
