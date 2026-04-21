'use client'

import React, { useState, useRef } from 'react'
import { Loader2, Maximize2, Paperclip, Sparkles } from 'lucide-react'
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

const TEMPLATES: Array<{ key: string; label: string; body: string }> = [
  {
    key: '주간회고',
    label: '3분할 회고',
    body: `이번 주 이룬 것\n- \n\n블로커·아쉬웠던 점\n- \n\n다음 주 계획\n- `,
  },
  {
    key: '의사결정',
    label: '결정 기록',
    body: `결정 사항\n- \n\n배경·고민했던 옵션\n- \n\n다음 액션\n- `,
  },
  {
    key: '블로커',
    label: '블로커 공유',
    body: `막힌 지점\n- \n\n시도한 것\n- \n\n도움 요청할 부분\n- `,
  },
  {
    key: '런칭',
    label: '런칭/배포',
    body: `배포한 것\n- \n\n릴리즈 노트\n- \n\n모니터링할 지표\n- `,
  },
]

const ACCEPTED_FILES = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  '.ts,.tsx,.js,.jsx,.py,.go,.java,.kt,.swift,.md,.txt,.csv',
].join(',')

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const placeholder = PLACEHOLDERS[nextWeekNumber % PLACEHOLDERS.length]

  const handleInsertTemplate = (body: string) => {
    setIsExpanded(true)
    setContent(body)
    // 다음 tick 에 포커스 + 첫 "- " 뒤로 커서 이동
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      const firstDashIdx = body.indexOf('- ') + 2
      if (firstDashIdx >= 2) {
        ta.setSelectionRange(firstDashIdx, firstDashIdx)
      }
    }, 50)
  }

  const analyzeFile = async (file: File) => {
    setIsExpanded(true)
    setIsAnalyzing(true)
    setContent('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/project-updates/analyze-file', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const { content: generated } = await res.json()
      setContent(generated)
    } catch {
      toast.error('파일 분석에 실패했습니다')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) analyzeFile(file)
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) analyzeFile(file)
    e.target.value = ''
  }

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
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILES}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border bg-surface-card transition-all duration-200 relative ${
          isDragging
            ? 'border-surface-inverse bg-surface-sunken'
            : isExpanded
            ? 'border-border shadow-sm'
            : 'border-border'
        }`}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-xs font-mono font-bold text-txt-secondary">파일을 여기에 놓으세요</span>
          </div>
        )}

        {/* Analyzing state */}
        {isAnalyzing ? (
          <div className="px-4 py-5 flex items-center gap-2 text-sm text-txt-disabled">
            <Loader2 size={14} className="animate-spin" />
            AI가 파일을 분석 중입니다...
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={isExpanded ? 8 : 2}
              maxLength={2000}
              className={`w-full px-4 py-3 text-base sm:text-sm resize-none bg-transparent focus:outline-none text-txt-primary placeholder-txt-disabled transition-opacity ${isDragging ? 'opacity-0' : 'opacity-100'}`}
            />
            {/* 템플릿 칩 — 비어있을 때 노출해 작성 시작 유도 */}
            {!content && (
              <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] text-txt-tertiary mr-1">
                  <Sparkles size={10} />
                  템플릿:
                </span>
                {TEMPLATES.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleInsertTemplate(t.body)}
                    className="text-[11px] font-medium text-txt-secondary bg-surface-sunken hover:bg-brand-bg hover:text-brand px-2 py-1 rounded-full transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Action bar */}
        {isExpanded && !isAnalyzing && (
          <div className="px-4 pb-3 border-t border-border flex items-center justify-between gap-3">
            <span className="text-[0.5rem] font-mono text-txt-disabled pt-2.5">유형 자동 분류</span>

            <div className="flex items-center gap-2 shrink-0 pt-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="파일 분석"
                title="파일 분석"
                className="p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors"
              >
                <Paperclip size={13} />
              </button>
              <button
                type="button"
                onClick={onOpenDetail}
                aria-label="상세 작성"
                title="상세 작성"
                className="p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs text-txt-secondary border border-border hover:text-txt-primary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={createUpdate.isPending || !content.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors disabled:opacity-40 hover:opacity-90 active:scale-[0.97]"
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
