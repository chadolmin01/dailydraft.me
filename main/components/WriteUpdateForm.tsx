'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useCreateProjectUpdate, useProjectUpdates, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { getProjectWeekNumber } from '@/src/lib/ghostwriter/week-utils'

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
  const { data: existingUpdates } = useProjectUpdates(opportunityId)

  // 주차 계산을 getProjectWeekNumber()로 통일 (Ghostwriter와 동일 공식)
  const currentWeek = createdAt
    ? getProjectWeekNumber(new Date(createdAt))
    : 1

  // 이번 주차에 이미 업데이트가 있는지 확인
  const alreadySubmitted = existingUpdates?.some(
    (u) => u.week_number === currentWeek
  ) ?? false

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>('general')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    setError('')

    try {
      await createUpdate.mutateAsync({
        opportunity_id: opportunityId,
        week_number: currentWeek,
        title: title.trim(),
        content: content.trim(),
        update_type: updateType,
      })
      setTitle('')
      setContent('')
      setUpdateType('general')
      toast.success(
        currentWeek === 1
          ? '첫 번째 업데이트! 좋은 시작입니다'
          : `Week ${currentWeek} 완료! 꾸준한 기록이 쌓이고 있습니다`
      )
      onClose()
    } catch {
      setError('업데이트 작성에 실패했습니다.')
      toast.error('업데이트 작성에 실패했습니다')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="주간 업데이트 작성" size="md">
      <div className="px-6 py-5 space-y-5">
        {/* 이미 제출된 주차면 안내 메시지 표시 */}
        {alreadySubmitted && (
          <div className="px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-xl">
            <p className="text-sm text-txt-secondary">
              {currentWeek}주차 업데이트가 이미 제출되었습니다. 기존 업데이트를 편집해주세요.
            </p>
          </div>
        )}

        {/* Week + Type */}
        <div className="flex gap-3">
          <div className="w-24">
            <label className="block text-[12px] font-medium text-txt-tertiary mb-1.5">Week</label>
            <input
              type="number"
              value={currentWeek}
              readOnly
              className="w-full px-3 py-2.5 bg-[#F0F1F3] dark:bg-[#1A1A1C] text-base sm:text-sm rounded-xl text-txt-secondary cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-txt-tertiary mb-1.5">유형</label>
            <div className="flex flex-wrap gap-1.5">
              {UPDATE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setUpdateType(t.value)}
                  className={`px-3.5 py-2 text-[13px] font-medium rounded-xl transition-colors ${
                    updateType === t.value
                      ? 'bg-[#5E6AD2] text-white'
                      : 'bg-[#F7F8F9] dark:bg-[#1C1C1E] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527]'
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
          <label className="block text-[12px] font-medium text-txt-tertiary mb-1.5">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이번 주의 가장 큰 진전은?"
            maxLength={100}
            className="w-full px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 rounded-xl text-txt-primary placeholder-txt-disabled"
          />
          <div className="text-[11px] text-txt-disabled text-right mt-1">
            {title.length}/100
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-[12px] font-medium text-txt-tertiary mb-1.5">내용</label>
          <p className="text-[11px] text-txt-disabled mb-2">구체적인 숫자나 결과물이 있으면 더 좋아요</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"이번 주 성과:\n\n다음 주 계획:\n\n배운 점 또는 고민 (선택):"}
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 resize-none rounded-xl text-txt-primary placeholder-txt-disabled"
          />
          <div className="text-[11px] text-txt-disabled text-right mt-1">
            {content.length}/2000
          </div>
        </div>

        {error && <p className="text-xs text-[#FF3B30]">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={createUpdate.isPending || alreadySubmitted}
          className="w-full py-3.5 bg-[#5E6AD2] text-white text-[15px] font-semibold rounded-2xl hover:bg-[#4B4FB8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.97]"
        >
          {createUpdate.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
          ) : alreadySubmitted ? (
            `${currentWeek}주차 업데이트 완료`
          ) : (
            '업데이트 등록'
          )}
        </button>
      </div>
    </Modal>
  )
}
