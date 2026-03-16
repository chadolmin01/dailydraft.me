'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
  Save,
  Loader2,
  User,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Hash,
  Plus,
  X,
  CheckSquare,
  Target,
  Camera,
  ImageIcon,
  Sparkles,
  Link,
  Github,
  Linkedin,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { SlidePanel } from './ui/SlidePanel'
import { useAuth } from '@/src/context/AuthContext'
import { ComboBox } from './ui/ComboBox'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import { supabase } from '@/src/lib/supabase/client'

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

interface ProfileEditPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileEditPanel: React.FC<ProfileEditPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // 크롭 상태
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
  const [teamRole, setTeamRole] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [teamAtmosphere, setTeamAtmosphere] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [preferOnline, setPreferOnline] = useState(false)
  const [goals, setGoals] = useState<string[]>([])
  const [strengths, setStrengths] = useState<string[]>([])
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [uniVerified, setUniVerified] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyStep, setVerifyStep] = useState<'idle' | 'sent' | 'verifying'>('idle')
  const [verifyError, setVerifyError] = useState('')
  const [verifySending, setVerifySending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile && isOpen) {
      setNickname(profile.nickname || '')
      setPosition(profile.desired_position || '')
      setAffiliationType(profile.affiliation_type || 'student')
      setUniversity(profile.university || '')
      setMajor(profile.major || '')
      setVision(profile.vision_summary || '')
      setContactEmail(profile.contact_email || '')
      setPortfolioUrl(profile.portfolio_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setGithubUrl(profile.github_url || '')
      setLocation(profile.location || '')
      setCurrentSituation(profile.current_situation || '')
      setInterestTags(profile.interest_tags || [])
      const profileSkills = profile.skills as Array<{ name: string; level: string }> | null
      setSkills(profileSkills || [])

      // AI analysis data
      const p = profile.personality as Record<string, number> | null
      if (p) setPersonality({ risk: p.risk || 5, time: p.time || 5, communication: p.communication || 5, decision: p.decision || 5 })

      if (profile.vision_summary) {
        try {
          const v = JSON.parse(profile.vision_summary)
          if (v.work_style) setWorkStyle({ collaboration: v.work_style.collaboration || 5, planning: v.work_style.planning || 5, perfectionism: v.work_style.perfectionism || 5 })
          if (v.team_preference) {
            setTeamRole(v.team_preference.role || '')
            setTeamSize(v.team_preference.preferred_size || '')
            setTeamAtmosphere(v.team_preference.atmosphere || '')
          }
          if (v.availability) {
            setHoursPerWeek(v.availability.hours_per_week?.toString() || '')
            setPreferOnline(v.availability.prefer_online || false)
          }
          setGoals(v.goals || [])
          setStrengths(v.strengths || [])
        } catch { /* not JSON, skip */ }
      }

      setSaveError(null)
      setSaved(false)

      // 대학 인증 상태 확인
      fetch('/api/profile/verify-university')
        .then(r => r.json())
        .then(d => { if (d.is_verified) setUniVerified(true) })
        .catch(() => {})
    }
  }, [profile, isOpen])

  // 파일 선택 시 크롭 모달 열기
  const handleFileSelect = (file: File, type: 'avatar' | 'cover') => {
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드 가능합니다'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('5MB 이하 파일만 업로드 가능합니다'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(reader.result as string)
      setCropType(type)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels)
  }, [])

  // 크롭된 이미지를 blob으로 변환
  const getCroppedBlob = (imageSrc: string, area: Area): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = area.width
        canvas.height = area.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas error')); return }
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Blob conversion failed'))
        }, 'image/jpeg', 0.9)
      }
      img.onerror = reject
      img.src = imageSrc
    })
  }

  // 크롭 확인 후 업로드
  const handleCropConfirm = async () => {
    if (!user?.id || !cropImage || !croppedArea) return
    const isAvatar = cropType === 'avatar'
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true)
    setCropImage(null)

    try {
      const blob = await getCroppedBlob(cropImage, croppedArea)
      const path = `${user.id}/${cropType}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path)

      await updateProfile.mutateAsync(
        isAvatar ? { avatar_url: publicUrl } : { cover_image_url: publicUrl }
      )
      toast.success('이미지가 업로드되었습니다')
    } catch (err) {
      console.error(`Failed to upload ${cropType}:`, err)
      toast.error('이미지 업로드에 실패했습니다')
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingCover(false)
    }
  }

  const toggleTag = (tag: string) => {
    setInterestTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const tag = customTag.trim()
    if (tag && !interestTags.includes(tag)) {
      setInterestTags(prev => [...prev, tag])
      setCustomTag('')
    }
  }

  const addSkill = (name?: string) => {
    const skillName = (name || newSkillName).trim()
    if (skillName && !skills.some(s => s.name === skillName)) {
      setSkills(prev => [...prev, { name: skillName, level: newSkillLevel }])
      if (!name) setNewSkillName('')
    }
  }

  const removeSkill = (name: string) => {
    setSkills(prev => prev.filter(s => s.name !== name))
  }

  const updateSkillLevel = (name: string, level: string) => {
    setSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s))
  }

  const handleSave = async () => {
    setSaveError(null)
    setSaved(false)
    try {
      // Build vision_summary JSON, preserving existing data
      let existingVision: Record<string, unknown> = {}
      if (profile?.vision_summary) {
        try { existingVision = JSON.parse(profile.vision_summary) } catch { /* not JSON */ }
      }
      const visionJson = JSON.stringify({
        ...existingVision,
        work_style: workStyle,
        team_preference: { role: teamRole || undefined, preferred_size: teamSize || undefined, atmosphere: teamAtmosphere || undefined },
        availability: { hours_per_week: hoursPerWeek ? parseInt(hoursPerWeek) : null, prefer_online: preferOnline },
        goals,
        strengths,
        summary: existingVision.summary || vision.trim() || undefined,
      })

      await updateProfile.mutateAsync({
        nickname: nickname.trim() || undefined,
        desired_position: position.trim() || undefined,
        affiliation_type: affiliationType || undefined,
        university: university.trim() || undefined,
        major: major.trim() || undefined,
        vision_summary: visionJson,
        contact_email: contactEmail.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        location: location.trim() || undefined,
        current_situation: currentSituation || undefined,
        interest_tags: interestTags.length > 0 ? interestTags : undefined,
        skills: skills.length > 0 ? skills : undefined,
        personality,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('프로필이 저장되었습니다')
    } catch {
      setSaveError('프로필 저장에 실패했습니다. 다시 시도해주세요.')
      toast.error('프로필 저장에 실패했습니다')
    }
  }

  return (
    <>
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="프로필 수정"
      subtitle="프로필 정보를 수정하세요"
      headerActions={
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold border border-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          {updateProfile.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saved ? '저장됨' : '저장'}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-8">
        {saveError && (
          <div className="p-3 bg-red-600/5 border border-red-600/20 text-sm text-status-danger-text">
            {saveError}
          </div>
        )}

        {/* 사진 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Camera size={14} /> 사진
          </h3>

          {/* 커버 사진 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">커버 사진</label>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="relative group w-full h-28 border border-border overflow-hidden"
            >
              {profile?.cover_image_url ? (
                <Image src={profile.cover_image_url} alt="cover" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-sunken to-border flex items-center justify-center">
                  <ImageIcon size={20} className="text-txt-disabled" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={12} /> 변경
                </span>
              </div>
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </button>
          </div>

          {/* 프로필 사진 */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">프로필 사진</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="relative group w-20 h-20 border border-border overflow-hidden flex-shrink-0"
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-disabled">
                    {profile?.nickname?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                  <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </button>
              <div className="text-xs text-txt-tertiary">
                <p>클릭하여 사진을 변경하세요</p>
                <p className="text-txt-disabled mt-0.5">최대 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file, 'avatar')
              e.target.value = ''
            }}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file, 'cover')
              e.target.value = ''
            }}
          />
        </section>

        {/* 기본 정보 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={14} /> 기본 정보
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={30}
                placeholder="닉네임을 입력하세요"
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">한 줄 소개</label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="자신을 한 줄로 소개해주세요"
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent resize-none transition-colors"
              />
              <p className={`text-xs mt-1 text-right font-mono ${vision.length >= 180 ? 'text-status-danger-text font-bold' : vision.length >= 150 ? 'text-amber-500' : 'text-txt-disabled'}`}>{vision.length}/200</p>
            </div>
          </div>
        </section>

        {/* 현재 상황 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target size={14} /> 현재 상황
          </h3>
          <div className="space-y-1.5">
            {SITUATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCurrentSituation(currentSituation === opt.value ? '' : opt.value)}
                className={`w-full text-left px-3 py-2.5 text-xs border transition-colors ${
                  currentSituation === opt.value
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 소속 & 포지션 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Briefcase size={14} /> 소속 & 포지션
          </h3>
          <div className="space-y-4">
            {/* 소속 유형 */}
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">소속 유형</label>
              <div className="flex flex-wrap gap-1.5">
                {AFFILIATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAffiliationType(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      affiliationType === opt.value
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                        : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 포지션 */}
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">포지션</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POSITION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPosition(opt)}
                    className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                      position === opt
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                        : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="또는 직접 입력"
                maxLength={50}
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* 소속 + 전공/직무 (라벨이 유형에 따라 변경) */}
            {(() => {
              const affConfig = AFFILIATION_OPTIONS.find(a => a.value === affiliationType) || AFFILIATION_OPTIONS[0]
              const showUnivCombo = affiliationType === 'student' || affiliationType === 'graduate'
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1.5">{affConfig.orgLabel}</label>
                    {showUnivCombo ? (
                      <ComboBox
                        value={university}
                        onChange={setUniversity}
                        options={UNIVERSITY_LIST}
                        placeholder={affConfig.orgPlaceholder}
                      />
                    ) : (
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder={affConfig.orgPlaceholder}
                        maxLength={50}
                        className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1.5">{affConfig.roleLabel}</label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder={affConfig.rolePlaceholder}
                      maxLength={50}
                      className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              )
            })()}

            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">활동 지역</label>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_OPTIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(location === loc ? '' : loc)}
                    className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                      location === loc
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                        : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* 대학 인증 */}
            {(affiliationType === 'student' || affiliationType === 'graduate') && (
              <div className="mt-4 p-3 border border-border bg-surface-sunken">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className={uniVerified ? 'text-emerald-600' : 'text-txt-disabled'} />
                  <span className="text-xs font-bold text-txt-secondary">
                    대학 인증
                  </span>
                  {uniVerified && (
                    <span className="px-1.5 py-0.5 text-[0.625rem] font-bold bg-emerald-600 text-white">VERIFIED</span>
                  )}
                </div>

                {uniVerified ? (
                  <p className="text-xs text-emerald-600">대학 인증이 완료되었습니다.</p>
                ) : verifyStep === 'idle' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-txt-tertiary">대학 이메일(.ac.kr)로 인증하면 프로필에 인증 배지가 표시됩니다.</p>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        value={verifyEmail}
                        onChange={e => { setVerifyEmail(e.target.value); setVerifyError('') }}
                        placeholder="university@snu.ac.kr"
                        className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        disabled={verifySending || !verifyEmail.trim()}
                        onClick={async () => {
                          setVerifySending(true)
                          setVerifyError('')
                          try {
                            const res = await fetch('/api/profile/verify-university', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'send', email: verifyEmail.trim() }),
                            })
                            const data = await res.json()
                            if (!res.ok) { setVerifyError(data.error); return }
                            setVerifyStep('sent')
                          } catch { setVerifyError('요청에 실패했습니다') }
                          finally { setVerifySending(false) }
                        }}
                        className="px-3 py-2 text-xs font-bold border border-black bg-black text-white hover:bg-black/80 disabled:opacity-50 transition-colors"
                      >
                        {verifySending ? '전송 중...' : '인증 코드 전송'}
                      </button>
                    </div>
                    {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-txt-tertiary">
                      <strong>{verifyEmail}</strong>로 발송된 6자리 코드를 입력하세요.
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError('') }}
                        placeholder="000000"
                        maxLength={6}
                        className="w-32 px-3 py-2 text-sm font-mono text-center tracking-widest border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        disabled={verifySending || verifyCode.length !== 6}
                        onClick={async () => {
                          setVerifySending(true)
                          setVerifyError('')
                          try {
                            const res = await fetch('/api/profile/verify-university', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'verify', code: verifyCode }),
                            })
                            const data = await res.json()
                            if (!res.ok) { setVerifyError(data.error); return }
                            setUniVerified(true)
                            toast.success('대학 인증이 완료되었습니다!')
                          } catch { setVerifyError('요청에 실패했습니다') }
                          finally { setVerifySending(false) }
                        }}
                        className="px-3 py-2 text-xs font-bold border border-black bg-black text-white hover:bg-black/80 disabled:opacity-50 transition-colors"
                      >
                        {verifySending ? '확인 중...' : '인증 확인'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVerifyStep('idle'); setVerifyCode(''); setVerifyError('') }}
                        className="px-2 py-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
                      >
                        재전송
                      </button>
                    </div>
                    {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 기술 스택 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckSquare size={14} /> 기술 스택
          </h3>

          {/* 빠른 추가 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SKILL_SUGGESTIONS.filter(s => !skills.some(sk => sk.name === s)).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="px-2.5 py-1 text-xs font-medium border border-border bg-surface-card text-txt-secondary hover:border-border-strong transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>

          {/* 추가된 스킬 */}
          {skills.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2 px-3 py-2 bg-surface-card border border-border">
                  <span className="flex-1 text-xs text-txt-primary font-medium">{skill.name}</span>
                  <div className="flex items-center gap-0.5">
                    {SKILL_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateSkillLevel(skill.name, level)}
                        className={`px-1.5 py-0.5 text-[0.625rem]transition-colors ${
                          skill.level === level
                            ? 'bg-[#4F46E5] text-white'
                            : 'text-txt-disabled hover:text-txt-secondary'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => removeSkill(skill.name)}
                    className="p-0.5 text-txt-disabled hover:text-txt-secondary transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 직접 입력 */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="스킬 직접 입력"
              maxLength={30}
              className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              className="px-2 py-2 text-xs border border-border bg-surface-card text-txt-secondary focus:outline-none focus:border-accent transition-colors"
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addSkill()}
              className="px-3 py-2 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </section>

        {/* 연락처 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Mail size={14} /> 연락처
          </h3>
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">이메일</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={user?.email || 'email@example.com'}
              className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-txt-disabled mt-1">커피챗 수락 시 상대방에게 공개됩니다</p>
          </div>
        </section>

        {/* 소셜 링크 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Link size={14} /> 소셜 링크
          </h3>
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
                <Globe size={12} /> 포트폴리오
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://myportfolio.com"
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
                <Github size={12} /> GitHub
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
                <Linkedin size={12} /> LinkedIn
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-txt-disabled mt-2">프로필에 표시되어 다른 사용자가 볼 수 있습니다</p>
        </section>

        {/* 관심 분야 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Hash size={14} /> 관심 분야
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {INTEREST_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                  interestTags.includes(tag)
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 커스텀 태그 */}
          {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#4F46E5] text-white"
                >
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="hover:opacity-70">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              placeholder="직접 입력"
              maxLength={20}
              className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-3 py-2 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </section>

        {/* AI 프로필 분석 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={14} /> AI 프로필 분석
          </h3>
          <p className="text-xs text-txt-tertiary mb-4">온보딩 AI 대화에서 분석된 데이터입니다. 직접 수정할 수 있어요.</p>

          {/* 성향 슬라이더 */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-medium text-txt-secondary">성향 점수</h4>
            {[
              { key: 'risk', label: '도전 성향', low: '안정 추구', high: '도전적' },
              { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
              { key: 'communication', label: '소통 선호', low: '혼자 집중', high: '수시 소통' },
              { key: 'decision', label: '실행 속도', low: '신중한 계획', high: '빠른 실행' },
            ].map(item => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-txt-secondary">{item.label}</span>
                  <span className="text-xs font-mono text-txt-disabled">{personality[item.key]}/10</span>
                </div>
                <input
                  type="range"
                  min={1} max={10} step={1}
                  value={personality[item.key]}
                  onChange={e => setPersonality(p => ({ ...p, [item.key]: parseInt(e.target.value) }))}
                  className="w-full h-1.5 accent-[#4F46E5] cursor-pointer"
                />
                <div className="flex justify-between">
                  <span className="text-[9px] text-txt-disabled font-mono">{item.low}</span>
                  <span className="text-[9px] text-txt-disabled font-mono">{item.high}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 작업 스타일 슬라이더 */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-medium text-txt-secondary">작업 스타일</h4>
            {[
              { key: 'collaboration', label: '협업 스타일', low: '독립형', high: '팀 소통형' },
              { key: 'planning', label: '작업 방식', low: '바로 실행', high: '기획 우선' },
              { key: 'perfectionism', label: '품질 기준', low: '속도 우선', high: '완벽주의' },
            ].map(item => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-txt-secondary">{item.label}</span>
                  <span className="text-xs font-mono text-txt-disabled">{workStyle[item.key]}/10</span>
                </div>
                <input
                  type="range"
                  min={1} max={10} step={1}
                  value={workStyle[item.key]}
                  onChange={e => setWorkStyle(p => ({ ...p, [item.key]: parseInt(e.target.value) }))}
                  className="w-full h-1.5 accent-[#4F46E5] cursor-pointer"
                />
                <div className="flex justify-between">
                  <span className="text-[9px] text-txt-disabled font-mono">{item.low}</span>
                  <span className="text-[9px] text-txt-disabled font-mono">{item.high}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 팀 선호 */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-medium text-txt-secondary">팀 선호</h4>
            <div>
              <label className="block text-xs text-txt-tertiary mb-1.5">역할</label>
              <div className="flex gap-1.5">
                {['리더', '팔로워', '유연'].map(r => (
                  <button key={r} type="button" onClick={() => setTeamRole(r)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamRole === r ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'}`}
                  >{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-txt-tertiary mb-1.5">선호 인원</label>
              <div className="flex gap-1.5">
                {['2-3명', '4-5명', '6명+'].map(s => (
                  <button key={s} type="button" onClick={() => setTeamSize(s)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamSize === s ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'}`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-txt-tertiary mb-1.5">분위기</label>
              <div className="flex gap-1.5">
                {['실무형', '캐주얼', '균형'].map(a => (
                  <button key={a} type="button" onClick={() => setTeamAtmosphere(a)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamAtmosphere === a ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'}`}
                  >{a}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 가용성 */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-medium text-txt-secondary">가용성</h4>
            <div>
              <label className="block text-xs text-txt-tertiary mb-1.5">주당 투자 가능 시간</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={80}
                  value={hoursPerWeek}
                  onChange={e => setHoursPerWeek(e.target.value)}
                  placeholder="예: 15"
                  className="w-32 px-3 py-2 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
                />
                <span className="text-xs text-txt-disabled">시간</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={preferOnline} onChange={e => setPreferOnline(e.target.checked)}
                className="w-4 h-4 accent-[#4F46E5]" />
              <span className="text-xs text-txt-secondary">비대면(온라인) 선호</span>
            </label>
          </div>

          {/* 목표 & 강점 태그 */}
          <div className="space-y-4">
            <TagEditor label="목표" tags={goals} onChange={setGoals} suggestions={['포트폴리오', '창업', '학습', '수상', '네트워킹', '재미']} />
            <TagEditor label="강점" tags={strengths} onChange={setStrengths} suggestions={['기획력', '빠른 구현', '디자인 감각', '소통', '문제 해결', '리더십']} />
          </div>
        </section>

        {/* Bottom save */}
        <div className="border-t border-border pt-6 pb-8 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-bold border border-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            {updateProfile.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saved ? '저장 완료' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </SlidePanel>

    {/* 이미지 크롭 모달 */}
    {cropImage && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-surface-card border border-border-strong shadow-brutal-xl w-full max-w-lg mx-4 flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-strong bg-surface-sunken">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-txt-tertiary">
              {cropType === 'avatar' ? 'CROP AVATAR' : 'CROP COVER'}
            </span>
            <button
              onClick={() => setCropImage(null)}
              className="p-1 hover:bg-surface-card transition-colors"
            >
              <X size={16} className="text-txt-disabled" />
            </button>
          </div>

          {/* 크롭 영역 */}
          <div className="relative w-full" style={{ height: cropType === 'avatar' ? 320 : 240 }}>
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={cropType === 'avatar' ? 1 : 3}
              cropShape={cropType === 'avatar' ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* 줌 슬라이더 */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="text-[0.625rem] font-mono text-txt-disabled">ZOOM</span>
              <input
                type="range"
                min={1} max={3} step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 accent-[#4F46E5] cursor-pointer"
              />
              <span className="text-[0.625rem] font-mono text-txt-disabled w-8 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-strong">
            <button
              onClick={() => setCropImage(null)}
              className="px-4 py-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCropConfirm}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold border border-[#4F46E5] hover:bg-[#4338CA] transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Camera size={12} /> 적용
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

// --- Tag Editor ---
function TagEditor({ label, tags, onChange, suggestions }: { label: string; tags: string[]; onChange: (t: string[]) => void; suggestions: string[] }) {
  const [input, setInput] = useState('')
  const add = (tag: string) => { if (tag && !tags.includes(tag)) onChange([...tags, tag]) }
  const remove = (tag: string) => onChange(tags.filter(t => t !== tag))
  return (
    <div>
      <label className="block text-xs text-txt-tertiary mb-1.5">{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#4F46E5] text-white">
              {tag}
              <button onClick={() => remove(tag)} className="hover:opacity-70"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {suggestions.filter(s => !tags.includes(s)).map(s => (
          <button key={s} type="button" onClick={() => add(s)}
            className="px-2 py-0.5 text-xs font-mediumborder border-border bg-surface-card text-txt-secondary hover:border-border-strong transition-colors"
          >+ {s}</button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input.trim()); setInput('') } }}
          placeholder="직접 입력" maxLength={20}
          className="flex-1 px-3 py-1.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
        />
        <button type="button" onClick={() => { add(input.trim()); setInput('') }}
          className="px-2.5 py-1.5 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        ><Plus size={14} /></button>
      </div>
    </div>
  )
}
