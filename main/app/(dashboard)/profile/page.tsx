'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useUniversityVerification } from '@/src/hooks/useUniversityVerification'
import {
  ProfileHero,
  ProfileLinksBar,
  ProfileInfoCards,
  ProfilePortfolio,
  ProfileProjects,
  ProfileCoffeeChats,
  ProfileInvitations,
  AiOnboardingModal,
} from '@/components/profile'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { SkeletonProfile, SkeletonGrid } from '@/components/ui/Skeleton'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: portfolioItems = [] } = usePortfolioItems()
  const completion = useProfileCompletion(profile)

  const router = useRouter()
  const { data: uniData } = useUniversityVerification()
  const uniVerified = uniData?.is_verified ?? false
  const [showAiConfirm, setShowAiConfirm] = useState(false)

  // Parse strengths from vision_summary
  let strengths: string[] = []
  if (profile?.vision_summary) {
    try {
      const v = JSON.parse(profile.vision_summary)
      strengths = v.strengths || []
    } catch { /* plain text */ }
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SkeletonProfile />
      <SkeletonGrid count={2} cols={2} />
    </div>
  )

  return (
    <div className="bg-surface-bg min-h-full">
      {profile && !profile.ai_chat_completed && (
        <>
          <div
            onClick={() => setShowAiConfirm(true)}
            className="group block mx-auto max-w-screen-xl px-4 sm:px-6 pt-4 cursor-pointer"
          >
            <div className="relative overflow-hidden bg-surface-card rounded-xl border border-border shadow-md hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-brand/60 to-transparent" />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="relative w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles size={16} className="text-white" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand rounded-full border-2 border-surface-card animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">AI MATCHING</span>
                  </div>
                  <p className="text-[13px] font-bold text-txt-primary">2분 대화로 매칭 정확도를 높여보세요</p>
                  <p className="text-[11px] text-txt-tertiary mt-0.5">작업 스타일, 성향을 분석해 딱 맞는 팀원을 추천해드려요</p>
                </div>
                <div className="shrink-0 px-3.5 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-xl group-hover:bg-brand transition-colors duration-300 flex items-center gap-1.5">
                  시작하기
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </div>
              </div>
            </div>
          </div>

          <AiOnboardingModal
            isOpen={showAiConfirm}
            onClose={() => setShowAiConfirm(false)}
            onConfirm={() => router.push('/onboarding')}
          />
        </>
      )}
      <DashboardLayout size="wide">
        <ProfileHero
          profile={profile!}
          email={user?.email}
          uniVerified={uniVerified}
          strengths={strengths}
          isEditable
        />
        <ProfileLinksBar profile={profile!} isEditable />
        <ProfileInfoCards profile={profile!} completion={completion} isEditable />
        <ProfilePortfolio items={portfolioItems} isEditable />
        <ProfileProjects opportunities={myOpportunities} />
        <ProfileCoffeeChats />
        <ProfileInvitations />
      </DashboardLayout>
    </div>
  )
}
