'use client'

import React, { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useCreateProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'

const UPDATE_TYPES: { value: ProjectUpdate['update_type']; label: string }[] = [
  { value: 'ideation', label: '고민' },
  { value: 'design', label: '설계' },
  { value: 'development', label: '구현' },
  { value: 'launch', label: '런칭' },
  { value: 'general', label: '일반' },
]

interface QuickUpdateFormProps {
  opportunityId: string
  nextWeekNumber: number
  isOpen: boolean
  onClose: () => void
}

export const QuickUpdateForm: React.FC<QuickUpdateFormProps> = ({
  opportunityId,
  nextWeekNumber,
  isOpen,
  onClose,
}) => {
  const createUpdate = useCreateProjectUpdate()
  const [content, setContent] = useState('')
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>('general')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    setError('')

    try {
      await createUpdate.mutateAsync({
        opportunity_id: opportunityId,
        week_number: nextWeekNumber,
        title: `Week ${nextWeekNumber} 업데이트`,
        content: content.trim(),
        update_type: updateType,
      })
      setContent('')
      setUpdateType('general')
      toast.success(`Week ${nextWeekNumber} 기록 완료!`)
      onClose()
    } catch {
      setError('업데이트 작성에 실패했습니다.')
      toast.error('업데이트 작성에 실패했습니다')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="빠른 기록" size="md">
      <div className="px-6 py-5 space-y-4">
        {/* Week badge */}
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-txt-disabled" />
          <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
            Week {nextWeekNumber} 자동 기록
          </span>
        </div>

        {/* Type (optional) */}
        <div>
          <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1.5">
            유형 <span className="normal-case font-normal text-txt-disabled">(선택)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {UPDATE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setUpdateType(t.value)}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  updateType === t.value
                    ? 'bg-black text-white border-black'
                    : 'bg-surface-card text-txt-secondary border-border-strong hover:border-border-strong'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"이번 주 성과:\n\n다음 주 계획:"}
            rows={5}
            maxLength={2000}
            autoFocus
            className="w-full px-3 py-2 border border-border-strong text-sm focus:outline-none focus:border-border-strong resize-none bg-surface-card text-txt-primary placeholder-txt-disabled"
          />
        </div>

        {error && <p className="text-xs text-status-danger-text">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={createUpdate.isPending}
          className="w-full py-2.5 bg-black text-white text-sm font-bold border border-black hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          {createUpdate.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
          ) : (
            `Week ${nextWeekNumber} 기록하기`
          )}
        </button>
      </div>
    </Modal>
  )
}
