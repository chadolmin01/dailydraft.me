'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { PenLine } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  personaId: string
  isOpen: boolean
  onClose: () => void
}

type Phase = 'form' | 'running' | 'done' | 'error'

const PRESETS: Array<{ label: string; instruction: string }> = [
  { label: '더 격식있게', instruction: '전체적으로 더 격식있는 비즈니스 톤으로. 합쇼체 유지하되 감성 표현은 줄이고 수치·근거 중심으로.' },
  { label: 'GenZ 톤으로', instruction: '2000년대생 독자에게 친근하게. 과한 격식은 빼고 실용적이고 직설적으로. 신조어·이모지는 최소한만.' },
  { label: '기술 전문가 대상으로', instruction: '기술 전문가 독자를 가정하고 다시. 전문 용어·아키텍처·수치 중심. 초보 친화적 설명은 빼도 됨.' },
  { label: '더 짧고 예리하게', instruction: '모든 슬롯을 30% 압축. 불필요한 부연 설명 제거하고 핵심 문장만. 한 문장당 의미 밀도 최대화.' },
  { label: '스폰서 영업 모드', instruction: '잠재 스폰서·파트너가 보기 좋도록 audience_mode=sponsor로. 협업 가치·ROI·조직 역량 강조.' },
]

/**
 * "AI에게 다듬기 맡기기" 모달.
 * 자연어 지시 또는 프리셋 하나 → 현재 슬롯들 일괄 rewrite.
 * Gemini가 지시 무관 슬롯은 건드리지 않고, 변경된 슬롯만 저장.
 */
export function AIPolishModal({ personaId, isOpen, onClose }: Props) {
  const qc = useQueryClient()
  const [phase, setPhase] = useState<Phase>('form')
  const [instruction, setInstruction] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<{
    changed_count: number
    skipped_count: number
    changed_fields: string[]
  } | null>(null)

  const canSubmit = instruction.trim().length >= 3 && instruction.trim().length <= 300

  const submit = async () => {
    if (!canSubmit) return
    setPhase('running')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/personas/${personaId}/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instruction.trim() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error?.message ?? '다듬기 실패')
      setResult(body)
      setPhase('done')
      qc.invalidateQueries({ queryKey: ['persona'] })
      toast.success(`${body.changed_count}개 슬롯이 수정됐습니다`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setErrorMessage(msg)
      setPhase('error')
      toast.error(msg)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="AI에게 다듬기 맡기기">
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {phase === 'form' && (
          <>
            <p className="text-xs text-txt-secondary leading-relaxed mb-4">
              현재 저장된 슬롯 전체를 자연어 지시대로 일괄 수정합니다. AI가 지시와 무관한 슬롯은 건드리지 않습니다.
            </p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-txt-primary mb-2">자주 쓰는 지시</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setInstruction(p.instruction)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-txt-secondary hover:border-brand-border hover:text-txt-primary transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt-primary mb-1.5">
                수정 지시
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={5}
                placeholder='예) 전체적으로 더 격식있게. 감성 표현 줄이고 수치 중심으로.'
                className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 ob-input leading-relaxed resize-none"
              />
              <p className="text-[10px] text-txt-tertiary mt-1">
                {instruction.length}/300자
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
              >
                <PenLine size={14} />
                지시대로 다듬기
              </button>
            </div>
          </>
        )}

        {phase === 'running' && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-txt-primary mb-2">
              <PenLine size={16} className="animate-pulse" />
              AI가 슬롯을 다듬는 중입니다
            </div>
            <p className="text-xs text-txt-tertiary">
              지시에 부합하는 슬롯만 선택적으로 수정됩니다
              <br />
              보통 10~30초 소요됩니다
            </p>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="py-6">
            <p className="text-base font-bold text-txt-primary mb-2 text-center">
              다듬기 완료
            </p>
            <p className="text-xs text-txt-tertiary mb-5 text-center">
              {result.changed_count}개 수정됨 · {result.skipped_count}개 유지됨
            </p>

            {result.changed_fields.length > 0 && (
              <div className="bg-surface-bg rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-txt-secondary mb-2">변경된 슬롯</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.changed_fields.map((f) => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => {
                  setPhase('form')
                  setInstruction('')
                  onClose()
                }}
                className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                확인하러 가기
              </button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="py-8">
            <p className="text-sm text-txt-primary font-semibold mb-2">
              다듬기에 실패했습니다
            </p>
            <p className="text-xs text-txt-tertiary leading-relaxed mb-5">
              {errorMessage ?? '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => setPhase('form')}
                className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-txt-primary hover:bg-surface-bg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
