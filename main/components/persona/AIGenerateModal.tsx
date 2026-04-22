'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  personaId: string
  isOpen: boolean
  onClose: () => void
}

type Phase = 'form' | 'running' | 'done' | 'error'

/**
 * "AI에게 초안 받기" 모달.
 * 회장이 3개 질문에 답하면 Gemini가 13슬롯 초안을 일괄 생성.
 * Discord corpus 없어도 동작 → 신규 기수/연결 전 회장도 바로 시작 가능.
 */
export function AIGenerateModal({ personaId, isOpen, onClose }: Props) {
  const qc = useQueryClient()
  const [phase, setPhase] = useState<Phase>('form')
  const [identity, setIdentity] = useState('')
  const [audience, setAudience] = useState('')
  const [taboos, setTaboos] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)

  const reset = () => {
    setPhase('form')
    setErrorMessage(null)
    setSuccessCount(0)
  }

  const handleClose = () => {
    onClose()
    // 닫힐 때 form 상태 보존. 다시 열면 직전 입력값 그대로 (재시도 편의)
  }

  const canSubmit = identity.trim().length >= 5 && audience.trim().length >= 5 && taboos.trim().length >= 3

  const submitManual = async () => {
    if (!canSubmit) return
    await runGenerate({
      mode: 'manual',
      identity_seed: identity.trim(),
      audience_seed: audience.trim(),
      taboos_seed: taboos.trim(),
    })
  }

  const submitAuto = async () => {
    await runGenerate({ mode: 'auto' })
  }

  const runGenerate = async (payload: Record<string, unknown>) => {
    setPhase('running')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/personas/${personaId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error?.message ?? '생성 실패')
      }
      setSuccessCount(body.success_count ?? 0)
      setPhase('done')
      qc.invalidateQueries({ queryKey: ['persona'] })
      toast.success(`${body.success_count}/${body.total_count}개 슬롯이 생성됐습니다`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setErrorMessage(msg)
      setPhase('error')
      toast.error(msg)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="AI에게 초안 받기">
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {(phase === 'form' || phase === 'running') && (
          <>
            {/* 원버튼 추천 섹션 */}
            <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center">
                  {phase === 'running' ? (
                    <Loader2 size={16} className="text-brand animate-spin" />
                  ) : (
                    <Sparkles size={16} className="text-brand" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-txt-primary mb-0.5">
                    {phase === 'running'
                      ? 'AI가 초안을 작성 중입니다'
                      : '바로 추천 초안 받기'}
                  </h3>
                  <p className="text-xs text-txt-tertiary leading-relaxed mb-3">
                    {phase === 'running'
                      ? '보통 10~30초 소요됩니다. 완료되면 13개 슬롯이 자동으로 채워집니다.'
                      : '클럽 이름·설명·카테고리로 AI가 씨앗을 먼저 추정한 뒤 13슬롯 초안을 만들어드립니다. 답변 없이 바로 확인하실 수 있습니다.'}
                  </p>
                  {phase === 'form' && (
                    <button
                      onClick={submitAuto}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
                    >
                      <Sparkles size={12} />
                      추천 초안 받기
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-txt-tertiary uppercase tracking-wider">
                또는 직접 답변
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <p className="text-xs text-txt-secondary leading-relaxed mb-5">
              3개 질문에 직접 답하시면 회장님의 의도가 더 정확히 반영된 초안을 받으실 수 있습니다.
            </p>

            <div className="space-y-4">
              <FieldBlock
                label="1. 이 동아리·조직은 누구이며 무엇을 합니까?"
                placeholder="예) 경희대학교 창업동아리 FLIP 10-1기. 대학생 창업 아이디어 실험과 팀빌딩을 10주간 운영합니다."
                value={identity}
                onChange={setIdentity}
                rows={3}
                loading={phase === 'running'}
                loadingLabel="정체성 생성 중"
              />
              <FieldBlock
                label="2. 누구에게 말을 걸고 싶습니까? (타깃 독자)"
                placeholder="예) 창업에 관심 있는 20대 초반 대학생. 실무 적용 가능한 사례에 민감하고 FOMO를 느끼는 얼리어답터."
                value={audience}
                onChange={setAudience}
                rows={3}
                loading={phase === 'running'}
                loadingLabel="독자 생성 중"
              />
              <FieldBlock
                label="3. 절대 쓰고 싶지 않은 표현이나 톤은?"
                placeholder="예) 홍보성 과장 (세상을 바꿀/압도적인 등). 상투적 인사. 이모지 남발. 영문 대문자 라벨."
                value={taboos}
                onChange={setTaboos}
                rows={3}
                loading={phase === 'running'}
                loadingLabel="금기 생성 중"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <button
                onClick={handleClose}
                disabled={phase === 'running'}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={submitManual}
                disabled={!canSubmit || phase === 'running'}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
              >
                {phase === 'running' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    생성 중
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    초안 만들기
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="py-10 text-center">
            <p className="text-base font-bold text-txt-primary mb-1">
              초안 생성 완료
            </p>
            <p className="text-xs text-txt-tertiary mb-5">
              {successCount}개 슬롯이 자동 채워졌습니다. 페이지에서 확인 후 필요한 슬롯만 다듬으십시오.
            </p>
            <button
              onClick={() => {
                reset()
                handleClose()
              }}
              className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              확인하러 가기
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="py-8">
            <p className="text-sm text-txt-primary font-semibold mb-2">
              생성에 실패했습니다
            </p>
            <p className="text-xs text-txt-tertiary leading-relaxed mb-5">
              {errorMessage ?? '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
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

function FieldBlock({
  label,
  placeholder,
  value,
  onChange,
  rows,
  loading = false,
  loadingLabel,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  rows: number
  loading?: boolean
  loadingLabel?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-txt-primary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={loading}
          className={`w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 ob-input leading-relaxed resize-none ${
            loading ? 'opacity-40' : ''
          }`}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border shadow-sm">
              <Loader2 size={14} className="text-brand animate-spin" />
              <span className="text-xs text-txt-secondary">
                {loadingLabel ?? '생성 중'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
