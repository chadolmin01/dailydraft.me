'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Printer, GraduationCap, FolderOpen, FileText, Sparkles, Calendar } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { Skeleton } from '@/components/ui/Skeleton'
import { APP_URL } from '@/src/constants'

interface CertificateData {
  club: { id: string; name: string; slug: string; category: string | null }
  profile: {
    nickname: string
    university: string | null
    major: string | null
    position: string | null
  }
  memberships: Array<{
    role: string
    cohort: string | null
    status: string
    joined_at: string | null
    display_role: string | null
  }>
  summary: {
    first_joined_at: string | null
    end_date: string | null
    is_alumni: boolean
    highest_role: string
    cohorts: string[]
    projects_count: number
    updates_count: number
  }
  projects: Array<{
    id: string
    title: string
    cohort: string | null
    created_at: string
    status: string | null
    role: string
  }>
  generated_at: string
}

const ROLE_LABEL: Record<string, string> = {
  owner: '대표',
  admin: '운영진',
  member: '정회원',
  alumni: '졸업회원',
  creator: '프로젝트 리더',
}

export default function CertificateClient({ slug, targetUserId }: {
  slug: string
  targetUserId: string | null
}) {
  const { data, isLoading, error } = useQuery<CertificateData>({
    queryKey: ['certificate', slug, targetUserId],
    queryFn: async () => {
      const qs = targetUserId ? `?user_id=${encodeURIComponent(targetUserId)}` : ''
      const res = await fetch(`/api/clubs/${slug}/certificate${qs}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '발급 실패')
      }
      const body = await res.json()
      return body.data ?? body
    },
    staleTime: 1000 * 60 * 5,
  })

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="bg-surface-bg min-h-full print:bg-white">
      <PageContainer size="narrow" className="pt-6 pb-16">
        {/* 상단 네비 — 인쇄 시 숨김 */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href={`/clubs/${slug}`}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            클럽으로
          </Link>
          <button
            onClick={handlePrint}
            disabled={!data}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold bg-brand text-white rounded-full hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            <Printer size={14} />
            PDF로 저장
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : error ? (
          <div className="bg-surface-card border border-border rounded-2xl p-12 text-center">
            <p className="text-[14px] text-status-danger-text">
              {error instanceof Error ? error.message : '증명서를 발급할 수 없습니다'}
            </p>
          </div>
        ) : data ? (
          <article className="bg-surface-card border border-border rounded-2xl p-8 sm:p-12 print:border print:border-black print:rounded-none">
            {/* 헤더 */}
            <header className="text-center mb-10 pb-6 border-b-2 border-txt-primary">
              <p className="text-[11px] font-semibold tracking-widest text-txt-tertiary uppercase mb-2">
                Activity Certificate · 활동 증명서
              </p>
              <h1 className="text-[28px] font-bold text-txt-primary">{data.club.name}</h1>
              {data.club.category && (
                <p className="text-[13px] text-txt-tertiary mt-1">{data.club.category}</p>
              )}
            </header>

            {/* 본인 정보 */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold tracking-wider text-txt-tertiary uppercase mb-3">
                증명 대상
              </h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex gap-3">
                  <span className="text-txt-tertiary w-20 shrink-0">이름</span>
                  <span className="font-semibold text-txt-primary">{data.profile.nickname}</span>
                </div>
                {data.profile.university && (
                  <div className="flex gap-3">
                    <span className="text-txt-tertiary w-20 shrink-0">학교</span>
                    <span className="text-txt-primary">
                      {data.profile.university}
                      {data.profile.major && ` · ${data.profile.major}`}
                    </span>
                  </div>
                )}
                {data.profile.position && (
                  <div className="flex gap-3">
                    <span className="text-txt-tertiary w-20 shrink-0">분야</span>
                    <span className="text-txt-primary">{data.profile.position}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 활동 요약 */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold tracking-wider text-txt-tertiary uppercase mb-3 flex items-center gap-1.5">
                <GraduationCap size={12} />
                활동 요약
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCell label="최고 역할" value={ROLE_LABEL[data.summary.highest_role] ?? data.summary.highest_role} />
                <SummaryCell label="참여 기수" value={data.summary.cohorts.length > 0 ? `${data.summary.cohorts.join(', ')}기` : '-'} />
                <SummaryCell label="참여 프로젝트" value={`${data.summary.projects_count}건`} />
                <SummaryCell label="작성 기록" value={`${data.summary.updates_count}건`} />
              </div>
              {data.summary.first_joined_at && (
                <p className="text-[12px] text-txt-tertiary mt-3 flex items-center gap-1.5">
                  <Calendar size={11} />
                  활동 기간: {new Date(data.summary.first_joined_at).toLocaleDateString('ko-KR')}
                  {data.summary.end_date && ` ~ ${new Date(data.summary.end_date).toLocaleDateString('ko-KR')} (졸업)`}
                  {!data.summary.end_date && ` ~ 현재`}
                </p>
              )}
            </section>

            {/* 기수별 역할 */}
            {data.memberships.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[11px] font-semibold tracking-wider text-txt-tertiary uppercase mb-3">
                  기수별 역할
                </h2>
                <ul className="space-y-1.5">
                  {data.memberships.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[13px]">
                      <span className="text-txt-tertiary w-20 shrink-0">
                        {m.cohort ? `${m.cohort}기` : '기수 미지정'}
                      </span>
                      <span className="font-medium text-txt-primary">
                        {m.display_role || ROLE_LABEL[m.role] || m.role}
                      </span>
                      <span className="text-txt-tertiary ml-auto text-[12px]">
                        {m.joined_at && new Date(m.joined_at).toLocaleDateString('ko-KR')}
                        {m.status === 'alumni' && ' · 졸업'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 참여 프로젝트 */}
            {data.projects.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[11px] font-semibold tracking-wider text-txt-tertiary uppercase mb-3 flex items-center gap-1.5">
                  <FolderOpen size={12} />
                  참여 프로젝트 {data.projects.length}건
                </h2>
                <ul className="space-y-2">
                  {data.projects.map(p => (
                    <li key={p.id} className="flex items-start gap-3 text-[13px] py-1.5 border-b border-border last:border-0">
                      <span className="text-txt-tertiary w-20 shrink-0">
                        {p.cohort ? `${p.cohort}기` : '-'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-txt-primary">{p.title}</p>
                        <p className="text-[11px] text-txt-tertiary mt-0.5">
                          {ROLE_LABEL[p.role] ?? p.role}
                          {p.status === 'active' && ' · 진행 중'}
                          {p.status !== 'active' && ' · 종료'}
                        </p>
                      </div>
                      <span className="text-[11px] text-txt-tertiary shrink-0">
                        {new Date(p.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 발급 정보 */}
            <footer className="pt-6 border-t border-border text-center">
              <p className="text-[11px] text-txt-tertiary mb-1">
                발급일: {new Date(data.generated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-txt-tertiary">
                본 증명서는 Draft에 기록된 활동 데이터를 기반으로 자동 생성되었습니다
              </p>
              <p className="text-[10px] text-txt-disabled mt-2 font-mono break-all">
                {APP_URL}/clubs/{slug}/certificate
              </p>
            </footer>
          </article>
        ) : null}

        {/* 안내 — 인쇄 시 숨김 */}
        <div className="mt-6 bg-brand-bg border border-brand-border rounded-2xl p-5 print:hidden">
          <div className="flex gap-3">
            <Sparkles size={16} className="text-brand shrink-0 mt-0.5" />
            <div className="text-[13px] text-txt-secondary leading-relaxed">
              <p className="font-semibold text-txt-primary mb-1 flex items-center gap-1.5">
                <FileText size={12} />
                이 증명서를 활용하세요
              </p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>취업 이력서 첨부 (동아리 활동 증빙)</li>
                <li>대학원·교환학생 지원서</li>
                <li>장학금·지원사업 활동 내역</li>
                <li>포트폴리오 공유용 PDF</li>
              </ul>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-bg border border-border rounded-xl p-3 print:border-black">
      <p className="text-[10px] text-txt-tertiary">{label}</p>
      <p className="text-[14px] font-bold text-txt-primary mt-0.5 tabular-nums">{value}</p>
    </div>
  )
}
