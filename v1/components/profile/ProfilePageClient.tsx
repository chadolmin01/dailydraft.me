'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
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
} from '@/components/profile'
import { PersonalityScorecard } from '@/components/profile/PersonalityScorecard'
import { ProfileInsightsWidget } from '@/components/profile/ProfileInsightsWidget'
import { SkeletonProfile, SkeletonGrid } from '@/components/ui/Skeleton'

type Tab = 'about' | 'portfolio' | 'projects' | 'activity'

/**
 * 프로필 페이지 — 단일 컬럼, 4탭 레이아웃.
 *
 * 섹션 원칙:
 *   1. Hero: 아바타·이름·포지션·한줄소개 편집 포인트
 *   2. About: 자기소개, 관심/스킬, 링크, 소속 클럽, 완성도
 *   3. Portfolio: 이미지 카드 그리드
 *   4. Projects: 내 프로젝트 + 합류 팀
 *   5. Activity: 커피챗·초대 응답 이력 (기존 유지)
 */
export default function ProfilePageClient() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()

  // Prefetch onboarding interview route for AI modal → navigate 체감 개선
  useEffect(() => { router.prefetch('/onboarding/interview') }, [router])

  const { data: profile, isPending: isProfilePending } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: portfolioItems = [] } = usePortfolioItems()
  const completion = useProfileCompletion(profile)

  const { data: myTeams = [] } = useQuery<Array<{
    id: string
    title: string
    description: string
    status: string
    type: string
    demo_images: string[] | null
    needed_roles: string[] | null
    interest_tags: string[] | null
    my_role: string | null
    joined_at: string | null
    creator: { nickname: string; desired_position: string | null } | null
  }>>({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const res = await fetch('/api/users/my-teams')
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })

  // 활동 탭 데이터 prefetch — 탭 전환 시 스켈레톤 제거
  useCoffeeChats({ asOwner: true })
  useCoffeeChats({ asOwner: false })
  useProjectInvitations({ asSender: false })

  const [activeTab, setActiveTab] = useState<Tab>('about')

  // vision_summary 에서 강점 리스트 파싱 (Sidebar 에 전달)
  let strengths: string[] = []
  if (profile?.vision_summary) {
    try {
      const v = JSON.parse(profile.vision_summary)
      strengths = Array.isArray(v?.strengths) ? v.strengths : []
    } catch { /* plain text */ }
  }

  if (isAuthLoading || isProfilePending || !profile) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonProfile />
        <SkeletonGrid count={2} cols={2} />
      </div>
    )
  }

  // 라벨: "소개" → "프로필" 로 변경. 이전엔 "소개"가 자기소개로 오해됐는데 실제 콘텐츠는
  // AI 인터뷰 결과 + 스킬·링크·완성도 등 메타 정보 묶음이라 라벨 불일치. Hero 영역에 한 줄 소개가
  // 별도로 있어서 더 혼란. "프로필"이 의미 일치.
  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: 'about', label: '프로필' },
    { key: 'portfolio', label: '포트폴리오', count: portfolioItems.length },
    { key: 'projects', label: '프로젝트', count: myOpportunities.length + myTeams.length },
    { key: 'activity', label: '활동' },
  ]

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* AI 온보딩 유도 배너 — 대화형 매칭 미완료 시. 한 번 클릭으로 바로 진입 (confirm 모달 제거).
            배너 누르는 시점에 현재 profile 로 draft 를 구성해 sessionStorage 에 저장. 인터뷰 페이지가
            이 draft 를 읽어 개인정보 재입력 없이 바로 7문항 화면 시작. */}
        {!profile.ai_chat_completed && (
          <button
            type="button"
            onClick={() => {
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
                source: 'matching' as const,
              }
              sessionStorage.setItem('onboarding-draft', JSON.stringify(draft))
              router.push('/onboarding/interview')
            }}
            className="ob-ring-glow ob-press-spring w-full group bg-surface-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-txt-primary">2분 대화로 매칭 정확도 높이기</p>
              <p className="text-xs text-txt-tertiary mt-0.5">7문항 답변으로 팀 스타일·성향을 분석해 맞춤 팀원을 추천합니다</p>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-0.5 transition-transform">
              시작
              <ArrowRight size={12} />
            </span>
          </button>
        )}

        {/* Hero — 아바타·이름·포지션·소개 */}
        <ProfileHero
          profile={profile}
          email={user?.email}
          strengths={strengths}
          isEditable
        />

        {/* 개인 페르소나 출시 예고 */}
        <Link
          href="/profile/persona"
          className="block bg-surface-card border border-border border-dashed rounded-2xl p-4 hover:border-brand/40 hover:bg-brand-bg/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-txt-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-bold text-txt-primary">개인 페르소나</p>
                <span className="text-[10px] font-semibold text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
                  2026 여름 출시 예정
                </span>
              </div>
              <p className="text-[11px] text-txt-tertiary mt-0.5">
                포트폴리오·LinkedIn·이력서 초안을 본인 톤으로 자동 생성합니다
              </p>
            </div>
            <ArrowRight size={14} className="shrink-0 text-txt-tertiary" />
          </div>
        </Link>

        {/* 탭 바 */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-txt-primary text-txt-primary'
                  : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs font-medium text-txt-tertiary tabular-nums">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="min-h-[40vh]">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* AI 인터뷰 결과 — 답한 값이 매칭에 어떻게 쓰이는지 즉시 보여 줌.
                  인터뷰 미완료면 컴포넌트 내부에서 null 반환. */}
              <PersonalityScorecard
                personality={
                  (profile.personality as {
                    teamRole?: number; communication?: number; planning?: number
                    risk?: number; quality?: number; time?: number
                  } | null) ?? null
                }
                hoursPerWeek={(() => {
                  // vision_summary.availability.hours_per_week 에 실제 시간 저장됨
                  if (!profile.vision_summary) return null
                  try {
                    const v = JSON.parse(profile.vision_summary)
                    const h = v?.availability?.hours_per_week
                    return typeof h === 'number' ? h : null
                  } catch { return null }
                })()}
                isOwn
              />
              <ProfileSidebar
                profile={profile}
                email={user?.email}
                completion={completion}
                isEditable
              />
            </div>
          )}
          {activeTab === 'portfolio' && (
            <ProfilePortfolio items={portfolioItems} isEditable />
          )}
          {activeTab === 'projects' && (
            <ProfileProjects opportunities={myOpportunities} joinedTeams={myTeams} />
          )}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* 프로필 인사이트 (조회수·매칭 가능 프로젝트·평균 매칭 점수) — 본인 활동 데이터이므로
                  "프로필" 탭이 아닌 "활동" 탭으로 이동. 이전엔 프로필 탭 최상단에 있어서
                  "소개/프로필 정보"와 섞여 정체성 혼란. */}
              <ProfileInsightsWidget />
              <ProfileCoffeeChats />
              <ProfileInvitations />
              <ProfileSentInvitations />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
