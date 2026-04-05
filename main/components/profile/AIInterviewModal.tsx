'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { ScriptedInterviewStep } from '@/components/onboarding/steps/ScriptedInterviewStep'
import { saveProfileFromInterview } from '@/src/lib/onboarding/api'
import type { ProfileDraft, StructuredResponse } from '@/src/lib/onboarding/types'

interface AIInterviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIInterviewModal({ isOpen, onClose }: AIInterviewModalProps) {
  const { profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const [isCompleting, setIsCompleting] = useState(false)

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
    try {
      await saveProfileFromInterview(profileDraft, responses)
      // Wait for completing animation
      await new Promise(resolve => setTimeout(resolve, 2500))
      // Invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        refreshProfile(),
      ])
    } catch (err) {
      console.error('Failed to save interview:', err)
    } finally {
      setIsCompleting(false)
      onClose()
    }
  }, [profileDraft, queryClient, refreshProfile, onClose])

  if (!isOpen || !profileDraft) return null

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
