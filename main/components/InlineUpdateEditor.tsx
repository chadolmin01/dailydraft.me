'use client'

import React, { useState } from 'react'
import { Loader2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'

function detectUpdateType(content: string): ProjectUpdate['update_type'] {
  const lower = content.toLowerCase()
  if (/배포|런칭|출시|오픈|launch|deploy/.test(lower)) return 'launch'
  if (/개발|구현|코딩|api|기능|버그|fix|build/.test(lower)) return 'development'
  if (/디자인|ui|ux|화면|설계|와이어|프로토/.test(lower)) return 'design'
  if (/아이디어|고민|기획|방향|전략|피벗/.test(lower)) return 'ideation'
  return 'general'
}

const PLACEHOLDERS = [
  '이번 주에는 어떤 진전이 있었나요?',
  '팀원들에게 이번 주 성과를 공유해보세요.',
]

interface InlineUpdateEditorProps {
  opportunityId: string
  nextWeekNumber: number
  onOpenDetail: () => void
}

export const InlineUpdateEditor: React.FC<InlineUpdateEditorProps> = ({
  opportunityId,
  nextWeekNumber,
  onOpenDetail,
}) => {
  const createUpdate = useCreateProjectUpdate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')

  const placeholder = PLACEHOLDERS[nextWeekNumber % PLACEHOLDERS.length]

  const handleCancel = () => {
    setIsExpanded(false)
    setContent('')
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    try {
      await createUpdate.mutateAsync({
        opportunity_id: opportunityId,
        week_number: nextWeekNumber,
        title: `Week ${nextWeekNumber} 업데이트`,
        content: content.trim(),
        update_type: detectUpdateType(content),
      })
      setContent('')
      setIsExpanded(false)
      toast.success(`Week ${nextWeekNumber} 기록 완료!`)
    } catch {
      toast.error('업데이트 작성에 실패했습니다')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="mb-6">
      <div className={`border bg-surface-card transition-all duration-200 ${
        isExpanded ? 'border-border-strong shadow-solid-sm' : 'border-border'
      }`}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={isExpanded ? 4 : 2}
          maxLength={2000}
          className="w-full px-4 py-3 text-sm resize-none bg-transparent focus:outline-none text-txt-primary placeholder-txt-disabled"
        />

        {isExpanded && (
          <div className="px-4 pb-3 border-t border-border flex items-center justify-between gap-3">
            <span className="text-[0.5rem] font-mono text-txt-disabled pt-2.5">유형 자동 분류</span>

            <div className="flex items-center gap-2 shrink-0 pt-2.5">
              <button
                type="button"
                onClick={onOpenDetail}
                title="상세 작성"
                className="p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs text-txt-secondary border border-border-strong hover:text-txt-primary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={createUpdate.isPending || !content.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-black text-white border border-black hover:bg-[#333] transition-colors disabled:opacity-40 shadow-solid-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                {createUpdate.isPending
                  ? <><Loader2 size={12} className="animate-spin" /> 저장 중</>
                  : '제출'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
