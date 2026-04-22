'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Camera, Loader2, Pencil, Plus, X, Briefcase, MapPin, Building2,
} from 'lucide-react'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase/client'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { positionLabel } from '@/src/constants/roles'
import type { Profile } from './types'
import { SITUATION_LABELS } from './types'

/**
 * Hero 섹션 — 아바타 · 이름 · 포지션 · 한줄 소개.
 * 모든 색·사이즈는 디자인 토큰만 사용. 상세 편집(스킬·링크 등)은 About 탭.
 */

interface ProfileHeroProps {
  profile: Profile
  email: string | undefined
  strengths: string[]
  isEditable?: boolean
}

const SITUATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'has_project', label: '프로젝트 진행 중' },
  { value: 'want_to_join', label: '팀 합류 희망' },
  { value: 'solo', label: '팀원 탐색 중' },
  { value: 'exploring', label: '탐색 중' },
]

export function ProfileHero({ profile, email, isEditable = false }: ProfileHeroProps) {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [showSituation, setShowSituation] = useState(false)
  const situationRef = useRef<HTMLDivElement>(null)

  const defaults = useMemo(() => ({
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    desired_position: profile?.desired_position || '',
    university: profile?.university || '',
    major: profile?.major || '',
    location: (profile?.locations as string[] | null)?.join(', ') || '',
    contact_email: profile?.contact_email || email || '',
  }), [profile, email])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, defaults, {
      onSuccess: () => toast.success('프로필이 저장되었습니다'),
      onError: () => toast.error('프로필 저장에 실패했습니다'),
    }
  )

  useEffect(() => { setEditingBio(false) }, [profile])
  useEffect(() => { if (editingBio && bioRef.current) bioRef.current.focus() }, [editingBio])
  useEffect(() => {
    if (!showSituation) return
    const handler = (e: MouseEvent) => {
      if (situationRef.current && !situationRef.current.contains(e.target as Node)) setShowSituation(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSituation])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 가능합니다'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('5MB 이하만 가능합니다'); return }
    setAvatarUploading(true)
    try {
      const ext = file.type.split('/')[1] || 'jpg'
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(path)
      await updateProfile.mutateAsync({ avatar_url: publicUrl })
      toast.success('프로필 사진이 변경되었습니다')
    } catch {
      toast.error('업로드에 실패했습니다')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const nickname = cleanNickname(drafts.nickname ?? profile?.nickname ?? '')
  const bio = drafts.bio ?? profile?.bio ?? ''
  const position = drafts.desired_position ?? profile?.desired_position ?? ''
  const university = drafts.university ?? profile?.university ?? ''
  const major = drafts.major ?? profile?.major ?? ''
  const locations = drafts.location ?? (profile?.locations as string[] | null)?.join(', ') ?? ''
  const situation = profile?.current_situation
  const situationLabel = situation ? (SITUATION_LABELS[situation] ?? '상황 선택') : '상황 선택'

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-4 sm:gap-5">
        {/* 아바타 */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-brand-bg border border-border flex items-center justify-center">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={nickname || '프로필'} width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-brand">
                {nickname ? nickname.slice(0, 2) : '?'}
              </span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-surface-inverse/40 flex items-center justify-center">
                <Loader2 size={20} className="text-txt-inverse animate-spin" />
              </div>
            )}
          </div>
          {isEditable && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface-inverse text-txt-inverse flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                aria-label="프로필 사진 변경"
              >
                <Camera size={12} />
              </button>
            </>
          )}
        </div>

        {/* 이름·포지션·상태 */}
        <div className="flex-1 min-w-0">
          {/* 닉네임 */}
          <input
            value={drafts.nickname ?? nickname}
            onChange={e => editField('nickname')(e.target.value)}
            disabled={!isEditable}
            placeholder="예: 김도윤 (활동명)"
            aria-label="닉네임 · 동아리·프로젝트에서 노출되는 이름"
            className="w-full bg-transparent text-[22px] sm:text-[26px] font-bold text-txt-primary outline-none placeholder:text-txt-disabled border-b border-transparent focus:border-border transition-colors px-0 pb-1"
          />
          {/* 포지션 + 상황 */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-bg text-brand text-xs font-semibold">
              <Briefcase size={11} />
              <input
                value={drafts.desired_position ?? position}
                onChange={e => editField('desired_position')(e.target.value)}
                disabled={!isEditable}
                placeholder="예: 프론트엔드"
                aria-label="희망 포지션"
                className="bg-transparent outline-none w-24 placeholder:text-txt-disabled"
              />
              {position && <span className="text-txt-tertiary">·</span>}
              {position && <span className="text-txt-tertiary">{positionLabel(position) || position}</span>}
            </div>
            {isEditable && (
              <div ref={situationRef} className="relative">
                <button
                  onClick={() => setShowSituation(v => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sunken text-txt-secondary text-xs font-medium hover:bg-border-subtle transition-colors"
                >
                  {situationLabel}
                </button>
                {showSituation && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-surface-card border border-border rounded-xl shadow-lg p-1 z-20">
                    {SITUATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updateProfile.mutate({ current_situation: opt.value })
                          setShowSituation(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-sunken transition-colors ${
                          situation === opt.value ? 'text-brand font-semibold' : 'text-txt-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 메타: 학교, 학과, 지역 */}
          <div className="flex items-center gap-3 mt-3 text-[13px] text-txt-tertiary flex-wrap">
            {(university || isEditable) && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                <input
                  value={drafts.university ?? university}
                  onChange={e => editField('university')(e.target.value)}
                  disabled={!isEditable}
                  placeholder="예: 경희대"
                  aria-label="소속 (학교 또는 회사)"
                  className="bg-transparent outline-none w-24 placeholder:text-txt-disabled focus:text-txt-primary"
                />
              </span>
            )}
            {(major || isEditable) && (
              <>
                <span className="text-border">·</span>
                <input
                  value={drafts.major ?? major}
                  onChange={e => editField('major')(e.target.value)}
                  disabled={!isEditable}
                  placeholder="예: 컴공"
                  aria-label="학과 또는 직무"
                  className="bg-transparent outline-none w-20 placeholder:text-txt-disabled focus:text-txt-primary"
                />
              </>
            )}
            {(locations || isEditable) && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  <input
                    value={drafts.location ?? locations}
                    onChange={e => editField('location')(e.target.value)}
                    disabled={!isEditable}
                    placeholder="예: 서울"
                    aria-label="주 활동 지역"
                    className="bg-transparent outline-none w-20 placeholder:text-txt-disabled focus:text-txt-primary"
                  />
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 한줄 소개 — full width 하단 */}
      <div className="mt-5 pt-5 border-t border-border">
        {editingBio ? (
          <div>
            <textarea
              ref={bioRef}
              value={drafts.bio ?? bio}
              onChange={e => editField('bio')(e.target.value)}
              onBlur={() => setEditingBio(false)}
              placeholder="무엇을 하고 계신지, 어떤 팀을 찾고 계신지 한두 문장으로 소개해 주세요. 커피챗 요청자가 가장 먼저 읽는 곳입니다."
              rows={3}
              className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
          </div>
        ) : (
          <button
            onClick={() => isEditable && setEditingBio(true)}
            className="w-full text-left group flex items-start gap-2"
            disabled={!isEditable}
          >
            <p className="flex-1 text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
              {bio || (isEditable ? '간단한 자기소개를 작성해주세요' : '')}
            </p>
            {isEditable && (
              <Pencil size={13} className="shrink-0 mt-0.5 text-txt-disabled group-hover:text-txt-secondary transition-colors" />
            )}
          </button>
        )}
      </div>

      {/* 관심 태그 */}
      {isEditable && (
        <InterestTags profile={profile} />
      )}

      {/* 저장 바 */}
      {isEditable && hasPendingChanges && (
        <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
          <p className="text-xs text-txt-tertiary">변경된 내용이 있습니다</p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
              저장
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/* ── 관심 태그 인라인 편집 ── */

function InterestTags({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const [showEditor, setShowEditor] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const tags = (profile.interest_tags as string[] | null) ?? []

  const removeTag = (tag: string) => {
    updateProfile.mutate({ interest_tags: tags.filter(t => t !== tag) })
  }

  const addTag = () => {
    const t = customTag.trim()
    if (!t || tags.includes(t)) { setCustomTag(''); return }
    updateProfile.mutate({ interest_tags: [...tags, t] })
    setCustomTag('')
  }

  if (tags.length === 0 && !showEditor) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-txt-tertiary hover:text-brand transition-colors"
        >
          <Plus size={11} />
          관심 분야 추가
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-bg text-brand text-xs font-medium"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:text-brand-hover transition-colors"
            aria-label="태그 제거"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {showEditor ? (
        <div className="inline-flex items-center gap-1">
          <input
            value={customTag}
            onChange={e => setCustomTag(e.target.value.slice(0, 20))}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag() }
              if (e.key === 'Escape') { setShowEditor(false); setCustomTag('') }
            }}
            placeholder="추가"
            autoFocus
            className="w-20 px-2 py-1 text-xs bg-surface-sunken border border-border rounded-full outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            onClick={() => { setShowEditor(false); setCustomTag('') }}
            className="text-txt-disabled hover:text-txt-tertiary transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-sunken text-txt-tertiary text-xs font-medium hover:bg-border-subtle transition-colors"
        >
          <Plus size={10} />
          추가
        </button>
      )}
    </div>
  )
}
