'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  Briefcase,
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
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
import { EditableField } from './EditableField'

/* ── ProfileHero ────────────────────────────────────────── */

interface ProfileHeroProps {
  profile: Profile
  email: string | undefined
  uniVerified: boolean
  strengths: string[]
  isEditable?: boolean
}

export function ProfileHero({ profile, email, uniVerified, strengths, isEditable = false }: ProfileHeroProps) {
  const bio = profile?.bio ?? null
  const coverUrl = profile?.cover_image_url
  const { user } = useAuth()
  const router = useRouter()
  const updateProfile = useUpdateProfile()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)

  const heroDefaults = useMemo(() => ({
    nickname: profile?.nickname || '',
    bio: bio || '',
    desired_position: profile?.desired_position || '',
    university: profile?.university || '',
    location: profile?.location || '',
    contact_email: profile?.contact_email || email || '',
  }), [profile, bio, email])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, heroDefaults, {
      onSuccess: () => toast.success('프로필이 저장되었습니다'),
      onError: () => toast.error('프로필 저장에 실패했습니다'),
    }
  )

  // Reset editingBio when profile updates
  useEffect(() => { setEditingBio(false) }, [profile])

  useEffect(() => {
    if (editingBio && bioRef.current) bioRef.current.focus()
  }, [editingBio])

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

  /* ── Avatar with upload overlay ── */
  const renderAvatar = (size: 'hero' | 'hero-cover') => {
    const sizeClass = size === 'hero-cover'
      ? 'w-14 h-14 sm:w-[72px] sm:h-[72px] border-2 border-surface-card bg-surface-card'
      : 'w-14 h-14 sm:w-[72px] sm:h-[72px] border border-border bg-brand-bg'
    const textClass = size === 'hero-cover' ? 'text-txt-primary' : 'text-brand'

    return (
      <div
        className={`relative ${sizeClass} flex items-center justify-center text-lg sm:text-xl font-bold ${textClass} shrink-0 shadow-sm overflow-hidden ${isEditable ? 'group/avatar cursor-pointer' : ''}`}
        onClick={isEditable ? () => avatarInputRef.current?.click() : undefined}
      >
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={72} height={72} className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <span>{cleanNickname(profile?.nickname || '').slice(0, 2).toUpperCase() || 'U'}</span>
        )}
        {isEditable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
            {avatarUploading ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <>
                <Camera size={14} className="text-white" />
                <span className="text-[0.5rem] font-bold text-white">{profile?.avatar_url ? '변경' : '추가'}</span>
              </>
            )}
          </div>
        )}
        {isEditable && (
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        )}
      </div>
    )
  }

  const infoItems = [
    { icon: Briefcase, label: 'POSITION', value: profile?.desired_position || '', field: 'desired_position', placeholder: '포지션' },
    { icon: Building2, label: 'SCHOOL', value: profile?.university || '', field: 'university', placeholder: '학교' },
    { icon: MapPin, label: 'LOCATION', value: profile?.location || '', field: 'location', placeholder: '위치' },
    { icon: Mail, label: 'CONTACT', value: profile?.contact_email || email || '', field: 'contact_email', placeholder: '이메일' },
  ]

  /* ── Save bar ── */
  const renderSaveBar = () => {
    if (!isEditable || !hasPendingChanges) return null
    return (
      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-txt-secondary border border-border hover:bg-surface-sunken transition-colors rounded-xl"
        >
          <X size={12} />
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 rounded-xl"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          저장
        </button>
      </div>
    )
  }

  /* ── Name block ── */
  const renderName = () => (
    <div className="flex items-center gap-2 flex-wrap">
      {isEditable ? (
        <h2 className="text-lg sm:text-xl font-bold text-txt-primary">
          <EditableField variant="inline"
            value={profile?.nickname || ''}
            draft={drafts.nickname}
            placeholder="이름"
            className="text-lg sm:text-xl font-bold"
            onEdit={editField('nickname')}
          />
        </h2>
      ) : (
        <h2 className="text-lg sm:text-xl font-bold text-txt-primary truncate">{cleanNickname(profile?.nickname || '') || 'User'}</h2>
      )}
      {uniVerified && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indicator-online/20 border border-indicator-online/40 text-indicator-online text-[0.5rem] font-mono font-bold shrink-0 rounded-full">
          <ShieldCheck size={8} /> V
        </span>
      )}
    </div>
  )

  /* ── Subtitle ── */
  const renderSubtitle = () => (
    <p className="text-xs sm:text-sm text-txt-primary/70 truncate">
      {isEditable ? (
        <EditableField variant="inline"
          value={profile?.desired_position || ''}
          draft={drafts.desired_position}
          placeholder="포지션 미설정"
          className="text-xs sm:text-sm"
          onEdit={editField('desired_position')}
        />
      ) : (
        <>{profile?.desired_position || '포지션 미설정'}</>
      )}
      {profile?.university && ` · ${profile.university}`}
    </p>
  )

  /* ── Bio ── */
  const renderBio = (marginClass = 'mb-4') => {
    const bioValue = drafts.bio ?? bio ?? ''
    const isChanged = drafts.bio !== undefined && drafts.bio !== (bio || '')

    if (isEditable) {
      // Editing mode — textarea
      if (editingBio) {
        return (
          <div className={marginClass}>
            <textarea
              ref={bioRef}
              value={bioValue}
              onChange={(e) => editField('bio')(e.target.value)}
              onBlur={() => setEditingBio(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingBio(false) }}
              placeholder="자기소개를 입력하세요"
              rows={3}
              className="bg-surface-bg border border-border rounded-xl outline-none w-full px-3 py-2 resize-none focus:border-brand transition-colors text-base sm:text-sm text-txt-secondary leading-relaxed"
            />
          </div>
        )
      }

      // Has content — show text with pencil
      if (bioValue) {
        return (
          <div className={marginClass}>
            <span
              className="group/edit inline-flex items-start gap-1.5 cursor-pointer"
              onClick={() => setEditingBio(true)}
              title="클릭하여 수정"
            >
              <span className={`text-sm leading-relaxed ${isChanged ? 'text-brand' : 'text-txt-primary/80'}`}>
                {bioValue}
              </span>
              <Pencil size={9} className="opacity-0 group-hover/edit:opacity-40 transition-opacity shrink-0 mt-1" />
            </span>
          </div>
        )
      }

      // Empty — prominent empty state
      return (
        <div
          className={`${marginClass} border border-border p-5 rounded-xl cursor-pointer hover:border-brand/40 hover:bg-brand-bg/30 transition-colors group/bio`}
          onClick={() => setEditingBio(true)}
        >
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Pencil size={16} className="text-txt-disabled group-hover/bio:text-brand transition-colors" />
            <p className="text-sm font-medium text-txt-tertiary group-hover/bio:text-txt-primary transition-colors">자기소개를 작성해보세요</p>
            <p className="text-[10px] text-txt-disabled">나를 소개하는 한 줄을 남겨보세요</p>
          </div>
        </div>
      )
    }

    // Not editable
    if (bio) return <p className={`text-sm text-txt-primary/80 leading-relaxed ${marginClass}`}>{bio}</p>
    return null
  }

  /* ── Stats (views + likes) ── */
  const renderStats = () => {
    const views = profile?.profile_views ?? 0
    const likes = profile?.interest_count ?? 0
    return (
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs font-mono text-txt-secondary">
          <Eye size={13} className="text-txt-tertiary" />
          <span className="font-bold text-txt-primary">{views}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono text-txt-secondary">
          <Heart size={13} className={likes > 0 ? 'text-rose-400 fill-rose-400' : 'text-txt-tertiary'} />
          <span className="font-bold text-txt-primary">{likes}</span>
        </span>
      </div>
    )
  }

  /* ── Info grid ── */
  const renderInfoGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-border">
      {infoItems.map((item) => (
        <div key={item.label} className="flex items-start gap-2">
          <item.icon size={12} className="text-txt-tertiary mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.5rem] text-txt-tertiary">{item.label}</p>
            {isEditable ? (
              <EditableField variant="inline"
                value={item.value}
                draft={drafts[item.field]}
                placeholder={item.placeholder}
                className="text-xs font-medium text-txt-primary"
                onEdit={editField(item.field)}
              />
            ) : (
              <p className="text-xs font-medium text-txt-primary truncate">{item.value || '미설정'}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  /* ── Tags + Strengths ── */
  const renderTags = () => {
    if (!((profile?.interest_tags && profile.interest_tags.length > 0) || strengths.length > 0)) return null
    return (
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        {profile?.interest_tags && profile.interest_tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[0.5rem] text-txt-tertiary self-center mr-1">TAGS</span>
            {profile.interest_tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-white text-txt-primary border border-border px-2 py-0.5 font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {strengths.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[0.5rem] text-txt-tertiary self-center mr-1 flex items-center gap-1"><Sparkles size={9} /> STRENGTHS</span>
            {strengths.map((s, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-indicator-online/20 text-indicator-online border border-indicator-online/30 px-2 py-0.5 font-medium rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Starter guide restart (top-right micro button) ── */
  const renderGuideRestart = () => {
    if (!isEditable) return null
    return (
      <div className="absolute top-3 right-3 z-10 group/guide">
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
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-txt-tertiary hover:text-txt-primary bg-surface-card/80 backdrop-blur-sm border border-border rounded-lg transition-colors"
          >
            <RotateCcw size={10} />
            <span className="hidden sm:inline">가이드</span>
          </button>
          <span className="absolute top-[calc(100%+6px)] right-0 px-2.5 py-1.5 text-[10px] font-medium bg-surface-inverse text-txt-inverse rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/guide:opacity-100 transition-opacity">
            시작 가이드 다시 보기
          </span>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════ */
  /* Variant A: with cover image                            */
  /* ════════════════════════════════════════════════════════ */
  if (coverUrl) {
    return (
      <div className="relative group bg-surface-card text-txt-primary mb-6 border border-border shadow-md overflow-hidden rounded-2xl">
        {renderGuideRestart()}

        {/* Cover image */}
        <div className="relative h-32 sm:h-40 lg:h-48">
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 900px"
            className="object-cover"
            quality={90}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>

        {/* Content below cover */}
        <div className="relative z-10 -mt-8 sm:-mt-10 px-5 pb-5">
          <div className="flex items-end gap-3 sm:gap-4 mb-4">
            {renderAvatar('hero-cover')}
            <div className="flex-1 min-w-0 pb-0.5">
              {renderName()}
              {renderSubtitle()}
              {profile?.current_situation && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[0.5rem] font-mono font-bold bg-brand/10 text-brand border border-brand/30 rounded-full">
                  <Target size={8} /> {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                </span>
              )}
              {renderStats()}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            {renderBio('')}
          </div>

          <div className="mt-4">
            {renderInfoGrid()}
          </div>

          {renderTags()}
          {renderSaveBar()}
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════ */
  /* Variant B: no cover image                              */
  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="relative group bg-surface-card text-txt-primary p-5 pb-6 mb-6 border border-border shadow-md rounded-2xl">
      {renderGuideRestart()}

      <div className="flex items-start gap-4 mb-4">
        {renderAvatar('hero')}
        <div className="flex-1 min-w-0 pt-1">
          {renderName()}
          {renderSubtitle()}
          {profile?.current_situation && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[0.5rem] font-mono font-bold bg-brand/10 text-brand border border-brand/30 rounded-full">
              <Target size={8} /> {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
            </span>
          )}
          {renderStats()}
        </div>
      </div>

      {renderBio()}
      {renderInfoGrid()}
      {renderTags()}
      {renderSaveBar()}
    </div>
  )
}
