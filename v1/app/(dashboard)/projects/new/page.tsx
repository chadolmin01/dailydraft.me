'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, X, Sparkles, AlertCircle } from 'lucide-react'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { useCreateOpportunity } from '@/src/hooks/useOpportunities'
import { useAutoSaveDraft } from '@/src/hooks/useAutoSaveDraft'
import { TYPE_OPTIONS, CATEGORY_TAGS, CATEGORY_TAG_LABELS, TYPE_THEMES } from './constants'
import { getCroppedImg, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, uploadImagesToSupabase } from './utils'
import { ImageUploadSection } from './components/ImageUploadSection'
import { CropModal } from './components/CropModal'
import { ProjectInfoSidebar } from './components/ProjectInfoSidebar'
import { RolesGrid } from './components/RolesGrid'
import { AnimatedChip } from './components/AnimatedChip'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { DescriptionTemplates } from './components/DescriptionTemplates'

export default function NewProjectPage() {
  return (
    <Suspense>
      <NewProjectContent />
    </Suspense>
  )
}

function NewProjectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('from')
  const clubIdParam = searchParams.get('club')
  const createOpportunity = useCreateOpportunity()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('side_project')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [locationType, setLocationType] = useState('remote')
  const [painPoint, setPainPoint] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [compensationType, setCompensationType] = useState('')
  const [compensationDetails, setCompensationDetails] = useState('')
  const [links, setLinks] = useState<{ label: string; url: string }[]>([])
  const [error, setError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  // Discord 채널 (클럽에서 생성할 때만 사용)
  const [discordChannelId, setDiscordChannelId] = useState('')
  const [discordChannelName, setDiscordChannelName] = useState('')

  // Inline validation
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string; roles?: string }>({})
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const rolesRef = useRef<HTMLDivElement>(null)

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false)

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // Read AI-generated draft from localStorage
  const [aiDraftConsumed, setAiDraftConsumed] = useState(false)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('draft-pending-opportunity')
      if (!saved) return
      const draft = JSON.parse(saved)
      if (draft.title) setTitle(draft.title)
      if (draft.problem || draft.description) setDescription(draft.problem || draft.description)
      if (draft.neededRoles?.length) setSelectedRoles(draft.neededRoles)
      if (draft.tags?.length) setSelectedTags(draft.tags)
      localStorage.removeItem('draft-pending-opportunity')
      setAiDraftConsumed(true)
    } catch { /* ignore parse errors */ }
  }, [])

  // Auto-save draft to localStorage
  const formData = useMemo(() => ({
    title, description, type, selectedRoles, selectedTags,
    locationType, painPoint, timeCommitment, compensationType,
    compensationDetails, links,
  }), [title, description, type, selectedRoles, selectedTags, locationType, painPoint, timeCommitment, compensationType, compensationDetails, links])

  const handleRestore = useCallback((data: typeof formData) => {
    setTitle(data.title)
    setDescription(data.description)
    setType(data.type)
    setSelectedRoles(data.selectedRoles)
    setSelectedTags(data.selectedTags)
    setLocationType(data.locationType)
    setPainPoint(data.painPoint)
    setTimeCommitment(data.timeCommitment)
    setCompensationType(data.compensationType)
    setCompensationDetails(data.compensationDetails)
    setLinks(data.links)
  }, [])

  const { clearDraft } = useAutoSaveDraft(formData, {
    enabled: !aiDraftConsumed,
    onRestore: handleRestore,
  })

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const generateDescription = async () => {
    if (!title.trim()) { setError('먼저 프로젝트 이름을 입력해 주세요. AI 는 이름을 시작점으로 초안을 작성합니다.'); return }
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, type,
          painPoint: painPoint || undefined,
          roles: selectedRoles.length > 0 ? selectedRoles : undefined,
          locationType,
          timeCommitment: timeCommitment || undefined,
          compensationType: compensationType || undefined,
        }),
      })
      if (!res.ok) throw new Error('생성 실패')
      const { description: generated } = await res.json()
      if (generated) setDescription(generated)
    } catch {
      setError('AI 설명 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  // File → data URL 변환 (모바일에서 blob URL이 불안정하므로 data URL 사용)
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const processFiles = useCallback(async (files: File[]) => {
    const remaining = 5 - imageFiles.length
    const toAdd = files.slice(0, remaining)
    if (toAdd.length === 0) return

    const invalid = toAdd.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid.length > 0) {
      setError(`JPG, PNG, WebP, GIF만 업로드 가능합니다 (${invalid.map(f => f.name).join(', ')})`)
      return
    }
    const tooLarge = toAdd.filter(f => f.size > MAX_IMAGE_SIZE)
    if (tooLarge.length > 0) {
      setError(`5MB 이하 파일만 업로드 가능합니다 (${tooLarge.map(f => f.name).join(', ')})`)
      return
    }
    setError('')

    const [first, ...rest] = toAdd
    setCropQueue(rest)
    const dataUrl = await fileToDataUrl(first)
    setCropSrc(dataUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }, [imageFiles.length, fileToDataUrl])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }

  const handleDropFiles = useCallback((files: File[]) => {
    processFiles(files)
  }, [processFiles])

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return
    try {
      const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels)
      const previewUrl = await fileToDataUrl(croppedFile)
      setImageFiles(prev => [...prev, croppedFile])
      setImagePreviews(prev => [...prev, previewUrl])
    } catch { toast.error('이미지 처리에 실패했습니다') }

    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue
      setCropQueue(rest)
      const dataUrl = await fileToDataUrl(next)
      setCropSrc(dataUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } else {
      setCropSrc(null)
      setCropQueue([])
    }
  }

  const handleCropCancel = async () => {
    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue
      setCropQueue(rest)
      const dataUrl = await fileToDataUrl(next)
      setCropSrc(dataUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } else {
      setCropSrc(null)
      setCropQueue([])
    }
  }

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const setAsMain = (idx: number) => {
    if (idx === 0) return
    setImageFiles(prev => [prev[idx], ...prev.filter((_, i) => i !== idx)])
    setImagePreviews(prev => [prev[idx], ...prev.filter((_, i) => i !== idx)])
  }

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []
    setImageUploading(true)
    try {
      return await uploadImagesToSupabase(imageFiles)
    } finally {
      setImageUploading(false)
    }
  }

  const addLink = () => setLinks(prev => [...prev, { label: '', url: '' }])
  const removeLink = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx))
  const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const errors: typeof fieldErrors = {}

    if (!title.trim()) errors.title = '프로젝트 이름을 입력해 주세요'
    else if (title.trim().length < 2) errors.title = '프로젝트 이름은 2자 이상이어야 해요'

    if (!description.trim()) errors.description = '프로젝트 소개를 입력해 주세요'
    else if (description.trim().length < 20) errors.description = '프로젝트 소개는 20자 이상 작성해 주세요 (무엇을·누구와·어떻게)'

    if (selectedRoles.length === 0) errors.roles = '함께할 역할을 최소 1개 선택해 주세요'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // Scroll to first error field
      const firstErrorRef = errors.title ? titleRef : errors.description ? descriptionRef : rolesRef
      firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setFieldErrors({})
    setShowConfirm(true)
  }

  const handleConfirmedSubmit = async () => {
    const projectLinks = links
      .filter(l => l.url.trim())
      .reduce((acc, l) => ({ ...acc, [l.label.trim() || l.url.trim()]: l.url.trim() }), {} as Record<string, string>)

    try {
      let demoImages: string[] = []
      if (imageFiles.length > 0) demoImages = await uploadImages()

      const result = await createOpportunity.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        needed_roles: selectedRoles,
        interest_tags: selectedTags,
        location_type: locationType,
        pain_point: painPoint.trim() || null,
        time_commitment: timeCommitment || null,
        compensation_type: compensationType || null,
        compensation_details: compensationDetails.trim() || null,
        project_links: Object.keys(projectLinks).length > 0 ? projectLinks : null,
        demo_images: demoImages.length > 0 ? demoImages : null,
        status: 'active',
        ...(clubIdParam ? { club_id: clubIdParam } : {}),
      })

      // 프로젝트 생성 후 Discord 채널 매핑 (선택한 경우)
      if (clubIdParam && discordChannelId && result.id) {
        fetch(`/api/clubs/${clubIdParam}/discord-channels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity_id: result.id,
            discord_channel_id: discordChannelId,
            discord_channel_name: discordChannelName,
          }),
        }).catch(() => {}) // 매핑 실패해도 프로젝트 생성은 성공
      }

      clearDraft()
      toast.success('프로젝트가 등록되었습니다! 프로젝트 페이지로 이동합니다')
      router.push(returnTo || `/p/${result.id}`)
    } catch {
      setError('프로젝트 생성에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.')
      toast.error('프로젝트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const theme = TYPE_THEMES[type] || TYPE_THEMES.side_project

  const formProgress = useMemo(() => {
    let score = 0
    if (title.trim().length >= 2) score += 30
    if (description.trim().length >= 20) score += 30
    if (selectedRoles.length > 0) score += 30
    if (selectedTags.length > 0) score += 5
    if (imagePreviews.length > 0) score += 5
    return score
  }, [title, description, selectedRoles, selectedTags, imagePreviews])

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      {/* ─── Sticky Progress Bar ─── */}
      <div className="sticky top-0 z-10 h-1 bg-surface-sunken">
        <div
          className="h-full bg-brand progress-bar-spring"
          style={{ width: `${formProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">

        <form onSubmit={handlePreSubmit} className="bg-surface-card shadow-sm overflow-hidden border border-border-subtle rounded-xl">

          {/* ─── Header ─── */}
          <div className="border-b border-border-subtle px-3 sm:px-5 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>돌아가기</span>
            </button>

            {/* Type selector with sliding background */}
            <div className="flex items-center justify-center flex-1">
              <div className="relative inline-flex items-center gap-0.5 bg-surface-sunken rounded-xl p-0.5">
                {/* Sliding background */}
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-300 ${TYPE_THEMES[type].slidingBg}`}
                  style={{
                    width: `calc((100% - 4px) / ${TYPE_OPTIONS.length})`,
                    left: `calc(${TYPE_OPTIONS.findIndex(o => o.value === type)} * (100% - 4px) / ${TYPE_OPTIONS.length} + 2px)`,
                  }}
                />
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className="relative z-10 flex-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span className={`relative ${type === opt.value ? 'text-txt-inverse' : 'text-txt-tertiary hover:text-txt-secondary'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${theme.status}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.statusDot}`} />
                작성 중
              </span>
            </div>
          </div>

          {/* ─── Error Banner ─── */}
          {error && (
            <div key={error} className="px-4 sm:px-8 pt-3 animate-fade-in error-shake">
              <div className="flex items-center gap-2 px-3 py-2 bg-status-danger-bg border border-status-danger-text/20 rounded-xl text-status-danger-text text-xs">
                <AlertCircle size={13} className="shrink-0" />
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="ml-auto hover:opacity-70">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Image Upload (Hero) ─── */}
          <div className="px-4 sm:px-8 pt-4 sm:pt-5">
            <ImageUploadSection
              imagePreviews={imagePreviews}
              imageFilesLength={imageFiles.length}
              onImageSelect={handleImageSelect}
              onRemoveImage={removeImage}
              onSetAsMain={setAsMain}
              onDropFiles={handleDropFiles}
            />
          </div>

          {/* ─── Title & Tags ─── */}
          <div className="px-4 sm:px-8 pt-5 pb-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: undefined }))
              }}
              onBlur={() => {
                if (!title.trim()) setFieldErrors(prev => ({ ...prev, title: '프로젝트 이름을 입력해 주세요' }))
                else if (title.trim().length < 2) setFieldErrors(prev => ({ ...prev, title: '프로젝트 이름은 2자 이상이어야 합니다' }))
              }}
              placeholder={theme.titlePlaceholder}
              maxLength={100}
              className={`w-full text-2xl font-bold text-txt-primary placeholder:text-txt-disabled border-none outline-none bg-transparent leading-tight break-keep ${fieldErrors.title ? 'ring-1 ring-status-danger-text/30 rounded px-1 -mx-1' : ''}`}
            />
            {fieldErrors.title && <p className="text-status-danger-text text-xs mt-1">{fieldErrors.title}</p>}

            <div className="flex flex-wrap gap-1.5 mt-4">
              {CATEGORY_TAGS.map(slug => (
                <AnimatedChip
                  key={slug}
                  label={CATEGORY_TAG_LABELS[slug] ?? slug}
                  selected={selectedTags.includes(slug)}
                  onToggle={() => toggleTag(slug)}
                  selectedClass={theme.chipOn}
                  unselectedClass="bg-surface-sunken text-txt-secondary border-border-subtle hover:border-border hover:text-txt-primary"
                />
              ))}
            </div>
          </div>

          {/* ─── Mobile-only Roles — 필수 필드를 상단에 배치 ─── */}
          <div className="md:hidden px-4 sm:px-8 pt-4">
            <RolesGrid
              ref={rolesRef}
              theme={theme}
              selectedRoles={selectedRoles}
              onToggleRole={(role) => {
                toggleRole(role)
                if (fieldErrors.roles) setFieldErrors(prev => ({ ...prev, roles: undefined }))
              }}
              rolesLabel={theme.rolesLabel}
              error={fieldErrors.roles}
            />
          </div>

          {/* Divider */}
          <div className="mx-4 sm:mx-8 border-t border-border-subtle mt-4 md:mt-0" />

          {/* ─── Body: 2-Column ─── */}
          <div className="px-4 sm:px-8 py-5 sm:py-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">

              {/* Left (3/5) */}
              <div className="md:col-span-3 space-y-6">

                {/* Description */}
                <section>
                  {/* AI 소개글 생성 CTA */}
                  {(() => {
                    const aiFields = [
                      { label: '프로젝트 이름', filled: !!title.trim() },
                      { label: '모집 역할', filled: selectedRoles.length > 0 },
                      { label: '활동 방식', filled: !!locationType },
                      { label: '해결할 문제', filled: !!painPoint.trim() },
                      { label: '시간 투자', filled: !!timeCommitment },
                      { label: '보상 방식', filled: !!compensationType },
                    ]
                    const filledCount = aiFields.filter(f => f.filled).length
                    const totalCount = aiFields.length
                    const canGenerate = filledCount >= 2 && !!title.trim()
                    const pct = Math.round((filledCount / totalCount) * 100)

                    return (
                      <div className="mb-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#5E6AD2]/10 dark:bg-[#5E6AD2]/20 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles size={18} className="text-[#5E6AD2]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-txt-primary">AI로 소개글 작성</p>
                            <p className="text-[11px] text-txt-tertiary mt-0.5">
                              {canGenerate
                                ? '준비가 되었습니다. 정보를 더 채우실수록 더 정확한 초안이 나옵니다.'
                                : '이름·태그·역할 중 최소 2개 항목을 먼저 채워 주세요.'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[12px] font-bold text-[#5E6AD2]">{filledCount}/{totalCount}</span>
                            <button
                              type="button"
                              onClick={generateDescription}
                              disabled={aiLoading || !canGenerate}
                              className="h-9 px-4 text-[12px] font-semibold bg-[#5E6AD2] text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              {aiLoading ? (
                                <><Loader2 size={13} className="animate-spin" /> 생성 중</>
                              ) : (
                                '생성하기'
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5E6AD2] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Field chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {aiFields.map(f => (
                            <span
                              key={f.label}
                              className={`px-2.5 py-1 text-[11px] rounded-full transition-all ${
                                f.filled
                                  ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] font-medium'
                                  : 'bg-[#E5E5EA] dark:bg-[#3A3A3C] text-txt-disabled'
                              }`}
                            >
                              {f.filled ? '✓ ' : ''}{f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">
                    프로젝트 소개 <span className="text-status-danger-text">*</span>
                  </h3>
                  <DescriptionTemplates
                    hasContent={description.trim().length > 0}
                    onInsert={(body) => {
                      setDescription(body)
                      setTimeout(() => {
                        const ta = descriptionRef.current
                        if (!ta) return
                        ta.focus()
                        const idx = body.indexOf('- ') + 2
                        if (idx >= 2) ta.setSelectionRange(idx, idx)
                      }, 30)
                    }}
                  />
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: undefined }))
                    }}
                    onBlur={() => {
                      if (!description.trim()) setFieldErrors(prev => ({ ...prev, description: '프로젝트 소개를 입력해 주세요' }))
                      else if (description.trim().length < 20) setFieldErrors(prev => ({ ...prev, description: '프로젝트 소개는 20자 이상 작성해 주세요 (무엇을·누구와·어떻게)' }))
                    }}
                    placeholder={theme.descPlaceholder}
                    rows={7}
                    maxLength={500}
                    className={`w-full text-base sm:text-sm text-txt-secondary leading-[1.8] placeholder:text-txt-disabled border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand resize-none bg-transparent transition-all ${fieldErrors.description ? 'border-status-danger-text/30' : 'border-border-subtle'}`}
                  />
                  {fieldErrors.description && <p className="text-status-danger-text text-xs mt-1">{fieldErrors.description}</p>}
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-surface-sunken rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full progress-bar-spring ${
                          description.length >= 450 ? 'bg-status-danger-text' :
                          description.length >= 350 ? 'bg-status-warning-text' :
                          description.length >= 20 ? 'bg-brand' : 'bg-txt-disabled/30'
                        }`}
                        style={{ width: `${Math.min((description.length / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <p className={`text-[10px] font-mono shrink-0 ${description.length >= 450 ? 'text-status-danger-text font-bold' : description.length >= 350 ? 'text-status-warning-text' : 'text-txt-disabled'}`}>{description.length}/500</p>
                  </div>
                </section>

                {/* Pain Point */}
                <section className={`p-4 border border-border-subtle rounded-xl transition-colors ${theme.painBg}`}>
                  <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">
                    {theme.painLabel}
                  </h3>
                  <textarea
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    placeholder={theme.painPlaceholder}
                    rows={3}
                    maxLength={1000}
                    className="w-full text-base sm:text-sm text-txt-secondary leading-relaxed placeholder:text-txt-disabled border-none outline-none bg-transparent resize-none"
                  />
                </section>

                {/* Links */}
                <section>
                  <h3 className="text-[10px] font-medium text-txt-tertiary mb-2">
                    프로젝트 링크
                  </h3>
                  <div className="space-y-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(idx, 'label', e.target.value)}
                          placeholder="예: GitHub, 노션"
                          className="px-3 py-2 border border-border-subtle rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand w-1/3 bg-transparent transition-all"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                          placeholder="https://github.com/..."
                          inputMode="url"
                          className="px-3 py-2 border border-border-subtle rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand flex-1 bg-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
                          className="p-2.5 text-txt-disabled hover:text-status-danger-text transition-colors shrink-0"
                          aria-label="링크 삭제"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addLink}
                      className="flex items-center gap-1.5 text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-medium"
                    >
                      <Plus size={12} /> 링크 추가
                    </button>
                  </div>
                </section>
              </div>

              {/* Right (2/5) */}
              <ProjectInfoSidebar
                theme={theme}
                selectedRoles={selectedRoles}
                locationType={locationType}
                timeCommitment={timeCommitment}
                compensationType={compensationType}
                compensationDetails={compensationDetails}
                onToggleRole={(role) => {
                  toggleRole(role)
                  if (fieldErrors.roles) setFieldErrors(prev => ({ ...prev, roles: undefined }))
                }}
                onSetLocationType={setLocationType}
                onSetTimeCommitment={(v) => setTimeCommitment(prev => prev === v ? '' : v)}
                onSetCompensationType={(v) => setCompensationType(prev => prev === v ? '' : v)}
                onSetCompensationDetails={setCompensationDetails}
                isPending={createOpportunity.isPending}
                imageUploading={imageUploading}
                hideRolesOnMobile
                rolesError={fieldErrors.roles}
                clubId={clubIdParam}
                onDiscordChannelSelect={(chId, chName) => {
                  setDiscordChannelId(chId)
                  setDiscordChannelName(chName)
                }}
              />
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="md:hidden px-4 py-4 bg-surface-card border-t border-border-subtle">
            <button
              type="submit"
              disabled={createOpportunity.isPending || imageUploading}
              className={`group/mob relative w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-[0.97] ${theme.mobileBtn}`}
            >
              <span className="absolute inset-0 -translate-x-full group-hover/mob:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="relative flex items-center gap-2">
                {imageUploading ? (
                  <><Loader2 size={14} className="animate-spin" /> 이미지 업로드 중...</>
                ) : createOpportunity.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
                ) : (
                  '프로젝트 등록하기'
                )}
              </span>
            </button>
          </div>
        </form>

        {/* ─── Crop Modal ─── */}
        {cropSrc && (
          <CropModal
            cropSrc={cropSrc}
            crop={crop}
            zoom={zoom}
            cropQueueLength={cropQueue.length}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onCropConfirm={handleCropConfirm}
            onCropCancel={handleCropCancel}
          />
        )}

        {/* ─── Confirm Modal ─── */}
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmedSubmit}
          title="프로젝트 등록"
          message="프로젝트를 등록하시겠어요? 등록 후 바로 공개됩니다."
          confirmText="등록하기"
          cancelText="취소"
          variant="info"
        />
      </div>
    </div>
  )
}
