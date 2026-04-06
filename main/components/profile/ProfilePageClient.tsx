'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useUniversityVerification } from '@/src/hooks/useUniversityVerification'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useProjectInvitations } from '@/src/hooks/useProjectInvitations'
import {
  ProfileHero,
  ProfileSidebar,
  ProfilePortfolio,
  ProfileProjects,
  ProfileCoffeeChats,
  ProfileInvitations,
  AiOnboardingModal,
} from '@/components/profile'
import { ProfileEditPanel } from '@/components/ProfileEditPanel'
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

  // Prefetch: 활동 탭 데이터를 미리 로딩 (탭 전환 시 즉시 표시)
  useCoffeeChats({ asOwner: true })
  useCoffeeChats({ asOwner: false })
  useProjectInvitations({ asSender: false })

  const { data: uniData } = useUniversityVerification()
  const uniVerified = uniData?.is_verified ?? false
  const [showAiConfirm, setShowAiConfirm] = useState(false)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'projects' | 'activity'>('portfolio')

  // Parse strengths from vision_summary
  let strengths: string[] = []
  if (profile?.vision_summary) {
    try {
      const v = JSON.parse(profile.vision_summary)
      strengths = v.strengths || []
    } catch { /* plain text */ }
  }

  // Guard: auth 로딩 중이거나, profile 데이터 아직 없으면 스켈레톤
  // RQ v5에서 enabled=false일 때 isLoading=false지만 isPending=true
  if (isAuthLoading || isProfilePending || !profile) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SkeletonProfile />
      <SkeletonGrid count={2} cols={2} />
    </div>
  )

  return (
    <div className="bg-surface-bg min-h-full overflow-x-hidden">
      {profile && !profile.ai_chat_completed && (
        <>
          <div
            onClick={() => setShowAiConfirm(true)}
            className="group block mx-auto max-w-screen-xl px-4 sm:px-6 pt-4 cursor-pointer"
          >
            <div className="relative overflow-hidden bg-surface-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-brand/60 to-transparent" />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="relative w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles size={16} className="text-white" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand rounded-full border-2 border-surface-card animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-brand tracking-wide">AI 매칭</span>
                  </div>
                  <p className="text-[13px] font-bold text-txt-primary">2분 대화로 매칭 정확도를 높여보세요</p>
                  <p className="text-xs text-txt-tertiary mt-0.5">작업 스타일, 성향을 분석해 딱 맞는 팀원을 추천해드려요</p>
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
            onConfirm={() => {
              setShowAiConfirm(false)
              // 온보딩 인터뷰 페이지로 이동 — 기존 프로필 데이터를 sessionStorage에 저장
              const draft = {
                name: profile.nickname || '',
                affiliationType: profile.affiliation_type || 'student',
                university: profile.university || '',
                major: profile.major || '',
                locations: profile.location ? profile.location.split(', ') : [],
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
      <DashboardLayout
        size="wide"
        sidebar={
          <ProfileSidebar
            profile={profile!}
            email={user?.email}
            uniVerified={uniVerified}
            completion={completion}
            isEditable
            onOpenEditPanel={() => setIsEditPanelOpen(true)}
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
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 border-b border-border/40 mb-6">
          {([
            { key: 'portfolio' as const, label: '포트폴리오', icon: Briefcase, count: portfolioItems.length },
            { key: 'projects' as const, label: '프로젝트', icon: FolderOpen, count: myOpportunities.length + myTeams.length },
            { key: 'activity' as const, label: '활동', icon: Activity },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-txt-primary text-txt-primary'
                  : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-0.5 text-xs text-txt-tertiary">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content — min-height prevents sidebar jump on tab switch ── */}
        <div className="min-h-[50vh]">
          {activeTab === 'portfolio' && <ProfilePortfolio items={portfolioItems} isEditable />}
          {activeTab === 'projects' && <ProfileProjects opportunities={myOpportunities} joinedTeams={myTeams} />}
          {activeTab === 'activity' && (
            <>
              <ProfileCoffeeChats />
              <ProfileInvitations />
            </>
          )}
        </div>
      </DashboardLayout>

      {/* Rendered at root level to avoid stacking context issues */}
      <ProfileEditPanel isOpen={isEditPanelOpen} onClose={() => setIsEditPanelOpen(false)} />
    </div>
  )
}
