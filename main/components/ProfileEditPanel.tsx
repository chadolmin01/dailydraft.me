'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { Area } from 'react-easy-crop'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SlidePanel } from './ui/SlidePanel'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { supabase } from '@/src/lib/supabase/client'
import { CATEGORICAL_TO_SCORE, SCORE_TO_CATEGORICAL } from '@/src/lib/onboarding/constants'
import {
  EditPhotos,
  EditBasicInfo,
  EditAffiliation,
  EditSkills,
  EditContact,
  EditInterests,
  EditAIProfile,
  CropModal,
} from './profile/edit'

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
  const [skills, setSkills] = useState<Array<{ name: string }>>([])
  const [newSkillName, setNewSkillName] = useState('')
  const [personality, setPersonality] = useState<Record<string, number>>({ risk: 3, time: 3, communication: 3, decision: 3 })
  const [workStyle, setWorkStyle] = useState<Record<string, number>>({ collaboration: 3, planning: 3, perfectionism: 3 })
  const [workStyleTraits, setWorkStyleTraits] = useState<Record<string, string>>({})
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
      setVision(profile.bio || '')
      setContactEmail(profile.contact_email || '')
      setPortfolioUrl(profile.portfolio_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setGithubUrl(profile.github_url || '')
      setLocation(profile.location || '')
      setCurrentSituation(profile.current_situation || '')
      setInterestTags(profile.interest_tags || [])
      const profileSkills = profile.skills as Array<{ name: string }> | null
      setSkills(profileSkills?.map(s => ({ name: s.name })) || [])

      // AI analysis data
      const p = profile.personality as Record<string, number> | null
      if (p) {
        const norm = (v: number) => Math.min(v || 3, 5)
        setPersonality({ risk: norm(p.risk), time: norm(p.time), communication: norm(p.communication), decision: norm(p.decision) })
      }

      if (profile.vision_summary) {
        try {
          const v = JSON.parse(profile.vision_summary)
          const ws = v.work_style
          if (ws) {
            const norm = (v: number) => Math.min(v || 3, 5)
            setWorkStyle({ collaboration: norm(ws.collaboration), planning: norm(ws.planning), perfectionism: norm(ws.perfectionism) })
          }
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

          // Read categorical traits — from traits or reverse-convert from numbers
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
        } catch { /* not JSON, skip */ }
      }

      setSaveError(null)
      setSaved(false)

      // 대학 인증 상태 확인
      fetch('/api/profile/verify-university')
        .then(r => r.json())
        .then(d => { if (d.is_verified) setUniVerified(true) })
        .catch(() => toast.error('대학 인증 확인에 실패했습니다'))
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
      setSkills(prev => [...prev, { name: skillName }])
      if (!name) setNewSkillName('')
    }
  }

  const removeSkill = (name: string) => {
    setSkills(prev => prev.filter(s => s.name !== name))
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
      // Convert categorical selections → numeric scores for DB
      const finalWorkStyle = { ...workStyle }
      const finalPersonality = { ...personality }
      if (workStyleTraits.collaboration_style) {
        const s = CATEGORICAL_TO_SCORE.collaboration_style[workStyleTraits.collaboration_style]
        if (s != null) finalWorkStyle.collaboration = s
      }
      if (workStyleTraits.planning_style) {
        const s = CATEGORICAL_TO_SCORE.planning_style[workStyleTraits.planning_style]
        if (s != null) finalWorkStyle.planning = s
      }
      if (workStyleTraits.quality_style) {
        const s = CATEGORICAL_TO_SCORE.quality_style[workStyleTraits.quality_style]
        if (s != null) finalWorkStyle.perfectionism = s
      }
      if (workStyleTraits.decision_style) {
        const s = CATEGORICAL_TO_SCORE.decision_style[workStyleTraits.decision_style]
        if (s != null) finalPersonality.decision = s
      }

      const visionJson = JSON.stringify({
        ...existingVision,
        work_style: finalWorkStyle,
        team_preference: { role: teamRole || undefined, preferred_size: teamSize || undefined, atmosphere: teamAtmosphere || undefined },
        availability: { hours_per_week: hoursPerWeek ? parseInt(hoursPerWeek) : null, prefer_online: preferOnline },
        goals,
        strengths,
        summary: existingVision.summary || vision.trim() || undefined,
        traits: {
          ...((existingVision as Record<string, unknown>).traits || {}),
          ...workStyleTraits,
        },
      })

      await updateProfile.mutateAsync({
        nickname: nickname.trim() || undefined,
        desired_position: position.trim() || undefined,
        affiliation_type: affiliationType || undefined,
        university: university.trim() || undefined,
        major: major.trim() || undefined,
        vision_summary: visionJson,
        bio: vision.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        location: location.trim() || undefined,
        current_situation: currentSituation || undefined,
        interest_tags: interestTags.length > 0 ? interestTags : undefined,
        skills: skills.length > 0 ? skills : undefined,
        personality: finalPersonality,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('프로필이 저장되었습니다! 프로필에서 확인해보세요.')
    } catch {
      setSaveError('프로필 저장에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.')
      toast.error('프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
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
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold border border-brand hover:bg-brand-hover disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.97]"
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
        {/* Section Progress */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['사진', '기본', '소속', '스킬', '연락처', '관심사', 'AI'].map((label, i) => (
            <span key={label} className="text-[10px] font-medium text-txt-disabled">
              {i > 0 && <span className="mr-1.5">›</span>}
              {label}
            </span>
          ))}
        </div>

        {saveError && (
          <div className="p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 text-sm text-status-danger-text flex items-center gap-2">
            <span className="shrink-0">⚠</span>
            {saveError}
          </div>
        )}

        <EditPhotos
          profile={profile}
          avatarInputRef={avatarInputRef}
          coverInputRef={coverInputRef}
          uploadingAvatar={uploadingAvatar}
          uploadingCover={uploadingCover}
          handleFileSelect={handleFileSelect}
        />

        <EditBasicInfo
          nickname={nickname}
          setNickname={setNickname}
          vision={vision}
          setVision={setVision}
          currentSituation={currentSituation}
          setCurrentSituation={setCurrentSituation}
        />

        <EditAffiliation
          affiliationType={affiliationType}
          setAffiliationType={setAffiliationType}
          position={position}
          setPosition={setPosition}
          university={university}
          setUniversity={setUniversity}
          major={major}
          setMajor={setMajor}
          location={location}
          setLocation={setLocation}
          uniVerified={uniVerified}
          setUniVerified={setUniVerified}
          verifyEmail={verifyEmail}
          setVerifyEmail={setVerifyEmail}
          verifyCode={verifyCode}
          setVerifyCode={setVerifyCode}
          verifyStep={verifyStep}
          setVerifyStep={setVerifyStep}
          verifyError={verifyError}
          setVerifyError={setVerifyError}
          verifySending={verifySending}
          setVerifySending={setVerifySending}
        />

        <EditSkills
          skills={skills}
          setSkills={setSkills}
          newSkillName={newSkillName}
          setNewSkillName={setNewSkillName}
          addSkill={addSkill}
          removeSkill={removeSkill}
        />

        <EditContact
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          userEmail={user?.email}
          portfolioUrl={portfolioUrl}
          setPortfolioUrl={setPortfolioUrl}
          githubUrl={githubUrl}
          setGithubUrl={setGithubUrl}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
        />

        <EditInterests
          interestTags={interestTags}
          setInterestTags={setInterestTags}
          customTag={customTag}
          setCustomTag={setCustomTag}
          toggleTag={toggleTag}
          addCustomTag={addCustomTag}
        />

        <EditAIProfile
          personality={personality}
          setPersonality={setPersonality}
          workStyle={workStyle}
          setWorkStyle={setWorkStyle}
          workStyleTraits={workStyleTraits}
          setWorkStyleTraits={setWorkStyleTraits}
          teamRole={teamRole}
          setTeamRole={setTeamRole}
          teamSize={teamSize}
          setTeamSize={setTeamSize}
          teamAtmosphere={teamAtmosphere}
          setTeamAtmosphere={setTeamAtmosphere}
          hoursPerWeek={hoursPerWeek}
          setHoursPerWeek={setHoursPerWeek}
          preferOnline={preferOnline}
          setPreferOnline={setPreferOnline}
          goals={goals}
          setGoals={setGoals}
          strengths={strengths}
          setStrengths={setStrengths}
        />

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
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white text-sm font-bold border border-brand hover:bg-brand-hover disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.97]"
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

    <CropModal
      cropImage={cropImage}
      setCropImage={setCropImage}
      cropType={cropType}
      crop={crop}
      setCrop={setCrop}
      zoom={zoom}
      setZoom={setZoom}
      onCropComplete={onCropComplete}
      handleCropConfirm={handleCropConfirm}
    />
  </>
  )
}
