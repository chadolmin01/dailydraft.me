'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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

interface WriteUpdateFormProps {
  opportunityId: string
  createdAt: string | null
  isOpen: boolean
  onClose: () => void
}

export const WriteUpdateForm: React.FC<WriteUpdateFormProps> = ({
  opportunityId,
  createdAt,
  isOpen,
  onClose,
}) => {
  const createUpdate = useCreateProjectUpdate()

  // Auto-calculate week number from project creation date
  const autoWeek = createdAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1

  const [weekNumber, setWeekNumber] = useState(autoWeek)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>('general')
  const [error, setError] = useState('')

  // Reset week number when modal reopens (autoWeek may change over time)
  useEffect(() => {
    if (isOpen) setWeekNumber(autoWeek)
  }, [isOpen, autoWeek])

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    setError('')

    try {
      await createUpdate.mutateAsync({
        opportunity_id: opportunityId,
        week_number: weekNumber,
        title: title.trim(),
        content: content.trim(),
        update_type: updateType,
      })
      setTitle('')
      setContent('')
      setUpdateType('general')
      toast.success('업데이트가 작성되었습니다')
      onClose()
    } catch {
      setError('업데이트 작성에 실패했습니다.')
      toast.error('업데이트 작성에 실패했습니다')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="주간 업데이트 작성" size="md">
      <div className="px-6 py-5 space-y-4">
        {/* Week + Type */}
        <div className="flex gap-3">
          <div className="w-24">
            <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1">Week</label>
            <input
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-border-strong text-sm focus:outline-none focus:border-border-strong bg-surface-card text-txt-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1">유형</label>
            <div className="flex flex-wrap gap-1.5">
              {UPDATE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setUpdateType(t.value)}
                  className={`px-3 py-1.5 text-xs border-2 transition-colors ${
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
        </div>

        {/* Title */}
        <div>
          <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이번 주에 무엇을 했나요?"
            maxLength={100}
            className="w-full px-3 py-2 border-2 border-border-strong text-sm focus:outline-none focus:border-border-strong bg-surface-card text-txt-primary placeholder-txt-disabled"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="진행 상황, 배운 점, 다음 계획 등을 자유롭게 적어주세요"
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border-2 border-border-strong text-sm focus:outline-none focus:border-border-strong resize-none bg-surface-card text-txt-primary placeholder-txt-disabled"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={createUpdate.isPending}
          className="w-full py-2.5 bg-black text-white text-sm font-bold border-2 border-black hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          {createUpdate.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
          ) : (
            '업데이트 등록'
          )}
        </button>
      </div>
    </Modal>
  )
}
