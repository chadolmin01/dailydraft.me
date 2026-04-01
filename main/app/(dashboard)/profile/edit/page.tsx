'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Area } from 'react-easy-crop'

const Cropper = dynamic(() => import('react-easy-crop').then(m => m.default), { ssr: false }) as unknown as React.ComponentType<Partial<import('react-easy-crop').CropperProps>>
import {
  Save, Loader2, User, Briefcase, Mail, Plus, X,
  CheckSquare, Target, Camera, ImageIcon, Sparkles, Link, Github, Linkedin,
  Globe, ShieldCheck, ArrowLeft, Trash2, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { ComboBox } from '@/components/ui/ComboBox'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { usePortfolioItems, useCreatePortfolioItem, useDeletePortfolioItem } from '@/src/hooks/usePortfolioItems'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import { supabase } from '@/src/lib/supabase/client'
import { CATEGORICAL_TO_SCORE, SCORE_TO_CATEGORICAL, CATEGORICAL_LABELS } from '@/src/lib/onboarding/constants'

/* ─── Constants ─── */
const POSITION_OPTIONS = [
  '프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자', 'iOS 개발자', 'Android 개발자',
  'PM/PO', 'UI/UX 디자이너', '데이터 분석가', 'AI/ML 엔지니어', '마케터', '기획자',
]
const INTEREST_OPTIONS = [
  'AI/ML', 'SaaS', '에듀테크', '핀테크', '헬스케어', '소셜', '커머스',
  '콘텐츠', '게임', '블록체인', '모빌리티', '부동산', 'HR테크', '푸드테크',
]
const SITUATION_OPTIONS = [
  { value: 'has_project', label: '프로젝트 진행 중 — 팀원을 찾고 있어요' },
  { value: 'want_to_join', label: '팀 합류 희망 — 좋은 프로젝트에 참여하고 싶어요' },
  { value: 'solo', label: '함께 시작할 팀원 탐색 중' },
  { value: 'exploring', label: '탐색 중 — 아직 구체적인 계획은 없어요' },
]
const AFFILIATION_OPTIONS = [
  { value: 'student', label: '대학생', orgLabel: '대학교', roleLabel: '전공', orgPlaceholder: '예: 서울대학교', rolePlaceholder: '예: 컴퓨터공학과' },
  { value: 'graduate', label: '졸업생', orgLabel: '출신 대학', roleLabel: '전공', orgPlaceholder: '예: 서울대학교', rolePlaceholder: '예: 컴퓨터공학과' },
  { value: 'professional', label: '현직자', orgLabel: '회사', roleLabel: '직무 / 부서', orgPlaceholder: '예: 네이버', rolePlaceholder: '예: 프론트엔드 개발' },
  { value: 'freelancer', label: '프리랜서', orgLabel: '소속 (선택)', roleLabel: '분야', orgPlaceholder: '예: 스튜디오명', rolePlaceholder: '예: 웹 개발' },
  { value: 'other', label: '기타', orgLabel: '소속 (선택)', roleLabel: '분야 (선택)', orgPlaceholder: '예: 소속명', rolePlaceholder: '예: 분야' },
]
const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python',
  'Flutter', 'Swift', 'Kotlin', 'Java', 'Go',
  'Figma', 'SQL', 'AWS', 'Docker', 'Git',
]
const SKILL_LEVELS = ['초급', '중급', '고급']

type TabId = 'info' | 'ai'

export default function ProfileEditPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [cropImage, setCropImage] = useState<string | null>(null)
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const [nickname, setNickname] = useState('')
  const [position, setPosition] = useState('')
  const [affiliationType, setAffiliationType] = useState('student')
  const [university, setUniversity] = useState('')
  const [major, setMajor] = useState('')
  const [vision, setVision] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [location, setLocation] = useState('')
  const [currentSituation, setCurrentSituation] = useState('')
  const [interestTags, setInterestTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [skills, setSkills] = useState<Array<{ name: string; level: string }>>([])
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState('중급')
  const [personality, setPersonality] = useState<Record<string, number>>({ risk: 5, time: 5, communication: 5, decision: 5 })
  const [workStyle, setWorkStyle] = useState<Record<string, number>>({ collaboration: 5, planning: 5, perfectionism: 5 })
  const [workStyleTraits, setWorkStyleTraits] = useState<Record<string, string>>({})
  const [teamRole, setTeamRole] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [teamAtmosphere, setTeamAtmosphere] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [preferOnline, setPreferOnline] = useState(false)
  const [goals, setGoals] = useState<string[]>([])
  const [strengths, setStrengths] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  // Portfolio items
  const { data: portfolioItems = [] } = usePortfolioItems()
  const createPortfolio = useCreatePortfolioItem()
  const deletePortfolio = useDeletePortfolioItem()
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('')
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('')
  const [newPortfolioLink, setNewPortfolioLink] = useState('')
  const [newPortfolioImage, setNewPortfolioImage] = useState('')
  const portfolioImageInputRef = useRef<HTMLInputElement>(null)
  const [uniVerified, setUniVerified] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyStep, setVerifyStep] = useState<'idle' | 'sent' | 'verifying'>('idle')
  const [verifyError, setVerifyError] = useState('')
  const [verifySending, setVerifySending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')

  /* ─── Hydrate ─── */
  useEffect(() => {
    if (!profile) return
    setNickname(profile.nickname || '')
    setPosition(profile.desired_position || '')
    setAffiliationType(profile.affiliation_type || 'student')
    setUniversity(profile.university || '')
    setMajor(profile.major || '')
    setBio((profile as Record<string, unknown>).bio as string || '')
    setVision(profile.vision_summary || '')
    setContactEmail(profile.contact_email || '')
    setPortfolioUrl(profile.portfolio_url || '')
    setLinkedinUrl(profile.linkedin_url || '')
    setGithubUrl(profile.github_url || '')
    setLocation(profile.location || '')
    setCurrentSituation(profile.current_situation || '')
    setInterestTags(profile.interest_tags || [])
    setSkills((profile.skills as Array<{ name: string; level: string }>) || [])
    const p = profile.personality as Record<string, number> | null
    if (p) setPersonality({ risk: p.risk || 5, time: p.time || 5, communication: p.communication || 5, decision: p.decision || 5 })
    if (profile.vision_summary) {
      try {
        const v = JSON.parse(profile.vision_summary)
        const ws = v.work_style
        if (ws) setWorkStyle({ collaboration: ws.collaboration || 5, planning: ws.planning || 5, perfectionism: ws.perfectionism || 5 })
        if (v.team_preference) { setTeamRole(v.team_preference.role || ''); setTeamSize(v.team_preference.preferred_size || ''); setTeamAtmosphere(v.team_preference.atmosphere || '') }
        if (v.availability) { setHoursPerWeek(v.availability.hours_per_week?.toString() || ''); setPreferOnline(v.availability.prefer_online || false) }
        setGoals(v.goals || [])
        setStrengths(v.strengths || [])
        // Read categorical traits
        const traits: Record<string, string> = {}
        if (v.traits?.collaboration_style) traits.collaboration_style = v.traits.collaboration_style
        else if (ws?.collaboration) traits.collaboration_style = SCORE_TO_CATEGORICAL.collaboration_style(ws.collaboration)
        if (v.traits?.decision_style) traits.decision_style = v.traits.decision_style
        else if (p?.decision) traits.decision_style = SCORE_TO_CATEGORICAL.decision_style(p.decision)
        if (v.traits?.planning_style) traits.planning_style = v.traits.planning_style
        else if (ws?.planning) traits.planning_style = SCORE_TO_CATEGORICAL.planning_style(ws.planning)
        if (v.traits?.quality_style) traits.quality_style = v.traits.quality_style
        else if (ws?.perfectionism) traits.quality_style = SCORE_TO_CATEGORICAL.quality_style(ws.perfectionism)
        setWorkStyleTraits(traits)
      } catch { /* not JSON */ }
    }
    fetch('/api/profile/verify-university').then(r => r.json()).then(d => { if (d.is_verified) setUniVerified(true) }).catch(() => {})
  }, [profile])

  /* ─── File / Crop ─── */
  const handleFileSelect = (file: File, type: 'avatar' | 'cover') => {
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드 가능합니다'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('5MB 이하 파일만 업로드 가능합니다'); return }
    const reader = new FileReader()
    reader.onload = () => { setCropImage(reader.result as string); setCropType(type); setCrop({ x: 0, y: 0 }); setZoom(1) }
    reader.readAsDataURL(file)
  }
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => { setCroppedArea(croppedPixels) }, [])
  const getCroppedBlob = (imageSrc: string, area: Area): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = area.width; canvas.height = area.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas error')); return }
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
        canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error('Blob conversion failed')) }, 'image/jpeg', 0.9)
      }
      img.onerror = reject
      img.src = imageSrc
    })
  }
  const handleCropConfirm = async () => {
    if (!user?.id || !cropImage || !croppedArea) return
    const isAvatar = cropType === 'avatar'
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true)
    setCropImage(null)
    try {
      const blob = await getCroppedBlob(cropImage, croppedArea)
      const path = `${user.id}/${cropType}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('profile-images').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(path)
      await updateProfile.mutateAsync(isAvatar ? { avatar_url: publicUrl } : { cover_image_url: publicUrl })
      toast.success('이미지가 업로드되었습니다')
    } catch (err) {
      console.error(`Failed to upload ${cropType}:`, err)
      toast.error('이미지 업로드에 실패했습니다')
    } finally { isAvatar ? setUploadingAvatar(false) : setUploadingCover(false) }
  }

  /* ─── Form helpers ─── */
  const toggleTag = (tag: string) => setInterestTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const addCustomTag = () => { const tag = customTag.trim(); if (tag && !interestTags.includes(tag)) { setInterestTags(prev => [...prev, tag]); setCustomTag('') } }
  const addSkill = (name?: string) => { const n = (name || newSkillName).trim(); if (n && !skills.some(s => s.name === n)) { setSkills(prev => [...prev, { name: n, level: newSkillLevel }]); if (!name) setNewSkillName('') } }
  const removeSkill = (name: string) => setSkills(prev => prev.filter(s => s.name !== name))
  const updateSkillLevel = (name: string, level: string) => setSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s))

  const handleSave = async () => {
    setSaveError(null); setSaved(false)
    try {
      // Convert categorical → numeric scores
      const finalWorkStyle = { ...workStyle }
      const finalPersonality = { ...personality }
      if (workStyleTraits.collaboration_style) { const s = CATEGORICAL_TO_SCORE.collaboration_style[workStyleTraits.collaboration_style]; if (s != null) finalWorkStyle.collaboration = s }
      if (workStyleTraits.planning_style) { const s = CATEGORICAL_TO_SCORE.planning_style[workStyleTraits.planning_style]; if (s != null) finalWorkStyle.planning = s }
      if (workStyleTraits.quality_style) { const s = CATEGORICAL_TO_SCORE.quality_style[workStyleTraits.quality_style]; if (s != null) finalWorkStyle.perfectionism = s }
      if (workStyleTraits.decision_style) { const s = CATEGORICAL_TO_SCORE.decision_style[workStyleTraits.decision_style]; if (s != null) finalPersonality.decision = s }

      let existingVision: Record<string, unknown> = {}
      if (profile?.vision_summary) { try { existingVision = JSON.parse(profile.vision_summary) } catch { /* */ } }
      const visionJson = JSON.stringify({
        ...existingVision, work_style: finalWorkStyle,
        team_preference: { role: teamRole || undefined, preferred_size: teamSize || undefined, atmosphere: teamAtmosphere || undefined },
        availability: { hours_per_week: hoursPerWeek ? parseInt(hoursPerWeek) : null, prefer_online: preferOnline },
        goals, strengths,
        traits: { ...((existingVision as Record<string, unknown>).traits || {}), ...workStyleTraits },
      })
      await updateProfile.mutateAsync({
        nickname: nickname.trim() || undefined, desired_position: position.trim() || undefined,
        affiliation_type: affiliationType || undefined, university: university.trim() || undefined,
        major: major.trim() || undefined, vision_summary: visionJson,
        bio: bio.trim() || undefined,
        contact_email: contactEmail.trim() || undefined, portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined, github_url: githubUrl.trim() || undefined,
        location: location.trim() || undefined, current_situation: currentSituation || undefined,
        interest_tags: interestTags.length > 0 ? interestTags : undefined,
        skills: skills.length > 0 ? skills : undefined, personality: finalPersonality,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      toast.success('프로필이 저장되었습니다')
    } catch { setSaveError('프로필 저장에 실패했습니다.'); toast.error('프로필 저장에 실패했습니다') }
  }

  const inputClass = 'w-full px-4 py-3 text-base sm:text-sm border border-border bg-transparent focus:outline-none focus:border-border transition-colors'
  const chipActive = 'bg-surface-inverse text-txt-inverse border-surface-inverse'
  const chipDefault = 'bg-surface-card text-txt-secondary border-border hover:border-border'
  const fieldLabel = 'block text-xs font-medium text-txt-secondary mb-1.5'

  const affConfig = AFFILIATION_OPTIONS.find(a => a.value === affiliationType) || AFFILIATION_OPTIONS[0]
  const showUnivCombo = affiliationType === 'student' || affiliationType === 'graduate'

  return (
    <>
      <div className="flex-1 bg-surface-bg overflow-y-auto">

        {/* ─── Header ─── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/profile')} className="hidden sm:flex p-2 border border-border text-txt-secondary hover:bg-surface-sunken transition-colors">
                <ArrowLeft size={14} />
              </button>
              <h1 className="text-lg font-bold text-txt-primary">프로필 편집</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-surface-inverse text-txt-inverse text-[10px] font-medium border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.97]"
            >
              {updateProfile.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, 'avatar'); e.target.value = '' }} />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, 'cover'); e.target.value = '' }} />

        {/* ─── Error Banner ─── */}
        {saveError && (
          <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-4">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-status-danger-bg border border-status-danger-text/20 text-status-danger-text text-xs">
              <span>{saveError}</span>
              <button onClick={() => setSaveError(null)} className="ml-auto hover:opacity-70"><X size={12} /></button>
            </div>
          </div>
        )}

        {/* ─── Tab bar ─── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-6">
          <div className="flex gap-0 border-b-2 border-border">
            {([
              { id: 'info' as TabId, label: '프로필 정보', icon: User },
              { id: 'ai' as TabId, label: 'AI 분석', icon: Sparkles },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                  activeTab === id
                    ? 'border-surface-inverse text-txt-primary'
                    : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6">

          {/* ═══ 프로필 정보 탭 ═══ */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 기본 정보 */}
              <Card title="기본 정보">
                <div className="space-y-4">
                  <div>
                    <label className={fieldLabel}>닉네임</label>
                    <div className="relative">
                      <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 7))} maxLength={7} placeholder="닉네임" className={inputClass} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-txt-disabled">{nickname.length}/7</span>
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>자기소개</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} placeholder="자신을 소개해주세요. 어떤 일을 하고, 어떤 프로젝트에 관심이 있는지 자유롭게 작성하세요." rows={4} className={`${inputClass} resize-none`} />
                    <p className="text-[10px] font-mono text-txt-tertiary mt-1 text-right">{bio.length}/500</p>
                  </div>
                </div>
              </Card>

              {/* 프로필 이미지 */}
              <Card title="프로필 이미지">
                <div className="flex items-center gap-4">
                  <button onClick={() => avatarInputRef.current?.click()} className="relative group w-16 h-16 bg-surface-sunken rounded-xl border border-border overflow-hidden shrink-0">
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-txt-tertiary">{profile?.nickname?.slice(0, 2).toUpperCase() || 'U'}</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                      <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                  </button>
                  <button onClick={() => coverInputRef.current?.click()} className="relative group flex-1 h-16 bg-surface-sunken rounded-xl border border-border overflow-hidden">
                    {profile?.cover_image_url ? (
                      <Image src={profile.cover_image_url} alt="cover" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] font-mono text-txt-tertiary flex items-center gap-1.5"><ImageIcon size={12} /> 커버 이미지</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                      <span className="text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Camera size={11} /> 변경</span>
                    </div>
                    {uploadingCover && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                  </button>
                </div>
              </Card>

              {/* 현재 상황 */}
              <Card title="현재 상황">
                <div className="space-y-2">
                  {SITUATION_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setCurrentSituation(currentSituation === opt.value ? '' : opt.value)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium border transition-colors ${currentSituation === opt.value ? chipActive : chipDefault}`}
                    >{opt.label}</button>
                  ))}
                </div>
              </Card>

              {/* 소속 */}
              <Card title="소속">
                <div className="space-y-4">
                  <div>
                    <label className={fieldLabel}>소속 유형</label>
                    <div className="flex flex-wrap gap-2">
                      {AFFILIATION_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setAffiliationType(opt.value)}
                          className={`px-3 py-2 text-xs font-medium border transition-colors ${affiliationType === opt.value ? chipActive : chipDefault}`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>{affConfig.orgLabel}</label>
                      {showUnivCombo ? <ComboBox value={university} onChange={setUniversity} options={UNIVERSITY_LIST} placeholder={affConfig.orgPlaceholder} />
                        : <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={affConfig.orgPlaceholder} maxLength={50} className={inputClass} />}
                    </div>
                    <div>
                      <label className={fieldLabel}>{affConfig.roleLabel}</label>
                      <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} placeholder={affConfig.rolePlaceholder} maxLength={50} className={inputClass} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* 포지션 */}
              <Card title="포지션">
                <div className="flex flex-wrap gap-2">
                  {POSITION_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setPosition(opt)}
                      className={`px-3 py-2 text-xs font-medium border transition-colors ${position === opt ? chipActive : chipDefault}`}
                    >{opt}</button>
                  ))}
                </div>
              </Card>

              {/* 활동 지역 */}
              <Card title="활동 지역">
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((loc) => (
                    <button key={loc} type="button" onClick={() => setLocation(location === loc ? '' : loc)}
                      className={`px-3 py-2 text-xs font-medium border transition-colors ${location === loc ? chipActive : chipDefault}`}
                    >{loc}</button>
                  ))}
                </div>
              </Card>

              {/* 기술 스택 */}
              <Card title="기술 스택">
                <div className="flex flex-wrap gap-2 mb-4">
                  {SKILL_SUGGESTIONS.map((skill) => {
                    const selected = skills.some(sk => sk.name === skill)
                    return (
                      <button key={skill} type="button" onClick={() => selected ? removeSkill(skill) : addSkill(skill)}
                        className={`px-3 py-2 text-xs font-medium border transition-colors ${selected ? chipActive : chipDefault}`}
                      >{skill}</button>
                    )
                  })}
                </div>
                {skills.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {skills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-3 px-3 py-2 border border-border">
                        <span className="flex-1 text-sm text-txt-primary font-medium">{skill.name}</span>
                        <div className="flex items-center gap-1">
                          {SKILL_LEVELS.map((level) => (
                            <button key={level} type="button" onClick={() => updateSkillLevel(skill.name, level)}
                              className={`px-2 py-1 text-[10px] font-medium transition-colors ${skill.level === level ? 'bg-surface-inverse text-txt-inverse' : 'text-txt-tertiary hover:text-txt-secondary'}`}
                            >{level}</button>
                          ))}
                        </div>
                        <button onClick={() => removeSkill(skill.name)} className="p-1 text-txt-tertiary hover:text-txt-secondary transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="스킬 직접 입력" maxLength={30} className={`flex-1 ${inputClass}`} />
                  <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className="px-3 py-3 text-xs border border-border bg-transparent text-txt-secondary focus:outline-none focus:border-border transition-colors">
                    {SKILL_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <button type="button" onClick={() => addSkill()} className="px-4 py-3 border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"><Plus size={16} /></button>
                </div>
              </Card>

              {/* 관심 분야 */}
              <Card title="관심 분야">
                <div className="flex flex-wrap gap-2 mb-4">
                  {INTEREST_OPTIONS.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 text-xs font-medium border transition-colors ${interestTags.includes(tag) ? chipActive : chipDefault}`}
                    >{tag}</button>
                  ))}
                </div>
                {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).map((tag) => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-surface-inverse text-txt-inverse">
                        {tag} <button onClick={() => toggleTag(tag)} className="hover:opacity-70"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())} placeholder="직접 입력" maxLength={20} className={`flex-1 ${inputClass}`} />
                  <button type="button" onClick={addCustomTag} className="px-4 py-3 border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"><Plus size={16} /></button>
                </div>
              </Card>

              {/* 연락처 */}
              <Card title="연락처">
                <div>
                  <label className={fieldLabel}>이메일</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={user?.email || 'email@example.com'} inputMode="email" autoComplete="email" className={inputClass} />
                  <p className="text-xs text-txt-tertiary mt-2">커피챗 수락 시 상대방에게 공개됩니다</p>
                </div>
              </Card>

              {/* 소셜 링크 */}
              <Card title="소셜 링크">
                <div className="space-y-4">
                  <div>
                    <label className={`${fieldLabel} flex items-center gap-2`}><Globe size={14} /> 포트폴리오</label>
                    <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://myportfolio.com" inputMode="url" className={inputClass} />
                  </div>
                  <div>
                    <label className={`${fieldLabel} flex items-center gap-2`}><Github size={14} /> GitHub</label>
                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" inputMode="url" className={inputClass} />
                  </div>
                  <div>
                    <label className={`${fieldLabel} flex items-center gap-2`}><Linkedin size={14} /> LinkedIn</label>
                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" inputMode="url" className={inputClass} />
                  </div>
                </div>
              </Card>

              {/* 포트폴리오 */}
              <Card title="포트폴리오">
                {portfolioItems.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2 border border-border">
                        {item.image_url && (
                          <div className="w-10 h-10 bg-surface-sunken rounded-xl border border-border overflow-hidden shrink-0">
                            <Image src={item.image_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-txt-primary font-medium truncate">{item.title}</p>
                          {item.description && <p className="text-[10px] text-txt-tertiary truncate">{item.description}</p>}
                        </div>
                        {item.link_url && (
                          <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="p-1 text-txt-tertiary hover:text-txt-secondary"><ExternalLink size={14} /></a>
                        )}
                        <button onClick={() => { if (confirm('이 항목을 삭제하시겠습니까?')) deletePortfolio.mutate(item.id, { onSuccess: () => toast.success('포트폴리오 항목이 삭제되었습니다'), onError: () => toast.error('삭제에 실패했어요') }) }} className="p-1 text-txt-tertiary hover:text-status-danger-text transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {showPortfolioForm ? (
                  <div className="space-y-3 p-3 border border-border bg-surface-sunken">
                    <div>
                      <label className={fieldLabel}>제목 *</label>
                      <input type="text" value={newPortfolioTitle} onChange={(e) => setNewPortfolioTitle(e.target.value)} maxLength={100} placeholder="프로젝트 이름" className={inputClass} />
                    </div>
                    <div>
                      <label className={fieldLabel}>설명</label>
                      <input type="text" value={newPortfolioDesc} onChange={(e) => setNewPortfolioDesc(e.target.value)} maxLength={200} placeholder="간단한 설명" className={inputClass} />
                    </div>
                    <div>
                      <label className={fieldLabel}>링크</label>
                      <input type="url" value={newPortfolioLink} onChange={(e) => setNewPortfolioLink(e.target.value)} placeholder="https://..." inputMode="url" className={inputClass} />
                    </div>
                    <div>
                      <label className={fieldLabel}>이미지</label>
                      <input ref={portfolioImageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f || !user?.id) return
                        if (f.size > 5 * 1024 * 1024) { toast.error('5MB 이하 파일만 업로드 가능합니다'); return }
                        const path = `${user.id}/portfolio-${Date.now()}.jpg`
                        const { error: uploadError } = await supabase.storage.from('profile-images').upload(path, f, { upsert: true, contentType: f.type })
                        if (uploadError) { toast.error('이미지 업로드 실패'); return }
                        const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(path)
                        setNewPortfolioImage(publicUrl)
                        toast.success('이미지가 업로드되었습니다')
                        e.target.value = ''
                      }} />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => portfolioImageInputRef.current?.click()} className="px-3 py-2 text-xs border border-border text-txt-secondary hover:bg-surface-sunken transition-colors flex items-center gap-1.5"><Camera size={12} /> 이미지 선택</button>
                        {newPortfolioImage && <span className="text-[10px] font-mono text-indicator-online">업로드 완료</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={async () => {
                        if (!newPortfolioTitle.trim()) { toast.error('제목을 입력해주세요'); return }
                        try {
                          await createPortfolio.mutateAsync({
                            title: newPortfolioTitle.trim(),
                            description: newPortfolioDesc.trim() || undefined,
                            link_url: newPortfolioLink.trim() || undefined,
                            image_url: newPortfolioImage || undefined,
                            display_order: portfolioItems.length,
                          })
                          setNewPortfolioTitle(''); setNewPortfolioDesc(''); setNewPortfolioLink(''); setNewPortfolioImage('')
                          setShowPortfolioForm(false)
                          toast.success('포트폴리오 항목이 추가되었습니다')
                        } catch { toast.error('추가에 실패했습니다') }
                      }} disabled={createPortfolio.isPending} className="px-4 py-2 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-colors">
                        {createPortfolio.isPending ? '추가 중...' : '추가'}
                      </button>
                      <button type="button" onClick={() => { setShowPortfolioForm(false); setNewPortfolioTitle(''); setNewPortfolioDesc(''); setNewPortfolioLink(''); setNewPortfolioImage('') }} className="px-4 py-2 text-xs border border-border text-txt-secondary hover:bg-surface-sunken transition-colors">취소</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowPortfolioForm(true)} className="w-full px-3 py-2.5 text-xs font-bold border border-border text-txt-secondary hover:border-border hover:bg-surface-sunken transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={14} /> 항목 추가
                  </button>
                )}
              </Card>

              {/* 대학 인증 */}
              {(affiliationType === 'student' || affiliationType === 'graduate') && (
                <Card title="대학 인증" icon={<ShieldCheck size={16} className={uniVerified ? 'text-indicator-online' : 'text-txt-tertiary'} />}>
                  {uniVerified ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-[10px] font-bold bg-indicator-online text-white">VERIFIED</span>
                      <span className="text-xs text-indicator-online">대학 인증이 완료되었습니다.</span>
                    </div>
                  ) : verifyStep === 'idle' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-txt-tertiary">대학 이메일(.ac.kr)로 인증하면 프로필에 인증 배지가 표시됩니다.</p>
                      <div className="flex gap-2">
                        <input type="email" value={verifyEmail} onChange={e => { setVerifyEmail(e.target.value); setVerifyError('') }} placeholder="university@snu.ac.kr" inputMode="email" autoComplete="email" className={`flex-1 ${inputClass}`} />
                        <button type="button" disabled={verifySending || !verifyEmail.trim()} onClick={async () => {
                          setVerifySending(true); setVerifyError('')
                          try {
                            const res = await fetch('/api/profile/verify-university', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', email: verifyEmail.trim() }) })
                            const data = await res.json(); if (!res.ok) { setVerifyError(data.error); return }
                            setVerifyStep('sent')
                            toast.success('인증 코드가 발송되었습니다')
                          } catch { setVerifyError('요청에 실패했습니다') } finally { setVerifySending(false) }
                        }} className="px-4 py-3 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-colors">{verifySending ? '전송 중...' : '인증 코드 전송'}</button>
                      </div>
                      {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-txt-tertiary"><strong>{verifyEmail}</strong>로 발송된 6자리 코드를 입력하세요.</p>
                      <div className="flex gap-2">
                        <input type="text" value={verifyCode} onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError('') }} placeholder="000000" maxLength={6} className="w-36 px-4 py-3 text-base sm:text-sm font-mono text-center tracking-widest border border-border bg-transparent focus:outline-none focus:border-border transition-colors" />
                        <button type="button" disabled={verifySending || verifyCode.length !== 6} onClick={async () => {
                          setVerifySending(true); setVerifyError('')
                          try {
                            const res = await fetch('/api/profile/verify-university', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', code: verifyCode }) })
                            const data = await res.json(); if (!res.ok) { setVerifyError(data.error); return }
                            setUniVerified(true); toast.success('대학 인증이 완료되었습니다!')
                          } catch { setVerifyError('요청에 실패했습니다') } finally { setVerifySending(false) }
                        }} className="px-4 py-3 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-colors">{verifySending ? '확인 중...' : '인증 확인'}</button>
                        <button type="button" onClick={() => { setVerifyStep('idle'); setVerifyCode(''); setVerifyError('') }} className="px-3 py-3 text-xs text-txt-tertiary hover:text-txt-primary transition-colors">재전송</button>
                      </div>
                      {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ═══ AI 분석 탭 ═══ */}
          {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between -mb-2">
                    <p className="text-xs text-txt-tertiary">온보딩 AI 대화에서 분석된 데이터입니다. 직접 수정할 수 있어요.</p>
                    <button
                      type="button"
                      onClick={() => router.push('/onboarding?mode=redo-chat')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium border border-border text-txt-secondary hover:bg-surface-sunken hover:border-border transition-colors shrink-0"
                    >
                      <Sparkles size={12} />
                      AI 온보딩 다시하기
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="성향 점수">
                      <div className="space-y-5">
                        {/* decision — categorical */}
                        <div>
                          <span className="text-xs font-medium text-txt-secondary block mb-2">의사결정 스타일</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(CATEGORICAL_LABELS.decision_style).map(([id, lbl]) => (
                              <button key={id} type="button" onClick={() => setWorkStyleTraits(prev => ({ ...prev, decision_style: id }))}
                                className={`px-3 py-2 text-xs font-medium border transition-colors ${workStyleTraits.decision_style === id ? chipActive : chipDefault}`}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                        {/* communication — 1-5 spectrum */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-txt-secondary">소통 선호</span>
                            <span className="text-xs font-mono text-txt-tertiary">{Math.round(personality.communication / 2)}/5</span>
                          </div>
                          <input type="range" min={1} max={5} step={1} value={Math.round(personality.communication / 2)} onChange={e => setPersonality(p => ({ ...p, communication: parseInt(e.target.value) * 2 }))} className="w-full h-1.5 accent-brand cursor-pointer" />
                          <div className="flex justify-between mt-1"><span className="text-[9px] text-txt-tertiary font-mono">혼자 집중</span><span className="text-[9px] text-txt-tertiary font-mono">수시 소통</span></div>
                        </div>
                        {/* risk, time — 1-10 sliders */}
                        {[
                          { key: 'risk', label: '도전 성향', low: '안정 추구', high: '도전적' },
                          { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
                        ].map(item => (
                          <div key={item.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-txt-secondary">{item.label}</span>
                              <span className="text-xs font-mono text-txt-tertiary">{personality[item.key]}/10</span>
                            </div>
                            <input type="range" min={1} max={10} step={1} value={personality[item.key]} onChange={e => setPersonality(p => ({ ...p, [item.key]: parseInt(e.target.value) }))} className="w-full h-1.5 accent-brand cursor-pointer" />
                            <div className="flex justify-between mt-1"><span className="text-[9px] text-txt-tertiary font-mono">{item.low}</span><span className="text-[9px] text-txt-tertiary font-mono">{item.high}</span></div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="작업 스타일">
                      <div className="space-y-5">
                        {[
                          { traitKey: 'collaboration_style', label: '협업 스타일' },
                          { traitKey: 'planning_style', label: '작업 방식' },
                          { traitKey: 'quality_style', label: '품질 기준' },
                        ].map(item => (
                          <div key={item.traitKey}>
                            <span className="text-xs font-medium text-txt-secondary block mb-2">{item.label}</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(CATEGORICAL_LABELS[item.traitKey]).map(([id, lbl]) => (
                                <button key={id} type="button" onClick={() => setWorkStyleTraits(prev => ({ ...prev, [item.traitKey]: id }))}
                                  className={`px-3 py-2 text-xs font-medium border transition-colors ${workStyleTraits[item.traitKey] === id ? chipActive : chipDefault}`}>{lbl}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card title="팀 선호">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className={fieldLabel}>역할</label>
                        <div className="flex gap-2">
                          {['리더', '팔로워', '유연'].map(r => (
                            <button key={r} type="button" onClick={() => setTeamRole(r)} className={`flex-1 px-3 py-2 text-xs font-medium border transition-colors ${teamRole === r ? chipActive : chipDefault}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={fieldLabel}>선호 인원</label>
                        <div className="flex gap-2">
                          {['2-3명', '4-5명', '6명+'].map(s => (
                            <button key={s} type="button" onClick={() => setTeamSize(s)} className={`flex-1 px-3 py-2 text-xs font-medium border transition-colors ${teamSize === s ? chipActive : chipDefault}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={fieldLabel}>분위기</label>
                        <div className="flex gap-2">
                          {['실무형', '캐주얼', '균형'].map(a => (
                            <button key={a} type="button" onClick={() => setTeamAtmosphere(a)} className={`flex-1 px-3 py-2 text-xs font-medium border transition-colors ${teamAtmosphere === a ? chipActive : chipDefault}`}>{a}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="가용성">
                    <div className="flex items-center gap-6">
                      <div>
                        <label className={fieldLabel}>주당 투자 가능 시간</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} max={80} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} placeholder="예: 15" className="w-28 px-4 py-3 text-base sm:text-sm border border-border bg-transparent focus:outline-none focus:border-border transition-colors" />
                          <span className="text-xs text-txt-tertiary">시간</span>
                        </div>
                      </div>
                      <div className="pt-5">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={preferOnline} onChange={e => setPreferOnline(e.target.checked)} className="w-4 h-4 accent-brand" />
                          <span className="text-xs text-txt-secondary">비대면(온라인) 선호</span>
                        </label>
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="목표">
                      <TagEditor tags={goals} onChange={setGoals} suggestions={['포트폴리오', '창업', '학습', '수상', '네트워킹', '재미']} chipDefault={chipDefault} />
                    </Card>
                    <Card title="강점">
                      <TagEditor tags={strengths} onChange={setStrengths} suggestions={['기획력', '빠른 구현', '디자인 감각', '소통', '문제 해결', '리더십']} chipDefault={chipDefault} />
                    </Card>
                  </div>
                </div>
              )}

        </div>
      </div>

      {/* Crop modal */}
      {cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-surface-card rounded-xl border border-border shadow-lg w-full max-w-lg mx-4 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-border bg-surface-sunken">
              <span className="text-xs font-medium text-txt-secondary">{cropType === 'avatar' ? 'CROP AVATAR' : 'CROP COVER'}</span>
              <button onClick={() => setCropImage(null)} className="p-1 hover:bg-surface-card transition-colors"><X size={16} className="text-txt-tertiary" /></button>
            </div>
            <div className="relative w-full" style={{ height: cropType === 'avatar' ? 320 : 240 }}>
              <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={cropType === 'avatar' ? 1 : 3} cropShape={cropType === 'avatar' ? 'round' : 'rect'} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-[10px] font-mono text-txt-tertiary">ZOOM</span>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 h-1.5 accent-brand cursor-pointer" />
              <span className="text-[10px] font-mono text-txt-tertiary w-8 text-right">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t-2 border-border">
              <button onClick={() => setCropImage(null)} className="py-2.5 px-4 text-xs font-medium border border-border text-txt-secondary hover:border-border transition-colors">취소</button>
              <button onClick={handleCropConfirm} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-xs font-bold border border-surface-inverse hover:bg-surface-inverse/90 transition-all hover:opacity-90 active:scale-[0.97]">
                <Camera size={12} /> 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Card wrapper ─── */
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface-card rounded-xl border border-border shadow-md">
      <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-border bg-surface-sunken">
        {icon}
        <h3 className="text-[10px] font-medium text-txt-tertiary">{title}</h3>
      </div>
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  )
}

/* ─── Tag editor ─── */
function TagEditor({ tags, onChange, suggestions, chipDefault }: { tags: string[]; onChange: (t: string[]) => void; suggestions: string[]; chipDefault: string }) {
  const [input, setInput] = useState('')
  const add = (tag: string) => { if (tag && !tags.includes(tag)) onChange([...tags, tag]) }
  const remove = (tag: string) => onChange(tags.filter(t => t !== tag))
  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-surface-inverse text-txt-inverse">
              {tag} <button onClick={() => remove(tag)} className="hover:opacity-70"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestions.filter(s => !tags.includes(s)).map(s => (
          <button key={s} type="button" onClick={() => add(s)} className={`px-2.5 py-1.5 text-xs font-medium border transition-colors ${chipDefault}`}>+ {s}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input.trim()); setInput('') } }} placeholder="직접 입력" maxLength={20} className="flex-1 px-4 py-2.5 text-base sm:text-sm border border-border bg-transparent focus:outline-none focus:border-border transition-colors" />
        <button type="button" onClick={() => { add(input.trim()); setInput('') }} className="px-3 py-2.5 border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"><Plus size={14} /></button>
      </div>
    </div>
  )
}
