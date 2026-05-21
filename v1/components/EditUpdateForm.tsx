'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useUpdateProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'

const UPDATE_TYPES: { value: ProjectUpdate['update_type']; label: string }[] = [
  { value: 'ideation', label: '고민' },
  { value: 'design', label: '설계' },
  { value: 'development', label: '구현' },
  { value: 'launch', label: '런칭' },
  { value: 'general', label: '일반' },
]

interface EditUpdateFormProps {
  update: ProjectUpdate
  opportunityId: string
  isOpen: boolean
  onClose: () => void
}

export const EditUpdateForm: React.FC<EditUpdateFormProps> = ({
  update,
  opportunityId,
  isOpen,
  onClose,
}) => {
  const updateMutation = useUpdateProjectUpdate()

  const [weekNumber, setWeekNumber] = useState(update.week_number)
  const [title, setTitle] = useState(update.title)
  const [content, setContent] = useState(update.content)
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>(update.update_type)
  const [error, setError] = useState('')

  // 모달 열릴 때마다 원본 값으로 리셋
  useEffect(() => {
    if (isOpen) {
      setWeekNumber(update.week_number)
      setTitle(update.title)
      setContent(update.content)
      setUpdateType(update.update_type)
      setError('')
    }
  }, [isOpen, update])

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    setError('')

    try {
      await updateMutation.mutateAsync({
        id: update.id,
        opportunity_id: opportunityId,
        title: title.trim(),
        content: content.trim(),
        update_type: updateType,
        week_number: weekNumber,
      })
      toast.success('업데이트가 수정됐습니다')
      onClose()
    } catch {
      setError('수정에 실패했습니다.')
      toast.error('수정에 실패했습니다')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="업데이트 수정" size="md">
      <div className="px-6 py-5 space-y-4">
        {/* Week + Type */}
        <div className="flex gap-3">
          <div className="w-24">
            <label className="block text-[10px] font-medium text-txt-tertiary mb-1">Week</label>
            <input
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border bg-surface-card rounded-xl text-txt-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-txt-tertiary mb-1">유형</label>
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
          <label className="block text-[10px] font-medium text-txt-tertiary mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            aria-label="업데이트 제목 (수정)"
            className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border bg-surface-card rounded-xl text-txt-primary"
          />
          <div className="text-[10px] text-txt-tertiary font-mono text-right mt-1">
            {title.length}/100
          </div>
          <p className="text-[10px] text-txt-disabled mt-1">
            수정하신 내용은 기존 주간 업데이트에 덮어씌워집니다. 과거 버전은 복구되지 않습니다.
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-[10px] font-medium text-txt-tertiary mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={2000}
            aria-label="업데이트 내용 (수정)"
            className="w-full px-3 py-2 border border-border text-base sm:text-sm focus:outline-none focus:border-border resize-none bg-surface-card rounded-xl text-txt-primary"
          />
          <div className="text-[10px] text-txt-tertiary font-mono text-right mt-1">
            {content.length}/2000
          </div>
        </div>

        {error && <p className="text-xs text-status-danger-text">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="w-full py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse hover:bg-surface-inverse/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97]"
        >
          {updateMutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
          ) : (
            '수정 완료'
          )}
        </button>
      </div>
    </Modal>
  )
}
