'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { ScriptedInterviewStep } from '@/components/onboarding/steps/ScriptedInterviewStep'
import { saveProfileFromInterview } from '@/src/lib/onboarding/api'
import type { ProfileDraft, StructuredResponse } from '@/src/lib/onboarding/types'

const INTERVIEW_SVGS = [
  '/onboarding/leader_follower.svg', '/onboarding/2.svg', '/onboarding/3.svg',
  '/onboarding/4.svg', '/onboarding/5.svg', '/onboarding/6.svg',
  '/onboarding/Deadline.svg', '/onboarding/done.svg', '/onboarding/add_project.svg',
]

interface AIInterviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIInterviewModal({ isOpen, onClose }: AIInterviewModalProps) {
  const { profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const [isCompleting, setIsCompleting] = useState(false)
  const [svgReady, setSvgReady] = useState(false)

  // SVG 프리로드 — 모달 열릴 때 �� 번째 SVG 로드 대기
  useEffect(() => {
    if (!isOpen) { setSvgReady(false); return }
    let done = false
    const critical = new window.Image()
    critical.src = INTERVIEW_SVGS[0]
    critical.onload = () => { if (!done) { done = true; setSvgReady(true) } }
    critical.onerror = () => { if (!done) { done = true; setSvgReady(true) } }
    const timeout = setTimeout(() => { if (!done) { done = true; setSvgReady(true) } }, 1500)
    INTERVIEW_SVGS.forEach(src => { const img = new window.Image(); img.src = src })
    return () => clearTimeout(timeout)
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // Map profile to ProfileDraft
  const profileDraft: ProfileDraft | null = profile ? {
    name: profile.nickname || '',
    affiliationType: profile.affiliation_type || 'student',
    university: profile.university || '',
    major: profile.major || '',
    locations: profile.location ? profile.location.split(', ') : [],
    position: profile.desired_position || '',
    situation: profile.current_situation || 'exploring',
    skills: (profile.skills as Array<{ name: string }> | null)?.map(s => s.name) ?? [],
    interests: (profile.interest_tags as string[] | null) ?? [],
  } : null

  const handleComplete = useCallback(async (responses: StructuredResponse[]) => {
    if (!profileDraft) return
    setIsCompleting(true)

    // 최대 8초 타임아웃 — 어떤 상황에서도 닫힘 보장
    const timeout = setTimeout(() => { setIsCompleting(false); onClose() }, 8000)

    try {
      // 저장 + completing 애니메이션(2.5초)을 병렬 실행
      await Promise.all([
        saveProfileFromInterview(profileDraft, responses).catch(err => {
          console.error('Failed to save interview:', err)
        }),
        new Promise(resolve => setTimeout(resolve, 2500)),
      ])
      // 캐시 갱신
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        refreshProfile(),
      ]).catch(() => {})
    } catch (err) {
      console.error('Interview complete error:', err)
    } finally {
      clearTimeout(timeout)
      setIsCompleting(false)
      onClose()
    }
  }, [profileDraft, queryClient, refreshProfile, onClose])

  if (!isOpen || !profileDraft) return null

  // SVG 프리로드 대기
  if (!svgReady) {
    return (
      <div className="fixed inset-0 z-[500] bg-surface-bg flex items-center justify-center">
        <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-txt-inverse font-black text-lg leading-none">D</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[500] bg-surface-bg flex flex-col">
      {/* Close button — hidden during completing phase */}
      {!isCompleting && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <ScriptedInterviewStep
        profile={profileDraft}
        introMessage={`${profileDraft.name}님, 몇 가지만 골라주세요!`}
        onAnswer={() => {}}
        onComplete={handleComplete}
      />
    </div>
  )
}
