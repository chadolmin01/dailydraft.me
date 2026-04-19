'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Printer, Archive, Users, FolderOpen, FileText, Calendar, Sparkles, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/ui/PageContainer'
import { Skeleton } from '@/components/ui/Skeleton'
import { withRetry } from '@/src/lib/query-utils'
import { UPDATE_TYPE_CONFIG } from '@/components/project/types'
import { useClub } from '@/src/hooks/useClub'
import { toReadableContent } from '@/src/lib/ghostwriter/format-content'

interface SnapshotData {
  club: { id: string; name: string; slug: string; description: string | null; category: string | null }
  cohort_meta: {
    name: string
    start_date: string | null
    end_date: string | null
    member_count: number
    project_count: number
  }
  members: Array<{
    user_id: string
    nickname: string | null
    avatar_url: string | null
    position: string | null
    university: string | null
    role: string
    status: string
    joined_at: string | null
  }>
  projects: Array<{
    id: string
    title: string
    description: string | null
    status: string | null
    created_at: string
    interest_tags: string[] | null
    creator: { user_id: string; nickname: string | null; position: string | null } | null
    team_members: Array<{ user_id: string; nickname: string | null; position: string | null; role: string | null }>
    updates: Array<{
      id: string
      week_number: number
      title: string
      content: string
      update_type: string
      created_at: string | null
    }>
  }>
  summary: { total_updates: number; total_decisions: number; total_resources: number }
}

const POSITION_LABEL: Record<string, string> = {
  developer: '개발',
  designer: '디자인',
  pm: '기획',
  marketer: '마케팅',
  data: '데이터',
}

const ROLE_LABEL: Record<string, string> = {
  owner: '대표',
  admin: '운영진',
  member: '멤버',
  alumni: '졸업',
}

export default function CohortArchiveClient({ slug, cohort, clubName }: {
  slug: string
  cohort: string
  clubName: string
}) {
  const queryClient = useQueryClient()
  const { data: club } = useClub(slug)
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'
  const [isGraduating, setIsGraduating] = useState(false)

  const { data, isLoading } = useQuery<SnapshotData>({
    queryKey: ['cohort-snapshot', slug, cohort],
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/clubs/${slug}/cohorts/${encodeURIComponent(cohort)}/snapshot`)
        if (!res.ok) throw new Error('snapshot fetch failed')
        return res.json() as Promise<SnapshotData>
      }),
    staleTime: 1000 * 60 * 5,
  })

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const activeMembers = data?.members.filter(m => m.status === 'active').length ?? 0

  const handleGraduate = async () => {
    if (!isAdmin) return
    if (!confirm(`${cohort}기 멤버들을 일괄 졸업 처리할까요? 이 작업은 되돌리기 어렵습니다. (활성 멤버 ${activeMembers}명, 오너는 제외)`)) return
    setIsGraduating(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/cohorts/${encodeURIComponent(cohort)}/graduate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const body = await res.json().catch(() => ({})) as { data?: { graduated?: number }; error?: { message?: string } }
      if (!res.ok) {
        toast.error(body?.error?.message ?? '졸업 처리에 실패했습니다')
        return
      }
      const n = body.data?.graduated ?? 0
      if (n > 0) {
        toast.success(`${cohort}기 멤버 ${n}명이 알럼나이로 전환되었습니다`)
        queryClient.invalidateQueries({ queryKey: ['cohort-snapshot', slug, cohort] })
      } else {
        toast.info('졸업 대상이 없습니다')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다')
    } finally {
      setIsGraduating(false)
    }
  }

  return (
    <div className="bg-surface-bg min-h-full print:bg-white">
      <PageContainer size="wide" className="pt-6 pb-16">
        {/* 상단 네비 — 인쇄 시 숨김 */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href={`/clubs/${slug}`}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            {clubName}으로
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && activeMembers > 0 && (
              <button
                onClick={handleGraduate}
                disabled={isGraduating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-txt-secondary border border-border rounded-full hover:border-status-danger-text hover:text-status-danger-text transition-colors disabled:opacity-50"
              >
                {isGraduating ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                {isGraduating ? '처리 중' : '기수 졸업 처리'}
              </button>
            )}
            <button
              onClick={handlePrint}
              disabled={!data}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold bg-brand text-white rounded-full hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              <Printer size={14} />
              PDF로 인쇄
            </button>
          </div>
        </div>

        {/* 헤더 */}
        <div className="mb-8 print:mb-6">
          <div className="flex items-center gap-2 mb-1 print:hidden">
            <Archive size={16} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">기수 아카이브</p>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight print:text-[24px]">
            {clubName} {cohort}기 활동 기록
          </h1>
          {data?.cohort_meta && (
            <p className="text-[14px] text-txt-secondary mt-1.5">
              {data.cohort_meta.start_date && (
                <>{new Date(data.cohort_meta.start_date).toLocaleDateString('ko-KR')} ~ </>
              )}
              {data.cohort_meta.end_date && new Date(data.cohort_meta.end_date).toLocaleDateString('ko-KR')}
              {' · '}
              멤버 {data.cohort_meta.member_count}명 · 프로젝트 {data.cohort_meta.project_count}개
            </p>
          )}
        </div>

        {isLoading || !data ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {/* 요약 */}
            <section>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Users size={14} />} label="멤버" value={data.cohort_meta.member_count} />
                <StatCard icon={<FolderOpen size={14} />} label="프로젝트" value={data.cohort_meta.project_count} />
                <StatCard icon={<FileText size={14} />} label="주간 기록" value={data.summary.total_updates} />
                <StatCard icon={<Sparkles size={14} />} label="의사결정" value={data.summary.total_decisions} />
              </div>
            </section>

            {/* 멤버 */}
            {data.members.length > 0 && (
              <section>
                <h2 className="text-[18px] font-bold text-txt-primary mb-4 flex items-center gap-2 print:text-[16px]">
                  <GraduationCap size={16} className="text-brand" />
                  {cohort}기 멤버 {data.members.length}명
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-4">
                  {data.members.map(m => (
                    <div key={m.user_id} className="bg-surface-card border border-border rounded-xl p-4 text-center print:rounded-none">
                      <div className="w-12 h-12 mx-auto rounded-full bg-brand-bg flex items-center justify-center text-[16px] font-bold text-brand mb-2">
                        {m.nickname?.[0] ?? '?'}
                      </div>
                      <p className="text-[13px] font-bold text-txt-primary truncate">{m.nickname ?? '익명'}</p>
                      <p className="text-[11px] text-txt-tertiary mt-0.5">
                        {ROLE_LABEL[m.role] ?? m.role}
                        {m.position && ` · ${POSITION_LABEL[m.position] ?? m.position}`}
                      </p>
                      {m.university && (
                        <p className="text-[10px] text-txt-disabled mt-0.5 truncate">{m.university}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 프로젝트 상세 */}
            {data.projects.length > 0 && (
              <section>
                <h2 className="text-[18px] font-bold text-txt-primary mb-4 flex items-center gap-2 print:text-[16px]">
                  <FolderOpen size={16} className="text-brand" />
                  {cohort}기 프로젝트 {data.projects.length}개
                </h2>
                <div className="space-y-6">
                  {data.projects.map(proj => (
                    <article key={proj.id} className="bg-surface-card border border-border rounded-2xl p-6 print:rounded-none print:border-black print:break-inside-avoid">
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[18px] font-bold text-txt-primary">{proj.title}</h3>
                          {proj.description && (
                            <p className="text-[14px] text-txt-secondary mt-1 leading-relaxed">{proj.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          proj.status === 'active'
                            ? 'bg-status-success-bg text-status-success-text'
                            : 'bg-surface-sunken text-txt-tertiary'
                        }`}>
                          {proj.status === 'active' ? '진행 중' : '종료'}
                        </span>
                      </div>

                      {/* 팀 구성 */}
                      <div className="mb-4 flex items-center gap-2 text-[12px] text-txt-tertiary flex-wrap">
                        <Calendar size={12} />
                        <span>개설: {new Date(proj.created_at).toLocaleDateString('ko-KR')}</span>
                        <span className="text-border">·</span>
                        <span>리더: {proj.creator?.nickname ?? '—'}</span>
                        {proj.team_members.length > 0 && (
                          <>
                            <span className="text-border">·</span>
                            <span>팀원: {proj.team_members.map(t => t.nickname ?? '?').join(', ')}</span>
                          </>
                        )}
                      </div>

                      {proj.interest_tags && proj.interest_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {proj.interest_tags.map(tag => (
                            <span key={tag} className="text-[11px] font-medium text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 주간 기록 */}
                      {proj.updates.length > 0 ? (
                        <div className="border-t border-border pt-4">
                          <p className="text-[12px] font-semibold text-txt-tertiary mb-3">
                            주간 기록 ({proj.updates.length}건)
                          </p>
                          <ol className="space-y-3">
                            {proj.updates.map(u => {
                              const cfg = UPDATE_TYPE_CONFIG[u.update_type] ?? UPDATE_TYPE_CONFIG.general
                              return (
                                <li key={u.id} className="border-l-2 border-border pl-4 print:break-inside-avoid">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-[12px] font-bold text-txt-primary">{u.week_number}주차</span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badgeColor}`}>
                                      {cfg.label}
                                    </span>
                                    {u.created_at && (
                                      <span className="text-[11px] text-txt-tertiary">
                                        {new Date(u.created_at).toLocaleDateString('ko-KR')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[13px] font-semibold text-txt-primary">{u.title}</p>
                                  <p className="text-[12px] text-txt-secondary leading-relaxed whitespace-pre-line mt-1">
                                    {toReadableContent(u.content)}
                                  </p>
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      ) : (
                        <div className="border-t border-border pt-4">
                          <p className="text-[12px] text-txt-disabled">주간 기록 없음</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 사용 안내 — 인쇄 시 숨김 */}
            <section className="bg-brand-bg border border-brand-border rounded-2xl p-5 print:hidden">
              <div className="flex gap-3">
                <Sparkles size={16} className="text-brand shrink-0 mt-0.5" />
                <div className="text-[13px] text-txt-secondary leading-relaxed">
                  <p className="font-semibold text-txt-primary mb-1">이 기록은 자산입니다</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>창업지원단·LINC 성과보고 첨부 자료</li>
                    <li>다음 기수 온보딩 참고 자료</li>
                    <li>알럼나이 포트폴리오 공유 (공유 링크 복사 가능)</li>
                    <li>기수 종료 행사 출력용</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </PageContainer>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 print:rounded-none print:border-black">
      <div className="flex items-center gap-1.5 text-txt-tertiary mb-2">
        {icon}
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="text-[26px] font-bold text-txt-primary tabular-nums">{value}</div>
    </div>
  )
}
