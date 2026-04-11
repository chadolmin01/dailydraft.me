'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useProjectInvitations } from '@/src/hooks/useProjectInvitations'
import {
  ProfileHero,
  ProfileSidebar,
  ProfilePortfolio,
  ProfileProjects,
  ProfileCoffeeChats,
  ProfileInvitations,
  ProfileSentInvitations,
  AiOnboardingModal,
} from '@/components/profile'
import { Sparkles, Briefcase, FolderOpen, Activity } from 'lucide-react'
import { SkeletonProfile, SkeletonGrid } from '@/components/ui/Skeleton'

export default function ProfilePageClient() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data: profile, isPending: isProfilePending } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: portfolioItems = [] } = usePortfolioItems()
  const completion = useProfileCompletion(profile)

  const { data: myTeams = [] } = useQuery<any[]>({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const res = await fetch('/api/users/my-teams')
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })

  // Prefetch: 활동 탭 데이터를 미리 로딩
  useCoffeeChats({ asOwner: true })
  useCoffeeChats({ asOwner: false })
  useProjectInvitations({ asSender: false })

  const [showAiConfirm, setShowAiConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'projects' | 'activity'>('about')

  // Parse strengths from vision_summary
  let strengths: string[] = []
  if (profile?.vision_summary) {
    try {
      const v = JSON.parse(profile.vision_summary)
      strengths = v.strengths || []
    } catch { /* plain text */ }
  }

  if (isAuthLoading || isProfilePending || !profile) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SkeletonProfile />
      <SkeletonGrid count={2} cols={2} />
    </div>
  )

  const tabs = [
    { key: 'about' as const, label: 'About' },
    { key: 'portfolio' as const, label: '포트폴리오', count: portfolioItems.length },
    { key: 'projects' as const, label: '프로젝트', count: myOpportunities.length + myTeams.length },
    { key: 'activity' as const, label: '활동' },
  ]

  return (
    <div className="bg-surface-bg min-h-full">
      {/* AI onboarding banner */}
      {profile && !profile.ai_chat_completed && (
        <>
          <div
            onClick={() => setShowAiConfirm(true)}
            className="group block max-w-3xl mx-auto px-4 sm:px-6 pt-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 px-5 py-4 bg-surface-card rounded-xl border border-border hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-txt-inverse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-txt-primary">2분 대화로 매칭 정확도를 높여보세요</p>
                <p className="text-xs text-txt-tertiary mt-0.5">작업 스타일, 성향을 분석해 딱 맞는 팀원을 추천해드려요</p>
              </div>
              <span className="shrink-0 px-3.5 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-xl">
                시작하기 →
              </span>
            </div>
          </div>

          <AiOnboardingModal
            isOpen={showAiConfirm}
            onClose={() => setShowAiConfirm(false)}
            onConfirm={() => {
              setShowAiConfirm(false)
              const draft = {
                name: profile.nickname || '',
                affiliationType: profile.affiliation_type || 'student',
                university: profile.university || '',
                major: profile.major || '',
                locations: (profile.locations as string[] | null) ?? [],
                position: profile.desired_position || '',
                situation: profile.current_situation || 'exploring',
                skills: (profile.skills as Array<{ name: string }> | null)?.map(s => s.name) ?? [],
                interests: (profile.interest_tags as string[] | null) ?? [],
              }
              sessionStorage.setItem('onboarding-draft', JSON.stringify(draft))
              router.push('/onboarding/interview')
            }}
          />
        </>
      )}

      {/* Single-column layout */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero: avatar + name + meta */}
        <ProfileHero
          profile={profile!}
          email={user?.email}
          strengths={strengths}
          isEditable
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border mb-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-txt-primary text-txt-primary'
                  : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-1.5 text-xs text-txt-tertiary">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[40vh]">
          {activeTab === 'about' && (
            <ProfileSidebar
              profile={profile!}
              email={user?.email}
              completion={completion}
              isEditable
            />
          )}
          {activeTab === 'portfolio' && <ProfilePortfolio items={portfolioItems} isEditable />}
          {activeTab === 'projects' && <ProfileProjects opportunities={myOpportunities} joinedTeams={myTeams} />}
          {activeTab === 'activity' && (
            <>
              <ProfileCoffeeChats />
              <ProfileInvitations />
              <ProfileSentInvitations />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
