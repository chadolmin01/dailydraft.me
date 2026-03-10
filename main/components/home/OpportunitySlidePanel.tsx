'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  X, Loader2, Sparkles, Check, Edit3, ArrowLeft, ArrowRight,
  Lightbulb, Search, Users, Code, Palette, FileText, Megaphone,
  Briefcase, Cpu, ShoppingBag, Heart, GraduationCap, Globe, MoreHorizontal,
  AlertCircle, RotateCcw
} from 'lucide-react'

// Types
interface OpportunityDraft {
  title: string
  description: string
  problem: string
  status: string
  roles: string[]
  field: string
  userType: string
  whyJoin: string
  tags: string[]
}

interface OpportunitySlidePanelProps {
  isOpen: boolean
  onClose: () => void
}

type UserType = 'founder' | 'pre-founder' | 'joiner'
type Step = 1 | 2 | 3

// Selection data
const userTypeOptions = [
  { id: 'founder', label: '창업자', desc: '아이디어가 있어요', icon: Lightbulb },
  { id: 'pre-founder', label: '예비 창업자', desc: '아이디어를 탐색 중이에요', icon: Search },
  { id: 'joiner', label: '합류 희망자', desc: '팀에 들어가고 싶어요', icon: Users },
]

const roleOptions = [
  { id: 'developer', label: '개발자', icon: Code },
  { id: 'designer', label: '디자이너', icon: Palette },
  { id: 'pm', label: '기획자', icon: FileText },
  { id: 'marketer', label: '마케터', icon: Megaphone },
  { id: 'business', label: '비즈니스', icon: Briefcase },
]

const fieldOptions = [
  { id: 'ai-tech', label: 'AI·테크', icon: Cpu },
  { id: 'commerce', label: '커머스', icon: ShoppingBag },
  { id: 'healthcare', label: '헬스케어', icon: Heart },
  { id: 'edutech', label: '에듀테크', icon: GraduationCap },
  { id: 'social-impact', label: '소셜임팩트', icon: Globe },
  { id: 'other', label: '기타', icon: MoreHorizontal },
]

const STORAGE_KEY = 'draft-opportunity-progress'

interface SavedProgress {
  step: Step
  userType: UserType | null
  selectedRoles: string[]
  selectedField: string | null
  projectDesc: string
  draft: OpportunityDraft | null
  savedAt: number
}

export const OpportunitySlidePanel: React.FC<OpportunitySlidePanelProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  // State
  const [step, setStep] = useState<Step>(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [projectDesc, setProjectDesc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [draft, setDraft] = useState<OpportunityDraft | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDraft, setEditedDraft] = useState<OpportunityDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)

  // Load saved progress when panel opens
  useEffect(() => {
    if (isOpen && !hasRestoredProgress) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const progress: SavedProgress = JSON.parse(saved)
          const isRecent = Date.now() - progress.savedAt < 24 * 60 * 60 * 1000
          if (isRecent) {
            setStep(progress.step)
            setUserType(progress.userType)
            setSelectedRoles(progress.selectedRoles)
            setSelectedField(progress.selectedField)
            setProjectDesc(progress.projectDesc)
            if (progress.draft) {
              setDraft(progress.draft)
              setEditedDraft(progress.draft)
            }
          }
        }
      } catch {
        // ignore
      }
      setHasRestoredProgress(true)
    }
  }, [isOpen, hasRestoredProgress])

  // Save progress
  useEffect(() => {
    if (!isOpen) return
    const progress: SavedProgress = {
      step,
      userType,
      selectedRoles,
      selectedField,
      projectDesc,
      draft,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // ignore
    }
  }, [isOpen, step, userType, selectedRoles, selectedField, projectDesc, draft])

  // Reset restore flag when panel closes
  useEffect(() => {
    if (!isOpen) setHasRestoredProgress(false)
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Focus trap + ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    // Auto focus
    setTimeout(() => firstFocusableRef.current?.focus(), 100)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleStartFresh = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setStep(1)
    setUserType(null)
    setSelectedRoles([])
    setSelectedField(null)
    setProjectDesc('')
    setDraft(null)
    setIsEditing(false)
    setEditedDraft(null)
    setError(null)
  }

  const hasProgress = step !== 1 || userType !== null

  // Swipe to close (mobile)
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      handleClose()
    }
  }

  // Step handlers
  const handleStep1Next = () => {
    if (userType && selectedRoles.length > 0) setStep(2)
  }

  const handleProjectSubmit = async () => {
    if (!projectDesc.trim() || !selectedField) return
    setStep(3)
    setIsGenerating(true)
    setError(null)

    try {
      const roleLabels = selectedRoles.map(r => roleOptions.find(o => o.id === r)?.label || r)
      const fieldLabel = fieldOptions.find(f => f.id === selectedField)?.label || selectedField
      const userTypeLabel = userTypeOptions.find(u => u.id === userType)?.label || userType || ''

      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userTypeLabel,
          neededRoles: roleLabels,
          field: fieldLabel,
          description: projectDesc.trim(),
        }),
      })

      if (!response.ok) throw new Error('AI 생성에 실패했습니다')

      const result = await response.json()
      const generated = result.data

      const newDraft: OpportunityDraft = {
        title: generated.title || projectDesc.slice(0, 30),
        description: projectDesc,
        problem: generated.problem || '',
        status: generated.status || '아이디어 단계',
        roles: generated.neededRoles || roleLabels,
        field: fieldLabel || '',
        userType: userTypeLabel,
        whyJoin: generated.whyJoin || '',
        tags: generated.tags || [],
      }
      setDraft(newDraft)
      setEditedDraft(newDraft)
    } catch {
      // Fallback
      const roleLabels = selectedRoles.map(r => roleOptions.find(o => o.id === r)?.label || r)
      const fieldLabel = fieldOptions.find(f => f.id === selectedField)?.label || ''
      const userTypeLabel = userTypeOptions.find(u => u.id === userType)?.label || ''
      const fallback: OpportunityDraft = {
        title: projectDesc.slice(0, 30) + (projectDesc.length > 30 ? '...' : ''),
        description: projectDesc,
        problem: '',
        status: '아이디어 단계',
        roles: roleLabels,
        field: fieldLabel,
        userType: userTypeLabel,
        whyJoin: '',
        tags: [],
      }
      setDraft(fallback)
      setEditedDraft(fallback)
      setError('AI 생성에 실패하여 기본 템플릿으로 작성되었습니다. 수정하여 사용하세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetryGenerate = () => {
    setError(null)
    setDraft(null)
    setStep(2)
  }

  const handleSaveEdit = () => {
    if (editedDraft) setDraft(editedDraft)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedDraft(draft)
    setIsEditing(false)
  }

  // 공고 등록 → 로그인 후 대시보드로
  const handlePublish = () => {
    if (draft) {
      // draft를 localStorage에 저장하고 로그인으로 이동
      localStorage.setItem('draft-pending-opportunity', JSON.stringify(draft))
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
    handleClose()
    router.push('/login?redirect=/projects/new')
  }

  const goBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3 && !isGenerating) setStep(2)
  }

  const progress = (step / 3) * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="AI 팀빌딩 - 공고 만들기"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[540px] bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button
                  ref={firstFocusableRef}
                  onClick={step === 1 ? handleClose : goBack}
                  className="p-2 hover:bg-gray-100 transition-colors -ml-2"
                  aria-label={step === 1 ? '닫기' : '이전 단계'}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">AI 팀빌딩</h2>
                  <p className="text-xs text-gray-500">30초 만에 공고 만들기</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasProgress && (
                  <button
                    onClick={handleStartFresh}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-gray-100 transition-colors"
                  >
                    새로 시작
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="패널 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait">
                {/* Step 1: User Type + Roles */}
                {step === 1 && (
                  <StepContainer key="step1">
                    <div className="mb-10">
                      <StepHeader
                        title="나는 ___입니다"
                        subtitle="어떤 상황에서 팀을 찾고 계신가요?"
                      />
                      <div className="space-y-3">
                        {userTypeOptions.map((option) => (
                          <SelectionCard
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            desc={option.desc}
                            selected={userType === option.id}
                            onClick={() => setUserType(option.id as UserType)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <StepHeader
                        title={userType === 'joiner' ? '어떤 역할로 합류하고 싶으세요?' : '함께할 사람을 찾고 있어요'}
                        subtitle={userType === 'joiner' ? '본인의 역할을 선택해주세요' : '복수 선택 가능해요'}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {roleOptions.map((option) => (
                          <SelectionCard
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            selected={selectedRoles.includes(option.id)}
                            onClick={() =>
                              setSelectedRoles(prev =>
                                prev.includes(option.id)
                                  ? prev.filter(r => r !== option.id)
                                  : [...prev, option.id]
                              )
                            }
                            multiSelect
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleStep1Next}
                      disabled={!userType || selectedRoles.length === 0}
                      className="w-full py-4 bg-black text-white font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                    >
                      다음 <ArrowRight className="w-4 h-4" />
                    </button>
                  </StepContainer>
                )}

                {/* Step 2: Field + Description */}
                {step === 2 && (
                  <StepContainer key="step2">
                    <div className="mb-10">
                      <StepHeader
                        title="관심 분야"
                        subtitle="프로젝트가 속한 분야를 선택해주세요"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {fieldOptions.map((option) => (
                          <SelectionCard
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            selected={selectedField === option.id}
                            onClick={() => setSelectedField(option.id)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <StepHeader
                        title="프로젝트를 한 줄로 설명해주세요"
                        subtitle="AI가 이 설명을 바탕으로 공고를 작성해요"
                      />
                      <textarea
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        placeholder="예: 시각장애인을 위한 음성 기반 금융 앱"
                        className="w-full h-28 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-base resize-none"
                        aria-label="프로젝트 설명"
                      />
                      <p className="text-xs text-gray-400 mt-2">{projectDesc.length}/200자</p>
                    </div>

                    <button
                      onClick={handleProjectSubmit}
                      disabled={!selectedField || !projectDesc.trim()}
                      className="w-full py-4 bg-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI로 공고 만들기
                    </button>
                  </StepContainer>
                )}

                {/* Step 3: Result */}
                {step === 3 && (
                  <StepContainer key="step3">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-blue-50 flex items-center justify-center mb-6">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">AI가 공고를 작성하고 있어요...</p>
                        <div className="space-y-2 text-sm text-gray-400 text-center">
                          <p className="animate-pulse">프로젝트 분석 중</p>
                        </div>
                      </div>
                    ) : draft && !isEditing ? (
                      <div className="space-y-6">
                        {/* Error Banner */}
                        {error && (
                          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 p-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-amber-800">{error}</p>
                              <button
                                onClick={handleRetryGenerate}
                                className="text-sm text-amber-700 font-medium mt-1 flex items-center gap-1 hover:underline"
                              >
                                <RotateCcw className="w-3 h-3" /> 다시 생성하기
                              </button>
                            </div>
                          </div>
                        )}

                        {!error && (
                          <div className="flex items-center gap-2 text-green-600 mb-4">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">공고가 완성됐어요!</span>
                          </div>
                        )}

                        {/* Draft Card */}
                        <div className="bg-white border border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                          <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{draft.title}</h3>
                            {draft.problem && (
                              <p className="text-gray-600 leading-relaxed mb-2">{draft.problem}</p>
                            )}
                            {draft.whyJoin && (
                              <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 mt-3">
                                {draft.whyJoin}
                              </p>
                            )}
                          </div>
                          <div className="p-6 space-y-4">
                            {draft.status && (
                              <div>
                                <p className="text-xs text-gray-500 font-mono uppercase mb-2">진행 상태</p>
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium">
                                  {draft.status}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 font-mono uppercase mb-2">찾는 역할</p>
                              <div className="flex flex-wrap gap-2">
                                {draft.roles.map((role, i) => (
                                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono uppercase mb-2">분야</p>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm">
                                {draft.field}
                              </span>
                            </div>
                            {draft.tags.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 font-mono uppercase mb-2">태그</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {draft.tags.map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="px-6 pb-6">
                            <button
                              onClick={() => { setIsEditing(true); setEditedDraft(draft) }}
                              className="w-full py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              수정하기
                            </button>
                          </div>
                        </div>

                        {/* Publish CTA */}
                        <button
                          onClick={handlePublish}
                          className="w-full py-4 bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                        >
                          로그인하고 공고 게시하기
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-center text-xs text-gray-400">
                          로그인 후 Explore에 바로 등록됩니다
                        </p>
                      </div>
                    ) : draft && isEditing && editedDraft ? (
                      <div className="space-y-6">
                        <p className="font-medium text-gray-900">공고 수정</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
                            <input
                              type="text"
                              value={editedDraft.title}
                              onChange={(e) => setEditedDraft({ ...editedDraft, title: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">해결하려는 문제</label>
                            <textarea
                              value={editedDraft.problem}
                              onChange={(e) => setEditedDraft({ ...editedDraft, problem: e.target.value })}
                              className="w-full h-24 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">함께하면 좋은 이유</label>
                            <textarea
                              value={editedDraft.whyJoin}
                              onChange={(e) => setEditedDraft({ ...editedDraft, whyJoin: e.target.value })}
                              className="w-full h-20 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </StepContainer>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Helper Components
const StepContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
    className="p-6"
  >
    {children}
  </motion.div>
)

const StepHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
    {subtitle && <p className="text-gray-500">{subtitle}</p>}
  </div>
)

interface SelectionCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  desc?: string
  selected: boolean
  onClick: () => void
  multiSelect?: boolean
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  icon: Icon,
  label,
  desc,
  selected,
  onClick,
  multiSelect = false,
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`
      w-full text-left border-2 transition-all p-4
      ${selected
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300 bg-white'
      }
    `}
  >
    <div className="flex items-start gap-4">
      <div className={`
        flex items-center justify-center shrink-0 w-10 h-10
        ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
      `}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{label}</p>
        {desc && <p className="text-sm text-gray-500 mt-1">{desc}</p>}
      </div>
      {multiSelect && (
        <div className={`
          w-5 h-5 border-2 flex items-center justify-center shrink-0
          ${selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}
        `}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}
    </div>
  </button>
)
