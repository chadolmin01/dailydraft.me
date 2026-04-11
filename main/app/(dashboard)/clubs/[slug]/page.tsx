'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2, MapPin, Link as LinkIcon, Settings, Users, FolderOpen, Archive, Share2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useClub, useClubMembers, useClubStats } from '@/src/hooks/useClub'
import { useAuth } from '@/src/context/AuthContext'

// --- 역할 기본 라벨 ---
const ROLE_LABELS: Record<string, string> = {
  owner: '대표',
  admin: '운영진',
  member: '멤버',
  alumni: '졸업',
}

type Tab = 'intro' | 'projects' | 'members' | 'archive'

export default function ClubPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('intro')
  const [memberCohort, setMemberCohort] = useState<string>()

  const { data: club, isLoading } = useClub(slug)
  const { data: stats } = useClubStats(slug)
  const { data: membersData } = useClubMembers(slug, { cohort: memberCohort, limit: 50 })

  // 현재 유저의 역할 (관리자 버튼 표시 여부)
  const isAdmin = membersData?.members.some(
    m => m.user_id === user?.id && (m.role === 'owner' || m.role === 'admin')
  )

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-border-default/30 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-border-default/30 rounded w-40" />
              <div className="h-4 bg-border-default/30 rounded w-64" />
            </div>
          </div>
          <div className="h-48 bg-border-default/30 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const universityName = club.badges.find(b => b.type === 'university')?.university?.name

  return (
    <div className="max-w-3xl mx-auto px-5 py-6">

      {/* ═══ Club Header Card ═══ */}
      <div className="bg-surface-card border border-border-default rounded-2xl p-6 mb-6">

        {/* Top: Logo + Name + Actions */}
        <div className="flex items-start gap-4 mb-5">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} width={64} height={64} className="rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-bg-sunken flex items-center justify-center text-lg font-extrabold text-txt-secondary shrink-0">
              {club.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-extrabold text-txt-primary truncate">{club.name}</h1>
              {club.category && (
                <span className="shrink-0 text-xs font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full">
                  {club.category}
                </span>
              )}
            </div>
            {club.description && (
              <p className="text-sm text-txt-secondary line-clamp-2">{club.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('링크가 복사되었습니다') }}
              className="h-8 px-3 text-xs font-semibold text-txt-secondary border border-border-default rounded-lg hover:bg-bg-sunken transition-colors"
            >
              공유
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push(`/clubs/${slug}/settings/discord`)}
                className="h-8 w-8 flex items-center justify-center text-txt-tertiary border border-border-default rounded-lg hover:bg-bg-sunken transition-colors"
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex flex-col gap-2.5 mb-5 text-sm">
          {universityName && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-txt-tertiary shrink-0" />
              <span className="text-txt-tertiary w-10 shrink-0">소속</span>
              <span className="text-txt-primary">{universityName}</span>
            </div>
          )}
          {club.badges.length === 0 && club.owner.nickname && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-txt-tertiary shrink-0" />
              <span className="text-txt-tertiary w-10 shrink-0">운영</span>
              <span className="text-txt-primary">{club.owner.nickname}</span>
            </div>
          )}
        </div>

        {/* Member Avatars + Stats */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {(membersData?.members || []).slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-bg-sunken border-2 border-surface-card flex items-center justify-center text-[10px] font-bold text-txt-secondary"
                style={{ zIndex: 5 - i }}
              >
                {m.nickname?.[0] || '?'}
              </div>
            ))}
          </div>
          <span className="text-[13px] text-txt-secondary">멤버 {club.member_count}명</span>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-txt-secondary">
          {club.cohorts.length > 0 && (
            <span>{club.cohorts[club.cohorts.length - 1]}기 운영 중</span>
          )}
          {stats && (
            <>
              {club.cohorts.length > 0 && <span className="w-[3px] h-[3px] rounded-full bg-txt-disabled" />}
              <span>프로젝트 {stats.project_count}개</span>
              <span className="w-[3px] h-[3px] rounded-full bg-txt-disabled" />
              <span>주간 업데이트 {stats.weekly_updates_count}건</span>
            </>
          )}
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex border-b border-border-default mb-6">
        {([
          { key: 'intro', label: '소개' },
          { key: 'projects', label: '프로젝트' },
          { key: 'members', label: '멤버' },
          { key: 'archive', label: '기수 아카이브' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-[15px] font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'text-txt-primary border-txt-primary'
                : 'text-txt-tertiary border-transparent hover:text-txt-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Contents ═══ */}

      {/* 소개 */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          {club.description && (
            <div>
              <h3 className="text-base font-bold text-txt-primary mb-2.5">클럽 소개</h3>
              <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">{club.description}</p>
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => router.push(`/clubs/${slug}/settings/discord`)}
              className="flex items-center gap-3 w-full p-4 bg-surface-card border border-border-default rounded-xl hover:border-brand transition-colors text-left"
            >
              <Settings size={16} className="text-txt-tertiary" />
              <span className="text-sm font-semibold text-txt-primary">클럽 설정 관리</span>
              <ChevronRight size={14} className="text-txt-disabled ml-auto" />
            </button>
          )}
        </div>
      )}

      {/* 프로젝트 — 향후 opportunities.club_id 연동 */}
      {activeTab === 'projects' && (
        <div className="text-center py-16">
          <FolderOpen size={40} className="mx-auto text-txt-disabled mb-3" />
          <p className="text-sm text-txt-tertiary">아직 등록된 프로젝트가 없습니다</p>
        </div>
      )}

      {/* 멤버 */}
      {activeTab === 'members' && (
        <div>
          {/* 기수 필터 */}
          {club.cohorts.length > 0 && (
            <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setMemberCohort(undefined)}
                className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
                  !memberCohort ? 'bg-txt-primary text-white border-txt-primary' : 'text-txt-secondary border-border-default hover:bg-bg-sunken'
                }`}
              >
                전체
              </button>
              {[...club.cohorts].reverse().map(c => (
                <button
                  key={c}
                  onClick={() => setMemberCohort(c)}
                  className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
                    memberCohort === c ? 'bg-txt-primary text-white border-txt-primary' : 'text-txt-secondary border-border-default hover:bg-bg-sunken'
                  }`}
                >
                  {c}기
                </button>
              ))}
            </div>
          )}

          {/* 멤버 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(membersData?.members || []).map(m => (
              <div
                key={m.id}
                className="bg-surface-card border border-border-default rounded-xl p-5 flex flex-col items-center text-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {m.avatar_url ? (
                  <Image src={m.avatar_url} alt={m.nickname || ''} width={48} height={48} className="rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-bg-sunken flex items-center justify-center text-base font-bold text-txt-secondary">
                    {m.nickname?.[0] || '?'}
                  </div>
                )}
                <div className="text-[15px] font-bold text-txt-primary">{m.nickname || '익명'}</div>
                <div className="text-[13px] text-txt-secondary">
                  {m.display_role || ROLE_LABELS[m.role] || m.role}
                </div>
                <div className="text-xs text-txt-tertiary">
                  {[m.cohort ? `${m.cohort}기` : null, m.university].filter(Boolean).join(' · ')}
                </div>
                {m.skills && m.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                    {m.skills.slice(0, 3).map(s => (
                      <span key={s.name} className="text-xs text-brand bg-brand-bg px-2 py-0.5 rounded-full font-medium">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {membersData && membersData.members.length === 0 && (
            <div className="text-center py-16">
              <Users size={40} className="mx-auto text-txt-disabled mb-3" />
              <p className="text-sm text-txt-tertiary">멤버가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* 기수 아카이브 */}
      {activeTab === 'archive' && (
        <div className="flex flex-col">
          {club.cohorts.length === 0 ? (
            <div className="text-center py-16">
              <Archive size={40} className="mx-auto text-txt-disabled mb-3" />
              <p className="text-sm text-txt-tertiary">기수 정보가 없습니다</p>
            </div>
          ) : (
            [...club.cohorts].reverse().map((cohort, idx) => {
              const isLatest = idx === 0
              const cohortCount = stats?.members.by_cohort[cohort] ?? 0
              return (
                <div key={cohort} className="flex gap-4 pb-6">
                  {/* 타임라인 인디케이터 */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLatest ? 'bg-brand' : 'bg-txt-disabled'}`} />
                    {idx < club.cohorts.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border-light mt-1" />
                    )}
                  </div>
                  {/* 내용 */}
                  <div className="flex-1 pb-4 border-b border-border-light last:border-b-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-[15px] font-bold text-txt-primary">{cohort}기</span>
                      {isLatest && (
                        <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">진행 중</span>
                      )}
                    </div>
                    <div className="text-[13px] text-txt-secondary">
                      멤버 {cohortCount}명
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
