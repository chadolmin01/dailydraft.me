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
      toast.success(
        weekNumber === 1
          ? '첫 번째 업데이트! 좋은 시작이에요 🎉'
          : `Week ${weekNumber} 완료! 꾸준한 기록이 쌓이고 있어요`
      )
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
            <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1">Week</label>
            <input
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border bg-surface-card rounded-lg text-txt-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1">유형</label>
            <div className="flex flex-wrap gap-1.5">
              {UPDATE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setUpdateType(t.value)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    updateType === t.value
                      ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border'
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
          <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이번 주의 가장 큰 진전은?"
            maxLength={100}
            className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border bg-surface-card rounded-lg text-txt-primary placeholder-txt-disabled"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1">내용</label>
          <p className="text-[0.625rem] text-txt-disabled mb-1.5">팁: 구체적인 숫자나 결과물이 있으면 더 좋아요</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"이번 주 성과:\n\n다음 주 계획:\n\n배운 점 또는 고민 (선택):"}
            rows={6}
            maxLength={2000}
            className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border resize-none bg-surface-card rounded-lg text-txt-primary placeholder-txt-disabled"
          />
        </div>

        {error && <p className="text-xs text-status-danger-text">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={createUpdate.isPending}
          className="w-full py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse hover:bg-surface-inverse/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97]"
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
