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
