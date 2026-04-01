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
} from '@/components/profile'
import { useRouter } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'
import { SkeletonProfile, SkeletonGrid } from '@/components/ui/Skeleton'

export default function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: portfolioItems = [] } = usePortfolioItems()
  const completion = useProfileCompletion(profile)

  const router = useRouter()
  const [uniVerified, setUniVerified] = useState(false)
  const [showAiConfirm, setShowAiConfirm] = useState(false)

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
                    <span className="text-[0.5625rem] font-mono font-bold text-brand uppercase tracking-wider">AI MATCHING</span>
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

          {/* AI 온보딩 확인 모달 */}
          {showAiConfirm && (
            <div className="fixed inset-0 z-[401] flex items-center justify-center px-4" onClick={() => setShowAiConfirm(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div
                className="relative bg-surface-card rounded-xl border border-border shadow-xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-txt-primary">AI 매칭 분석 시작</p>
                      <p className="text-[11px] text-txt-tertiary">온보딩 화면으로 이동합니다</p>
                    </div>
                    <button onClick={() => setShowAiConfirm(false)} className="ml-auto p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors rounded-lg hover:bg-surface-sunken">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    AI와 짧은 대화를 나누면 작업 스타일과 성향을 분석해서 더 정확한 팀 매칭이 가능해요. 약 2분 정도 소요됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-6 pb-6 pt-2">
                  <button
                    onClick={() => setShowAiConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-txt-secondary border border-border rounded-xl hover:bg-surface-sunken transition-colors"
                  >
                    다음에 할게요
                  </button>
                  <button
                    onClick={() => router.push('/onboarding')}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-surface-inverse rounded-xl hover:bg-brand transition-colors"
                  >
                    시작하기
                  </button>
                </div>
              </div>
            </div>
          )}
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
