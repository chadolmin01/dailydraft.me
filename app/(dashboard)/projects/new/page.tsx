'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, X, Sparkles, AlertCircle } from 'lucide-react'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { useCreateOpportunity } from '@/src/hooks/useOpportunities'
import { TYPE_OPTIONS, CATEGORY_TAGS, TYPE_THEMES } from './constants'
import { getCroppedImg, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, uploadImagesToSupabase } from './utils'
import { ImageUploadSection } from './components/ImageUploadSection'
import { CropModal } from './components/CropModal'
import { ProjectInfoSidebar } from './components/ProjectInfoSidebar'

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
    } catch { /* ignore parse errors */ }
  }, [])

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - imageFiles.length
    const toAdd = files.slice(0, remaining)
    if (toAdd.length === 0) return

    const invalid = toAdd.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid.length > 0) {
      setError(`JPG, PNG, WebP, GIF만 업로드 가능합니다 (${invalid.map(f => f.name).join(', ')})`)
      e.target.value = ''
      return
    }
    const tooLarge = toAdd.filter(f => f.size > MAX_IMAGE_SIZE)
    if (tooLarge.length > 0) {
      setError(`5MB 이하 파일만 업로드 가능합니다 (${tooLarge.map(f => f.name).join(', ')})`)
      e.target.value = ''
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
    e.target.value = ''
  }

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return
    try {
      const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels)
      const previewUrl = URL.createObjectURL(croppedFile)
      setImageFiles(prev => [...prev, croppedFile])
      setImagePreviews(prev => [...prev, previewUrl])
    } catch { /* ignore crop errors */ }

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
    URL.revokeObjectURL(imagePreviews[idx])
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
      })
      toast.success('프로젝트가 등록되었습니다')
      router.push(returnTo || `/p/${result.id}`)
    } catch {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.')
      toast.error('프로젝트 생성에 실패했습니다')
    }
  }

  const theme = TYPE_THEMES[type] || TYPE_THEMES.side_project

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-4xl mx-auto px-4 py-2 md:py-4">

        <form onSubmit={handleSubmit} className="bg-surface-card shadow-sharp overflow-hidden border border-border-strong">

          {/* ─── Window Bar ─── */}
          <div className="bg-surface-sunken border-b-2 border-border-strong px-3 sm:px-5 py-2.5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="hidden sm:flex items-center gap-1 text-xs text-txt-tertiary hover:text-txt-secondary transition-colors"
              >
                <ArrowLeft size={14} />
                <span>돌아가기</span>
              </button>
              <div className="w-px h-3 bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <div className="w-2.5 h-2.5 bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 bg-[#28C840]" />
              </div>
            </div>

            {/* Type selector — absolute center */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`text-[0.625rem] font-mono font-bold px-2.5 py-1 uppercase tracking-wider transition-colors ${
                    type === opt.value
                      ? TYPE_THEMES[opt.value].badge
                      : 'bg-surface-sunken text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-bold transition-colors ${theme.status}`}>
              <span className={`w-1.5 h-1.5 animate-pulse ${theme.statusDot}`} />
              작성 중
            </span>
          </div>

          {/* ─── Error Banner ─── */}
          {error && (
            <div className="px-4 sm:px-8 pt-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-status-danger-bg border border-status-danger-text/20 text-status-danger-text text-xs">
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
            />
          </div>

          {/* ─── Title & Tags ─── */}
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
              {CATEGORY_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    selectedTags.includes(tag)
                      ? theme.chipOn
                      : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:border-border hover:text-txt-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 sm:mx-8 border-t border-border" />

          {/* ─── Body: 2-Column ─── */}
          <div className="px-4 sm:px-8 py-5 sm:py-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">

              {/* Left (3/5) */}
              <div className="md:col-span-3 space-y-6">

                {/* Description */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider">
                      프로젝트 소개
                    </h3>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={aiLoading || !title.trim()}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[0.625rem] font-mono font-bold uppercase tracking-wider border border-border text-txt-secondary hover:border-border-strong hover:text-txt-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                    maxLength={2000}
                    className="w-full text-sm text-txt-secondary leading-[1.8] placeholder:text-txt-disabled border border-border-strong p-3 focus:outline-none focus:border-surface-inverse resize-none bg-transparent"
                  />
                  <p className="text-[0.625rem] text-txt-disabled mt-1 text-right font-mono">{description.length}/2000</p>
                </section>

                {/* Pain Point */}
                <section className={`p-4 border border-border-subtle transition-colors ${theme.painBg}`}>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider mb-2">
                    {theme.painLabel}
                  </h3>
                  <textarea
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    placeholder={theme.painPlaceholder}
                    rows={3}
                    maxLength={1000}
                    className="w-full text-sm text-txt-secondary leading-relaxed placeholder:text-txt-disabled border-none outline-none bg-transparent resize-none"
                  />
                </section>

                {/* Links */}
                <section>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider mb-2">
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
                          className="px-3 py-2 border border-border text-sm focus:outline-none focus:border-border-strong w-1/3 bg-transparent"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="px-3 py-2 border border-border text-sm focus:outline-none focus:border-border-strong flex-1 bg-transparent"
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

              {/* Right (2/5) */}
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
                isPending={createOpportunity.isPending}
                imageUploading={imageUploading}
              />
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="md:hidden px-4 py-4 bg-surface-card border-t-2 border-border-strong">
            <button
              type="submit"
              disabled={createOpportunity.isPending || imageUploading}
              className={`w-full h-12 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.mobileBtn}`}
            >
              {imageUploading ? (
                <><Loader2 size={14} className="animate-spin" /> 이미지 업로드 중...</>
              ) : createOpportunity.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
              ) : (
                '프로젝트 등록하기'
              )}
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
      </div>
    </div>
  )
}
