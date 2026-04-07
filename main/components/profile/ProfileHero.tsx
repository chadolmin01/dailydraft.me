'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  Briefcase,
  Building2,
  MapPin,
  Mail,
  GraduationCap,
  Target,
  Sparkles,
  Pencil,
  Check,
  X,
  Loader2,
  Camera,
  Heart,
  Eye,
  RotateCcw,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase/client'
import { cleanNickname } from '@/src/lib/clean-nickname'
import type { Profile } from './types'
import { SITUATION_LABELS } from './types'
import { INTEREST_OPTIONS, AFFILIATION_OPTIONS } from './edit/constants'
import { positionLabel } from '@/src/constants/roles'
import { EditableField } from './EditableField'

/* ── Constants ─────────────────────────────────────────── */

const SITUATION_OPTIONS = [
  { value: 'has_project', label: '프로젝트 진행 중' },
  { value: 'want_to_join', label: '팀 합류 희망' },
  { value: 'solo', label: '팀원 탐색 중' },
  { value: 'exploring', label: '탐색 중' },
]

/* ── Types ─────────────────────────────────────────────── */

interface ProfileHeroProps {
  profile: Profile
  email: string | undefined
  strengths: string[]
  isEditable?: boolean
}

/* ── Component ─────────────────────────────────────────── */

export function ProfileHero({ profile, email, strengths, isEditable = false }: ProfileHeroProps) {
  const bio = profile?.bio ?? null
  const { user } = useAuth()
  const router = useRouter()
  const updateProfile = useUpdateProfile()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)

  // Inline interest tags editing
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')

  // Inline dropdowns
  const [showSituationDropdown, setShowSituationDropdown] = useState(false)
  const situationRef = useRef<HTMLDivElement>(null)
  const [showAffiliationDropdown, setShowAffiliationDropdown] = useState(false)
  const affiliationRef = useRef<HTMLDivElement>(null)

  const heroDefaults = useMemo(() => ({
    nickname: profile?.nickname || '',
    bio: bio || '',
    desired_position: profile?.desired_position || '',
    university: profile?.university || '',
    major: profile?.major || '',
    location: profile?.location || '',
    contact_email: profile?.contact_email || email || '',
  }), [profile, bio, email])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, heroDefaults, {
      onSuccess: () => toast.success('프로필이 저장되었습니다'),
      onError: () => toast.error('프로필 저장에 실패했습니다'),
    }
  )

  useEffect(() => { setEditingBio(false) }, [profile])
  useEffect(() => { if (editingBio && bioRef.current) bioRef.current.focus() }, [editingBio])

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showSituationDropdown && !showAffiliationDropdown) return
    const handler = (e: MouseEvent) => {
      if (showSituationDropdown && situationRef.current && !situationRef.current.contains(e.target as Node))
        setShowSituationDropdown(false)
      if (showAffiliationDropdown && affiliationRef.current && !affiliationRef.current.contains(e.target as Node))
        setShowAffiliationDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSituationDropdown, showAffiliationDropdown])

  /* ── Handlers ── */

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setAvatarUploading(true)
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path)
      updateProfile.mutate({ avatar_url: publicUrl }, {
        onSuccess: () => toast.success('프로필 사진이 변경되었습니다'),
        onError: () => toast.error('프로필 사진 변경에 실패했습니다'),
      })
    } catch {
      toast.error('이미지 업로드에 실패했습니다')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const toggleInterestTag = (tag: string) => {
    const current = profile?.interest_tags || []
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    updateProfile.mutate({ interest_tags: updated })
  }

  const addCustomInterestTag = () => {
    const tag = customTagInput.trim()
    if (!tag) return
    const current = profile?.interest_tags || []
    if (current.includes(tag)) return
    updateProfile.mutate({ interest_tags: [...current, tag] })
    setCustomTagInput('')
  }

  const handleSituationChange = (value: string) => {
    updateProfile.mutate({ current_situation: value })
    setShowSituationDropdown(false)
  }

  const handleAffiliationChange = (value: string) => {
    updateProfile.mutate({ affiliation_type: value })
    setShowAffiliationDropdown(false)
  }

  /* ── Derived values ── */

  const affConfig = AFFILIATION_OPTIONS.find(a => a.value === (profile?.affiliation_type || 'student')) || AFFILIATION_OPTIONS[0]
  const situation = profile?.current_situation
  const affType = profile?.affiliation_type
  const affLabel = AFFILIATION_OPTIONS.find(a => a.value === affType)?.label
  const interestTags = profile?.interest_tags || []
  const views = profile?.profile_views ?? 0
  const likes = profile?.interest_count ?? 0
  const bioValue = drafts.bio ?? bio ?? ''
  const bioIsChanged = drafts.bio !== undefined && drafts.bio !== (bio || '')

  const infoItems = [
    { icon: Briefcase, label: '포지션', value: profile?.desired_position || '', displayValue: positionLabel(profile?.desired_position || ''), field: 'desired_position', placeholder: '포지션을 입력하세요' },
    { icon: Building2, label: affConfig.orgLabel, value: profile?.university || '', field: 'university', placeholder: affConfig.orgPlaceholder },
    { icon: GraduationCap, label: affConfig.roleLabel, value: profile?.major || '', field: 'major', placeholder: affConfig.rolePlaceholder },
    { icon: MapPin, label: '활동 지역', value: profile?.location || '', field: 'location', placeholder: '지역을 입력하세요' },
    { icon: Mail, label: '연락처', value: profile?.contact_email || email || '', field: 'contact_email', placeholder: '이메일을 입력하세요' },
  ]

  /* ════════════════════════════════════════════════════════ */
  /* RENDER                                                  */
  /* ════════════════════════════════════════════════════════ */

  return (
    <div className="relative mb-8">
        {/* ── Guide restart (top-right) ── */}
        {isEditable && (
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10 group/guide">
            <button
              onClick={() => {
                const key = 'draft_starter_guide'
                try {
                  const raw = localStorage.getItem(key)
                  if (raw) {
                    const s = JSON.parse(raw)
                    s.softDismissedAt = null
                    s.permanentlyDismissed = false
                    s.completedAt = null
                    localStorage.setItem(key, JSON.stringify(s))
                  } else {
                    localStorage.setItem(key, JSON.stringify({
                      version: 1, steps: { profile: false, explore: false, project: false },
                      softDismissedAt: null, permanentlyDismissed: false, completedAt: null,
                    }))
                  }
                } catch { localStorage.removeItem(key) }
                toast.success('시작 가이드가 다시 표시됩니다')
                router.push('/explore')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-tertiary hover:text-txt-primary bg-surface-bg border border-border rounded-xl transition-colors"
            >
              <RotateCcw size={10} />
              <span className="hidden sm:inline">가이드</span>
            </button>
            <span className="absolute top-[calc(100%+6px)] right-0 px-2.5 py-1.5 text-xs font-medium bg-surface-inverse text-txt-inverse rounded-xl shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/guide:opacity-100 transition-opacity">
              시작 가이드 다시 보기
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 1: Identity                         */}
        {/* ════════════════════════════════════════════ */}
        <div className="flex items-start gap-5 sm:gap-6">
          {/* Avatar */}
          <div
            className={`relative w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-2xl shrink-0 overflow-hidden bg-brand-bg border-2 border-border shadow-sm flex items-center justify-center ${isEditable ? 'group/avatar cursor-pointer' : ''}`}
            onClick={isEditable ? () => avatarInputRef.current?.click() : undefined}
          >
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={96} height={96} className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-brand">
                {cleanNickname(profile?.nickname || '').slice(0, 2).toUpperCase() || 'U'}
              </span>
            )}
            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {avatarUploading ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <>
                    <Camera size={16} className="text-white" />
                    <span className="text-[10px] font-semibold text-white">{profile?.avatar_url ? '변경' : '추가'}</span>
                  </>
                )}
              </div>
            )}
            {isEditable && (
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
            {/* Name */}
            <div className="mb-1">
              {isEditable ? (
                <h1 className="text-xl sm:text-2xl font-bold text-txt-primary tracking-tight">
                  <EditableField variant="inline"
                    value={profile?.nickname || ''}
                    draft={drafts.nickname}
                    placeholder="이름"
                    className="text-xl sm:text-2xl font-bold tracking-tight"
                    onEdit={editField('nickname')}
                  />
                </h1>
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold text-txt-primary tracking-tight truncate">
                  {cleanNickname(profile?.nickname || '') || 'User'}
                </h1>
              )}
            </div>

            {/* Position + University subtitle */}
            <p className="text-sm text-txt-secondary mb-2.5 truncate">
              {isEditable ? (
                <EditableField variant="inline"
                  value={profile?.desired_position || ''}
                  displayValue={positionLabel(profile?.desired_position || '')}
                  draft={drafts.desired_position}
                  placeholder="포지션 미설정"
                  className="text-sm"
                  onEdit={editField('desired_position')}
                />
              ) : (
                <>{positionLabel(profile?.desired_position || '') || '포지션 미설정'}</>
              )}
              {profile?.university && <span className="text-txt-tertiary"> · {profile.university}</span>}
            </p>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Situation badge */}
              {(isEditable || situation) && (
                <div className="relative" ref={situationRef}>
                  {isEditable ? (
                    <button
                      onClick={() => setShowSituationDropdown(prev => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand/8 text-brand border border-brand/20 rounded-full hover:bg-brand/15 transition-colors"
                    >
                      <Target size={10} />
                      {situation ? (SITUATION_LABELS[situation] || situation) : '상황 선택'}
                      <ChevronDown size={9} />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand/8 text-brand border border-brand/20 rounded-full">
                      <Target size={10} /> {SITUATION_LABELS[situation!] || situation}
                    </span>
                  )}
                  {showSituationDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 z-20 bg-surface-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
                      {SITUATION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleSituationChange(opt.value)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors ${
                            situation === opt.value ? 'bg-brand/8 text-brand font-bold' : 'text-txt-secondary hover:bg-surface-sunken'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Affiliation badge */}
              {(isEditable || affLabel) && (
                <div className="relative" ref={affiliationRef}>
                  {isEditable ? (
                    <button
                      onClick={() => setShowAffiliationDropdown(prev => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-sunken text-txt-secondary border border-border rounded-full hover:border-txt-tertiary transition-colors"
                    >
                      <Building2 size={10} />
                      {affLabel || '소속 유형'}
                      <ChevronDown size={9} />
                    </button>
                  ) : affLabel ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-sunken text-txt-secondary border border-border rounded-full">
                      <Building2 size={10} /> {affLabel}
                    </span>
                  ) : null}
                  {showAffiliationDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 z-20 bg-surface-card border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                      {AFFILIATION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleAffiliationChange(opt.value)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors ${
                            affType === opt.value ? 'bg-brand/8 text-brand font-bold' : 'text-txt-secondary hover:bg-surface-sunken'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stats inline */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="flex items-center gap-1 text-xs text-txt-tertiary">
                  <Eye size={12} />
                  <span className="font-medium text-txt-secondary">{views}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-txt-tertiary">
                  <Heart size={12} className={likes > 0 ? 'text-status-danger-accent fill-status-danger-accent' : ''} />
                  <span className="font-medium text-txt-secondary">{likes}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 2: Bio                              */}
        {/* ════════════════════════════════════════════ */}
        <div className="mt-6">
          {isEditable ? (
            editingBio ? (
              <div>
                <textarea
                  ref={bioRef}
                  value={bioValue}
                  onChange={(e) => editField('bio')(e.target.value.slice(0, 500))}
                  onBlur={() => setEditingBio(false)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditingBio(false) }}
                  placeholder="자기소개를 입력하세요"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm leading-relaxed text-txt-primary bg-surface-bg border border-border rounded-xl outline-none resize-none focus:border-brand transition-colors"
                />
                <p className={`text-[11px] text-right mt-1 ${bioValue.length >= 450 ? 'text-status-danger-text font-semibold' : bioValue.length >= 350 ? 'text-status-warning-text' : 'text-txt-disabled'}`}>
                  {bioValue.length}/500
                </p>
              </div>
            ) : bioValue ? (
              <div
                className="group/bio cursor-pointer rounded-xl px-4 py-3 -mx-1 hover:bg-surface-bg transition-colors"
                onClick={() => setEditingBio(true)}
              >
                <p className={`text-sm leading-relaxed ${bioIsChanged ? 'text-brand' : 'text-txt-primary/85'}`}>
                  {bioValue}
                </p>
                <Pencil size={10} className="mt-1 opacity-0 group-hover/bio:opacity-30 transition-opacity text-txt-tertiary" />
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed border-border p-6 cursor-pointer hover:border-brand/30 hover:bg-brand-bg/20 transition-all group/bio"
                onClick={() => setEditingBio(true)}
              >
                <div className="flex flex-col items-center gap-2">
                  <Pencil size={18} className="text-txt-disabled group-hover/bio:text-brand transition-colors" />
                  <p className="text-sm font-medium text-txt-tertiary group-hover/bio:text-txt-primary transition-colors">자기소개를 작성해보세요</p>
                  <p className="text-xs text-txt-disabled">나를 소개하는 글을 남겨보세요</p>
                </div>
              </div>
            )
          ) : bio ? (
            <p className="text-sm leading-relaxed text-txt-primary/85">{bio}</p>
          ) : null}
        </div>

        {/* ── Info Grid ── */}
        <div className="mt-6 pt-6 border-t border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {infoItems.map((item) => (
              <div key={item.field}>
                <p className="text-xs text-txt-tertiary mb-0.5">{item.label}</p>
                {isEditable ? (
                  <EditableField variant="inline"
                    value={item.value}
                    displayValue={item.displayValue}
                    draft={drafts[item.field]}
                    placeholder={item.placeholder}
                    className="text-sm font-medium text-txt-primary"
                    onEdit={editField(item.field)}
                  />
                ) : (
                  <p className="text-sm font-medium text-txt-primary truncate">{(item.displayValue ?? item.value) || '미설정'}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Interest Tags ── */}
        {(interestTags.length > 0 || isEditable) && (
          <div className="mt-6 pt-6 border-t border-border/60">
            <p className="text-xs text-txt-tertiary mb-3">관심 분야</p>
            <div className="flex gap-2 flex-wrap">
              {interestTags.map((tag, idx) => (
                <span key={idx} className="text-xs px-3 py-1.5 font-medium rounded-full inline-flex items-center gap-1 bg-brand/8 text-brand border border-brand/20 transition-all">
                  {tag}
                  {isEditable && showTagEditor && (
                    <button onClick={() => toggleInterestTag(tag)} className="hover:text-status-danger-text transition-colors p-0.5 -mr-1">
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              {isEditable && !showTagEditor && (
                <button
                  onClick={() => setShowTagEditor(true)}
                  className="text-xs text-txt-tertiary border border-dashed border-border/80 px-3 py-1.5 font-medium rounded-full hover:border-brand hover:text-brand transition-colors inline-flex items-center gap-1"
                >
                  <Plus size={10} /> 추가
                </button>
              )}
            </div>

            {/* Tag editor */}
            {isEditable && showTagEditor && (
              <div className="mt-3 p-4 bg-surface-bg rounded-xl border border-border space-y-3">
                <p className="text-[11px] text-txt-tertiary">탭하여 추가 · 태그의 X로 제거</p>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_OPTIONS.filter(t => !interestTags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleInterestTag(tag)}
                      className="text-xs px-3 py-1.5 border border-border bg-surface-card text-txt-secondary rounded-full hover:border-brand hover:text-brand transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterestTag() } }}
                    placeholder="직접 입력"
                    maxLength={20}
                    className="flex-1 px-3 py-2 text-xs border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand transition-colors"
                  />
                  <button onClick={addCustomInterestTag} className="px-3 py-2 text-xs border border-border text-txt-secondary hover:bg-surface-sunken transition-colors rounded-lg">
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => { setShowTagEditor(false); setCustomTagInput('') }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <Check size={10} /> 완료
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Strengths ── */}
        {strengths.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-txt-tertiary mb-3 flex items-center gap-1.5">
              <Sparkles size={10} /> 강점
            </p>
            <div className="flex gap-2 flex-wrap">
              {strengths.map((s, idx) => (
                <span key={idx} className="text-xs bg-indicator-online/10 text-indicator-online border border-indicator-online/20 px-3 py-1.5 font-medium rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* Save bar                                    */}
        {/* ════════════════════════════════════════════ */}
        {isEditable && hasPendingChanges && (
          <div className="flex items-center justify-end gap-2.5 pt-6 mt-6 border-t border-border/60">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-txt-secondary border border-border hover:bg-surface-sunken transition-colors rounded-xl"
            >
              <X size={12} /> 취소
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 rounded-xl"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              저장
            </button>
          </div>
        )}
    </div>
  )
}
