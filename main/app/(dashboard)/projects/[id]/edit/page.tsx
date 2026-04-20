'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, X, Sparkles, AlertCircle, Trash2, Save, Check } from 'lucide-react'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { useOpportunity, useUpdateOpportunity, useDeleteOpportunity } from '@/src/hooks/useOpportunities'
import { useAuth } from '@/src/context/AuthContext'
import { TYPE_OPTIONS, CATEGORY_TAGS, CATEGORY_TAG_LABELS, TYPE_THEMES } from '../../new/constants'
import { getCroppedImg, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, uploadImagesToSupabase } from '../../new/utils'
import { ImageUploadSection } from '../../new/components/ImageUploadSection'
import { CropModal } from '../../new/components/CropModal'
import { ProjectInfoSidebar } from '../../new/components/ProjectInfoSidebar'
import { AnimatedChip } from '../../new/components/AnimatedChip'
import { TeamManageSection } from '@/components/project/TeamManageSection'
import { GitHubSettingsPanel } from '@/components/github/GitHubSettingsPanel'
import { useUnsavedChangesWarning } from '@/src/hooks/useUnsavedChangesWarning'

export default function EditProjectPage() {
  return (
    <Suspense>
      <EditProjectContent />
    </Suspense>
  )
}

type Tab = 'info' | 'team' | 'github'

function EditProjectContent() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { data: opportunity, isLoading } = useOpportunity(id)
  const updateOpportunity = useUpdateOpportunity()
  const deleteOpportunity = useDeleteOpportunity()

  // URL의 ?tab=github 등 쿼리 파라미터로 초기 탭 설정 (OAuth 콜백 리다이렉트 대응)
  const initialTab = (['info', 'team', 'github'] as Tab[]).includes(searchParams.get('tab') as Tab)
    ? (searchParams.get('tab') as Tab)
    : 'info'
  const [tab, setTab] = useState<Tab>(initialTab)
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
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  // 편집 중 변경사항 있을 때 창 닫기·새로고침 경고.
  // 초기화 이후 주요 필드가 원본과 다르면 dirty.
  const isDirty =
    initialized &&
    !!opportunity &&
    (
      title !== (opportunity.title || '') ||
      description !== (opportunity.description || '') ||
      type !== (opportunity.type || 'side_project') ||
      selectedRoles.join(',') !== (opportunity.needed_roles || []).join(',') ||
      selectedTags.join(',') !== (opportunity.interest_tags || []).join(',') ||
      imageFiles.length > 0
    )
  useUnsavedChangesWarning(isDirty)

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // Populate form from existing opportunity
  useEffect(() => {
    if (!opportunity || initialized) return
    setTitle(opportunity.title || '')
    setDescription(opportunity.description || '')
    setType(opportunity.type || 'side_project')
    setSelectedRoles((opportunity.needed_roles as string[]) || [])
    setSelectedTags((opportunity.interest_tags as string[]) || [])
    setLocationType(opportunity.location_type || 'remote')
    setPainPoint((opportunity as any).pain_point || '')
    setTimeCommitment(opportunity.time_commitment || '')
    setCompensationType(opportunity.compensation_type || '')
    setCompensationDetails(opportunity.compensation_details || '')

    // Parse project_links
    const rawLinks = opportunity.project_links
    if (rawLinks && typeof rawLinks === 'object' && !Array.isArray(rawLinks)) {
      const entries = Object.entries(rawLinks as Record<string, string>)
      setLinks(entries.map(([label, url]) => ({ label, url })))
    } else if (Array.isArray(rawLinks)) {
      setLinks((rawLinks as any[]).map(l => ({ label: l.label || l.type || '', url: l.url || '' })))
    }

    // Existing images
    if (Array.isArray((opportunity as any).demo_images)) {
      setExistingImages((opportunity as any).demo_images)
      setImagePreviews((opportunity as any).demo_images)
    }

    setInitialized(true)
  }, [opportunity, initialized])

  // Auth guard
  useEffect(() => {
    if (!isLoading && opportunity && user && opportunity.creator_id !== user.id) {
      router.replace(`/p/${id}`)
    }
  }, [isLoading, opportunity, user, id, router])

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
    if (!title.trim()) { setError('먼저 프로젝트 이름을 입력해주세요'); return }
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

  const processFiles = useCallback((files: File[]) => {
    const remaining = 5 - imagePreviews.length
    const toAdd = files.slice(0, remaining)
    if (toAdd.length === 0) return

    const invalid = toAdd.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid.length > 0) {
      setError(`JPG, PNG, WebP, GIF만 업로드 가능합니다`)
      return
    }
    const tooLarge = toAdd.filter(f => f.size > MAX_IMAGE_SIZE)
    if (tooLarge.length > 0) {
      setError(`5MB 이하 파일만 업로드 가능합니다`)
      return
    }
    setError('')

    const [first, ...rest] = toAdd
    setCropQueue(rest)
    const url = URL.createObjectURL(first)
    setCropSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }, [imagePreviews.length])

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
      const previewUrl = URL.createObjectURL(croppedFile)
      setImageFiles(prev => [...prev, croppedFile])
      setImagePreviews(prev => [...prev, previewUrl])
    } catch { /* ignore */ }

    URL.revokeObjectURL(cropSrc)

    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue
      setCropQueue(rest)
      setCropSrc(URL.createObjectURL(next))
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } else {
      setCropSrc(null)
      setCropQueue([])
    }
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue
      setCropQueue(rest)
      setCropSrc(URL.createObjectURL(next))
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } else {
      setCropSrc(null)
      setCropQueue([])
    }
  }

  const removeImage = (idx: number) => {
    const preview = imagePreviews[idx]
    // Check if it's an existing image (URL) or a new blob
    if (existingImages.includes(preview)) {
      setExistingImages(prev => prev.filter(url => url !== preview))
    } else {
      URL.revokeObjectURL(preview)
      // Find corresponding file index (offset by existing images count)
      const fileIdx = idx - existingImages.filter(url => imagePreviews.indexOf(url) < idx).length
      setImageFiles(prev => prev.filter((_, i) => i !== fileIdx))
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const setAsMain = (idx: number) => {
    if (idx === 0) return
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('프로젝트 이름을 입력해주세요'); return }
    if (!description.trim()) { setError('프로젝트 설명을 입력해주세요'); return }
    if (selectedRoles.length === 0) { setError('필요한 역할을 최소 1개 선택해주세요'); return }

    const projectLinks = links
      .filter(l => l.url.trim())
      .reduce((acc, l) => ({ ...acc, [l.label.trim() || l.url.trim()]: l.url.trim() }), {} as Record<string, string>)

    try {
      let newUploadedImages: string[] = []
      if (imageFiles.length > 0) newUploadedImages = await uploadImages()

      // Combine existing images (kept) + newly uploaded
      const keptExisting = imagePreviews.filter(p => existingImages.includes(p))
      const allImages = [...keptExisting, ...newUploadedImages]

      await updateOpportunity.mutateAsync({
        id,
        updates: {
          title: title.trim(),
          description: description.trim(),
          type,
          needed_roles: selectedRoles,
          interest_tags: selectedTags,
          location_type: locationType,
          time_commitment: timeCommitment || null,
          compensation_type: compensationType || null,
          compensation_details: compensationDetails.trim() || null,
          project_links: Object.keys(projectLinks).length > 0 ? projectLinks : null,
          demo_images: allImages.length > 0 ? allImages : null,
        },
      })
      setLastSavedAt(new Date())
      // 새로 업로드한 이미지를 existing으로 전환 (재저장 시 중복 업로드 방지)
      if (newUploadedImages.length > 0) {
        setExistingImages(allImages)
        setImageFiles([])
      }
      toast.success('프로젝트가 수정되었습니다')
    } catch {
      setError('프로젝트 수정에 실패했습니다. 다시 시도해주세요.')
      toast.error('프로젝트 수정에 실패했습니다')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOpportunity.mutateAsync(id)
      toast.success('프로젝트가 삭제되었습니다')
      router.push('/profile')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  if (isLoading || !initialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="space-y-4 w-full max-w-md px-8">
          <div className="h-6 bg-surface-sunken rounded skeleton-shimmer w-1/2" />
          <div className="h-10 bg-surface-sunken rounded skeleton-shimmer w-full" />
          <div className="h-24 bg-surface-sunken rounded skeleton-shimmer w-full" />
          <div className="h-10 bg-surface-sunken rounded skeleton-shimmer w-full" />
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <p className="text-txt-tertiary text-sm">프로젝트를 찾을 수 없습니다</p>
      </div>
    )
  }

  const theme = TYPE_THEMES[type] || TYPE_THEMES.side_project

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">

        {/* ─── Tab Bar ─── */}
        <div className="bg-surface-card rounded-t-xl border border-border-subtle border-b-0 shadow-sm">
          <div className="px-3 sm:px-5 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>돌아가기</span>
            </button>

            <div className="flex items-center justify-center flex-1">
              <div className="inline-flex items-center gap-0.5 bg-surface-sunken rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setTab('info')}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    tab === 'info'
                      ? 'bg-surface-inverse text-txt-inverse'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  정보
                </button>
                <button
                  type="button"
                  onClick={() => setTab('team')}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    tab === 'team'
                      ? 'bg-surface-inverse text-txt-inverse'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  팀
                </button>
                <button
                  type="button"
                  onClick={() => setTab('github')}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    tab === 'github'
                      ? 'bg-surface-inverse text-txt-inverse'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  GitHub
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lastSavedAt && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono rounded-full text-status-success-text bg-status-success-bg border border-status-success-text/20">
                  <Check size={9} />
                  {lastSavedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 저장됨
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${theme.status}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.statusDot}`} />
                수정 중
              </span>
            </div>
          </div>
        </div>

        {/* ─── Tab: Info ─── */}
        {tab === 'info' && (
          <form onSubmit={handleSubmit} className="bg-surface-card shadow-sm overflow-hidden border border-border-subtle border-t-0 rounded-b-xl">

            {/* Type selector */}
            <div className="border-b border-border-subtle px-3 sm:px-5 py-3 flex items-center justify-center">
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

            {/* Error Banner */}
            {error && (
              <div key={error} className="px-4 sm:px-8 pt-3 animate-fade-in error-shake">
                <div className="flex items-center gap-2 px-3 py-2 bg-status-danger-bg border border-status-danger-text/20 rounded-lg text-status-danger-text text-xs">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{error}</span>
                  <button type="button" onClick={() => setError('')} className="ml-auto hover:opacity-70">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="px-4 sm:px-8 pt-4 sm:pt-5">
              <ImageUploadSection
                imagePreviews={imagePreviews}
                imageFilesLength={imagePreviews.length}
                onImageSelect={handleImageSelect}
                onRemoveImage={removeImage}
                onSetAsMain={setAsMain}
                onDropFiles={handleDropFiles}
              />
            </div>

            {/* Title & Tags */}
            <div className="px-4 sm:px-8 pt-5 pb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={theme.titlePlaceholder}
                maxLength={100}
                className="w-full text-2xl font-bold text-txt-primary placeholder:text-txt-disabled border-none outline-none bg-transparent leading-tight break-keep"
              />
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

            <div className="mx-4 sm:mx-8 border-t border-border-subtle" />

            {/* Body: 2-Column */}
            <div className="px-4 sm:px-8 py-5 sm:py-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">

                {/* Left (3/5) */}
                <div className="md:col-span-3 space-y-6">

                  {/* Description */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-medium text-txt-tertiary">
                        프로젝트 소개
                      </h3>
                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={aiLoading || !title.trim()}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium border border-border-subtle rounded-lg text-txt-secondary hover:border-brand/30 hover:text-txt-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {aiLoading ? (
                          <><Loader2 size={10} className="animate-spin" /> 생성 중...</>
                        ) : (
                          <><Sparkles size={10} /> AI 작성</>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={theme.descPlaceholder}
                      rows={7}
                      maxLength={500}
                      className="w-full text-base sm:text-sm text-txt-secondary leading-[1.8] placeholder:text-txt-disabled border border-border-subtle rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand resize-none bg-transparent transition-all"
                    />
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
                            placeholder="이름"
                            className="px-3 py-2 border border-border-subtle rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand w-1/3 bg-transparent transition-all"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateLink(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            inputMode="url"
                            className="px-3 py-2 border border-border-subtle rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand flex-1 bg-transparent transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => removeLink(idx)}
                            className="p-2 text-txt-disabled hover:text-status-danger-text transition-colors shrink-0"
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

                {/* Right (2/5) — Sidebar with roles, info, submit */}
                <div className="md:col-span-2 space-y-6">
                  <ProjectInfoSidebar
                    theme={theme}
                    selectedRoles={selectedRoles}
                    locationType={locationType}
                    timeCommitment={timeCommitment}
                    compensationType={compensationType}
                    compensationDetails={compensationDetails}
                    onToggleRole={toggleRole}
                    onSetLocationType={setLocationType}
                    onSetTimeCommitment={(v) => setTimeCommitment(prev => prev === v ? '' : v)}
                    onSetCompensationType={(v) => setCompensationType(prev => prev === v ? '' : v)}
                    onSetCompensationDetails={setCompensationDetails}
                    isPending={updateOpportunity.isPending}
                    imageUploading={imageUploading}
                    submitLabel="변경사항 저장"
                    clubId={(opportunity as any)?.club_id}
                    opportunityId={id}
                  />

                  {/* Delete */}
                  <div className="border border-status-danger-text/20 rounded-xl p-4">
                    <h3 className="text-[10px] font-medium text-status-danger-text mb-2">
                      위험 영역
                    </h3>
                    {showDeleteConfirm ? (
                      <div className="space-y-2 animate-fade-in">
                        <p className="text-xs text-txt-secondary">정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleteOpportunity.isPending}
                            className="flex-1 py-2 bg-status-danger-text text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.95]"
                          >
                            {deleteOpportunity.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            삭제 확인
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2 border border-border text-txt-secondary text-xs font-bold rounded-lg hover:bg-surface-sunken transition-colors active:scale-[0.95]"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2 border border-status-danger-text/30 text-status-danger-text text-xs font-medium rounded-lg hover:bg-status-danger-bg transition-colors flex items-center justify-center gap-1.5 active:scale-[0.97]"
                      >
                        <Trash2 size={12} />
                        프로젝트 삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="md:hidden px-4 py-4 bg-surface-card border-t border-border-subtle">
              <button
                type="submit"
                disabled={updateOpportunity.isPending || imageUploading}
                className={`group/mob relative w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-[0.97] ${theme.mobileBtn}`}
              >
                <span className="absolute inset-0 -translate-x-full group-hover/mob:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="relative flex items-center gap-2">
                  {imageUploading ? (
                    <><Loader2 size={14} className="animate-spin" /> 이미지 업로드 중...</>
                  ) : updateOpportunity.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> 저장 중...</>
                  ) : (
                    <><Save size={14} /> 변경사항 저장</>
                  )}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ─── Tab: Team ─── */}
        {tab === 'team' && (
          <div className="bg-surface-card shadow-sm overflow-hidden border border-border-subtle border-t-0 rounded-b-xl">
            <TeamManageSection opportunityId={id} />
          </div>
        )}

        {/* ─── Tab: GitHub ─── */}
        {tab === 'github' && (
          <div className="bg-surface-card shadow-sm overflow-hidden border border-border-subtle border-t-0 rounded-b-xl">
            {(opportunity as any)?.club?.slug ? (
              <GitHubSettingsPanel
                clubSlug={(opportunity as any).club.slug}
                opportunityId={id}
                hideBackLink
              />
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-txt-tertiary">
                  이 프로젝트가 클럽에 속해있지 않습니다.
                  <br />
                  GitHub 연동은 클럽 프로젝트에서만 사용할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Crop Modal */}
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
      </div>
    </div>
  )
}
