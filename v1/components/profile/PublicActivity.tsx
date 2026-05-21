'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Building2, FolderOpen, FileText, ArrowRight } from 'lucide-react'
import { withRetry } from '@/src/lib/query-utils'

interface Club {
  id: string
  slug: string
  name: string
  logo_url: string | null
  category: string | null
}

interface Membership {
  role: string
  cohort: string | null
  joined_at: string | null
  status: string
  club: Club | null
}

interface Project {
  id: string
  title: string
  status: string | null
  cohort: string | null
  created_at: string
  interest_tags: string[] | null
  club: { slug: string; name: string } | null
  role: string
}

interface PublicActivityData {
  clubs: Membership[]
  projects: Project[]
  contributions: { updates: number; latest_update_at: string | null }
}

const ROLE_LABEL: Record<string, string> = {
  owner: '대표',
  admin: '운영진',
  member: '멤버',
  alumni: '졸업',
  creator: '프로젝트 리더',
}

export function PublicActivity({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<PublicActivityData>({
    queryKey: ['public-activity', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/users/${userId}/public-activity`)
        if (!res.ok) throw new Error('Public activity fetch failed')
        return res.json() as Promise<PublicActivityData>
      }),
  })

  if (isLoading || !data) return null
  if (data.clubs.length === 0 && data.projects.length === 0) return null

  return (
    <div className="space-y-8">
      {/* 소속 이력 */}
      {data.clubs.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3 flex items-center gap-1.5">
            <Building2 size={13} />
            소속 이력
          </h2>
          <div className="space-y-2">
            {data.clubs.map((m, idx) => {
              if (!m.club) return null
              const roleLabel = ROLE_LABEL[m.role] ?? m.role
              const year = m.joined_at ? new Date(m.joined_at).getFullYear() : null
              return (
                <Link
                  key={`${m.club.id}-${idx}`}
                  href={`/clubs/${m.club.slug}`}
                  className="flex items-center gap-3 bg-surface-card border border-border rounded-xl p-4 ob-ring-glow group"
                >
                  {m.club.logo_url ? (
                    <Image src={m.club.logo_url} alt={m.club.name} width={40} height={40} className="rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-sm font-extrabold text-brand shrink-0">
                      {m.club.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-txt-primary truncate">{m.club.name}</p>
                    <p className="text-xs text-txt-tertiary mt-0.5">
                      {roleLabel}
                      {m.cohort && <> · {m.cohort}기</>}
                      {year && <> · {year}년 합류</>}
                      {m.status === 'alumni' && <> · 졸업</>}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 참여 프로젝트 */}
      {data.projects.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3 flex items-center gap-1.5">
            <FolderOpen size={13} />
            참여 프로젝트 {data.projects.length}건
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.projects.slice(0, 10).map(p => (
              <Link
                key={p.id}
                href={`/p/${p.id}`}
                className="block bg-surface-card border border-border rounded-xl p-4 ob-ring-glow group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-txt-primary line-clamp-1 flex-1">{p.title}</p>
                  {p.status === 'active' ? (
                    <span className="shrink-0 text-[10px] font-semibold text-status-success-text bg-status-success-bg px-1.5 py-0.5 rounded-full">
                      진행
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-medium text-txt-disabled bg-surface-sunken px-1.5 py-0.5 rounded-full">
                      종료
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-txt-tertiary">
                  {ROLE_LABEL[p.role] ?? p.role}
                  {p.cohort && <> · {p.cohort}기</>}
                  {p.club && <> · {p.club.name}</>}
                </p>
                {p.interest_tags && p.interest_tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {p.interest_tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-brand bg-brand-bg px-1.5 py-0.5 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 기여 요약 */}
      {data.contributions.updates > 0 && (
        <section className="bg-surface-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
              <FileText size={16} className="text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-txt-primary">
                주간 회고 <span className="tabular-nums">{data.contributions.updates}</span>건 작성
              </p>
              <p className="text-xs text-txt-tertiary">
                프로젝트 진행 과정을 꾸준히 기록한 크리에이터입니다
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
