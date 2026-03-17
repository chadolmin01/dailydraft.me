'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, X, Sparkles, ImagePlus, Code2, Palette, Lightbulb, Megaphone, Users, BarChart3, MapPin, Clock, Calendar, Crop, Check, Star, AlertCircle } from 'lucide-react'
import Cropper, { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { useCreateOpportunity } from '@/src/hooks/useOpportunities'

async function getCroppedImg(src: string, cropArea: Area): Promise<File> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, cropArea.width, cropArea.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas to blob failed'))
      resolve(new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

const TYPE_OPTIONS = [
  { value: 'side_project', label: 'SIDE PROJECT' },
  { value: 'startup', label: 'STARTUP' },
  { value: 'study', label: 'STUDY' },
]

const ROLE_OPTIONS = [
  { value: '개발자', icon: Code2 },
  { value: '디자이너', icon: Palette },
  { value: '기획자', icon: Lightbulb },
  { value: '마케터', icon: Megaphone },
  { value: 'PM', icon: Users },
  { value: '데이터분석', icon: BarChart3 },
]

const LOCATION_TYPE_OPTIONS = [
  { value: 'remote', label: '원격' },
  { value: 'hybrid', label: '하이브리드' },
  { value: 'offline', label: '오프라인' },
]

const TIME_OPTIONS = [
  { value: 'part_time', label: '파트타임' },
  { value: 'full_time', label: '풀타임' },
]

const COMPENSATION_OPTIONS = [
  { value: 'unpaid', label: '무급' },
  { value: 'equity', label: '지분' },
  { value: 'salary', label: '유급' },
  { value: 'hybrid', label: '혼합' },
]

const CATEGORY_TAGS = [
  'AI/ML', 'SaaS', 'Fintech', 'HealthTech', 'Social',
  'EdTech', 'E-Commerce', 'DevTools', 'Blockchain', 'IoT',
]

const TYPE_THEMES: Record<string, {
  badge: string
  status: string
  statusDot: string
  roleOn: string
  roleIconOn: string
  chipOn: string
  cta: string
  ctaBtn: string
  mobileBtn: string
  painBg: string
  titlePlaceholder: string
  descPlaceholder: string
  painLabel: string
  painPlaceholder: string
  ctaTitle: string
  ctaDesc: string
  rolesLabel: string
}> = {
  side_project: {
    badge: 'bg-indigo-600 text-txt-inverse',
    status: 'bg-indigo-100/70 text-indigo-600',
    statusDot: 'bg-indigo-500',
    roleOn: 'bg-indigo-600 text-txt-inverse border-indigo-600',
    roleIconOn: 'text-indigo-300',
    chipOn: 'bg-indigo-600 text-txt-inverse border-indigo-600',
    cta: 'bg-indigo-600',
    ctaBtn: 'bg-surface-card text-indigo-700 hover:bg-indigo-50',
    mobileBtn: 'bg-indigo-600 hover:bg-indigo-700 text-txt-inverse',
    painBg: 'bg-indigo-50/50',
    titlePlaceholder: '예: AI 기반 대학생 매칭 플랫폼',
    descPlaceholder: '어떤 걸 만들고 있는지, 현재 어디까지 진행했는지 자유롭게 적어주세요',
    painLabel: '해결하려는 문제',
    painPlaceholder: '이 프로젝트로 어떤 불편함을 해결하나요?',
    ctaTitle: '사이드 프로젝트를 시작해볼까요?',
    ctaDesc: '등록하면 관심있는 팀원이 커피챗을 신청할 수 있어요.',
    rolesLabel: '함께할 포지션 *',
  },
  startup: {
    badge: 'bg-surface-inverse text-txt-inverse',
    status: 'bg-status-success-bg/70 text-indicator-online',
    statusDot: 'bg-indicator-online',
    roleOn: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
    roleIconOn: 'text-txt-tertiary',
    chipOn: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
    cta: 'bg-surface-inverse',
    ctaBtn: 'bg-surface-card text-txt-primary hover:bg-accent-secondary',
    mobileBtn: 'bg-surface-inverse hover:bg-accent-hover text-txt-inverse',
    painBg: 'bg-surface-sunken',
    titlePlaceholder: '예: 대학생 중고거래 플랫폼 "캠퍼스마켓"',
    descPlaceholder: '어떤 시장을 타겟하는지, 비즈니스 모델과 현재 단계를 설명해주세요',
    painLabel: '타겟 시장의 문제',
    painPlaceholder: '고객이 겪고 있는 핵심 문제는 무엇인가요?',
    ctaTitle: '공동창업자를 찾을 준비가 되었나요?',
    ctaDesc: '등록 후 잠재적 공동창업자가 커피챗을 신청할 수 있습니다.',
    rolesLabel: '모집 중인 포지션 *',
  },
  study: {
    badge: 'bg-teal-600 text-txt-inverse',
    status: 'bg-teal-100/70 text-teal-600',
    statusDot: 'bg-teal-500',
    roleOn: 'bg-teal-600 text-txt-inverse border-teal-600',
    roleIconOn: 'text-teal-300',
    chipOn: 'bg-teal-600 text-txt-inverse border-teal-600',
    cta: 'bg-teal-600',
    ctaBtn: 'bg-surface-card text-teal-700 hover:bg-teal-50',
    mobileBtn: 'bg-teal-600 hover:bg-teal-700 text-txt-inverse',
    painBg: 'bg-teal-50/50',
    titlePlaceholder: '예: CS 알고리즘 스터디, UX 리서치 북클럽',
    descPlaceholder: '무엇을 공부하는지, 어떤 방식으로 진행하는지 알려주세요',
    painLabel: '스터디 목표',
    painPlaceholder: '이 스터디를 통해 달성하고 싶은 목표는?',
    ctaTitle: '스터디원을 모집해볼까요?',
    ctaDesc: '등록하면 관심있는 스터디원이 참여 신청할 수 있어요.',
    rolesLabel: '찾고 있는 스터디원 *',
  },
}

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

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024

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
      const formData = new FormData()
      imageFiles.forEach(f => formData.append('files', f))
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('업로드 실패')
      const { urls } = await res.json()
      return urls || []
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
                className="flex items-center gap-1 text-xs text-txt-tertiary hover:text-txt-secondary transition-colors"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">돌아가기</span>
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
            {imagePreviews.length > 0 ? (
              <div className="space-y-1.5">
                {/* Main image */}
                <div className="relative group overflow-hidden border border-border-strong">
                  <img
                    src={imagePreviews[0]}
                    alt="메인 이미지"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {imagePreviews.length > 1 && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-[0.625rem] font-mono font-bold uppercase tracking-wider">
                      <Star size={9} className="fill-white" />
                      메인
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(0)}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>

                {/* Thumbnails */}
                {(imagePreviews.length > 1 || imageFiles.length < 5) && (
                  <div className="flex gap-1.5">
                    {imagePreviews.slice(1).map((src, i) => {
                      const idx = i + 1
                      return (
                        <div key={idx} className="relative group flex-1 min-w-0 border border-border overflow-hidden">
                          <img
                            src={src}
                            alt={`이미지 ${idx + 1}`}
                            className="w-full h-[4.5rem] object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setAsMain(idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1 text-white text-[0.625rem] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              <Star size={9} />
                              메인으로
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                          >
                            <X size={11} className="text-white" />
                          </button>
                        </div>
                      )
                    })}
                    {imageFiles.length < 5 && (
                      <label className="flex-1 min-w-0 flex items-center justify-center border border-dashed border-border cursor-pointer hover:border-border-strong hover:bg-surface-sunken transition-colors h-[4.5rem]">
                        <div className="text-center">
                          <Plus size={14} className="text-txt-disabled mx-auto mb-0.5" />
                          <span className="text-[0.5625rem] font-mono text-txt-disabled uppercase">추가</span>
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-border cursor-pointer hover:border-border-strong hover:bg-surface-sunken/50 transition-all h-40 group">
                <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center mb-3 group-hover:bg-accent-secondary transition-colors">
                  <ImagePlus size={18} className="text-txt-disabled group-hover:text-txt-tertiary transition-colors" />
                </div>
                <p className="text-sm text-txt-tertiary font-medium">프로젝트 이미지 추가</p>
                <p className="text-[0.625rem] font-mono text-txt-disabled mt-1 uppercase tracking-wider">JPG, PNG, WebP, GIF / 최대 5장</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            )}
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
              <div className="md:col-span-2 space-y-6">

                {/* Roles */}
                <div>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider mb-2">
                    {theme.rolesLabel}
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ROLE_OPTIONS.map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleRole(value)}
                        className={`flex flex-col items-center justify-center aspect-square border transition-colors ${
                          selectedRoles.includes(value)
                            ? theme.roleOn
                            : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:bg-accent-secondary hover:border-border'
                        }`}
                      >
                        <Icon size={18} className={selectedRoles.includes(value) ? `${theme.roleIconOn} mb-1.5` : 'text-txt-disabled mb-1.5'} />
                        <span className="text-xs font-medium">{value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project Info */}
                <div>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider mb-3">
                    프로젝트 정보
                  </h3>
                  <div className="space-y-4">
                    {/* Location */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin size={13} className="text-txt-disabled" />
                        <span className="text-xs text-txt-secondary font-medium">활동 방식</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-5">
                        {LOCATION_TYPE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLocationType(opt.value)}
                            className={`px-3 py-1.5 text-xs border transition-colors ${
                              locationType === opt.value
                                ? theme.chipOn
                                : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock size={13} className="text-txt-disabled" />
                        <span className="text-xs text-txt-secondary font-medium">시간 투자</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-5">
                        {TIME_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTimeCommitment(prev => prev === opt.value ? '' : opt.value)}
                            className={`px-3 py-1.5 text-xs border transition-colors ${
                              timeCommitment === opt.value
                                ? theme.chipOn
                                : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Compensation */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles size={13} className="text-txt-disabled" />
                        <span className="text-xs text-txt-secondary font-medium">보상 방식</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-5">
                        {COMPENSATION_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setCompensationType(prev => prev === opt.value ? '' : opt.value)}
                            className={`px-3 py-1.5 text-xs border transition-colors ${
                              compensationType === opt.value
                                ? theme.chipOn
                                : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {compensationType && compensationType !== 'unpaid' && (
                        <input
                          type="text"
                          value={compensationDetails}
                          onChange={(e) => setCompensationDetails(e.target.value)}
                          placeholder="상세 (예: 지분 5%, 월 50만원)"
                          className="px-3 py-2 border border-border text-sm mt-2 ml-5 w-[calc(100%-1.25rem)] focus:outline-none focus:border-border-strong bg-transparent"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit CTA (desktop) */}
                <div className={`hidden md:block p-5 text-txt-inverse border border-transparent transition-colors ${theme.cta}`}>
                  <h3 className="font-bold text-sm mb-1">{theme.ctaTitle}</h3>
                  <p className="text-white/60 text-xs mb-4 break-keep">
                    {theme.ctaDesc}
                  </p>
                  <button
                    type="submit"
                    disabled={createOpportunity.isPending || imageUploading}
                    className={`w-full py-3 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme.ctaBtn}`}
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
              </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-surface-card border border-border-strong w-full max-w-lg flex flex-col overflow-hidden shadow-brutal">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-border-strong bg-surface-sunken">
                <div className="flex items-center gap-2">
                  <Crop size={13} className="text-txt-tertiary" />
                  <span className="text-[0.625rem] font-mono font-bold text-txt-secondary uppercase tracking-wider">이미지 크롭</span>
                  <span className="text-[0.625rem] font-mono text-txt-disabled">16:9</span>
                </div>
                {cropQueue.length > 0 && (
                  <span className="text-[0.625rem] font-mono text-txt-disabled">
                    +{cropQueue.length}장 대기
                  </span>
                )}
              </div>

              {/* Crop area */}
              <div className="relative w-full h-72 sm:h-80 bg-black">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                />
              </div>

              {/* Controls */}
              <div className="px-4 py-3 space-y-3 bg-surface-card">
                <div className="flex items-center gap-3">
                  <span className="text-[0.625rem] font-mono text-txt-disabled uppercase tracking-wider w-6">줌</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="flex-1 h-1 accent-black"
                  />
                  <span className="text-[0.625rem] font-mono text-txt-tertiary w-8 text-right">{zoom.toFixed(1)}x</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCropCancel}
                    className="flex-1 py-2.5 text-xs font-bold font-mono uppercase tracking-wider border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
                  >
                    건너뛰기
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    className="flex-1 py-2.5 text-xs font-bold font-mono uppercase tracking-wider bg-surface-inverse text-txt-inverse border border-surface-inverse hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} />
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
