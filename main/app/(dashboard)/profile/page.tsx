'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import {
  ProfileHero,
  ProfileSidebar,
  ProfilePortfolio,
  ProfileProjects,
  ProfileCoffeeChats,
  ProfileInvitations,
  ProfileLoadingSkeleton,
} from '@/components/profile'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: portfolioItems = [] } = usePortfolioItems()
  const completion = useProfileCompletion(profile)

  const [uniVerified, setUniVerified] = useState(false)

  // Parse strengths from vision_summary
  let strengths: string[] = []
  if (profile?.vision_summary) {
    try {
      const v = JSON.parse(profile.vision_summary)
      strengths = v.strengths || []
    } catch { /* plain text */ }
  }

  useEffect(() => {
    if (user) {
      fetch('/api/profile/verify-university')
        .then(r => r.json())
        .then(d => { if (d.is_verified) setUniVerified(true) })
        .catch(() => {})
    }
  }, [user])

  if (isLoading) return <ProfileLoadingSkeleton />

  return (
    <div className="bg-surface-bg min-h-full">
      {profile && !profile.ai_chat_completed && (
        <Link
          href="/onboarding"
          className="block mx-auto max-w-screen-xl px-4 sm:px-6 pt-4"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-border hover:border-txt-disabled transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-txt-primary">AI 매칭 분석 미완료</p>
              <p className="text-[11px] text-txt-tertiary font-mono">짧은 대화로 팀 매칭 정확도를 높여보세요</p>
            </div>
            <span className="text-[11px] font-mono text-txt-disabled shrink-0">진행하기 →</span>
          </div>
        </Link>
      )}
      <DashboardLayout
        size="wide"
        sidebar={
          <ProfileSidebar
            profile={profile!}
            email={user?.email}
            uniVerified={uniVerified}
            completion={completion}
            isEditable
          />
        }
      >
        <ProfileHero
          profile={profile!}
          email={user?.email}
          uniVerified={uniVerified}
          strengths={strengths}
          isEditable
        />
        <ProfilePortfolio items={portfolioItems} isEditable />
        <ProfileProjects opportunities={myOpportunities} />
        <ProfileCoffeeChats />
        <ProfileInvitations />
      </DashboardLayout>
    </div>
  )
}
