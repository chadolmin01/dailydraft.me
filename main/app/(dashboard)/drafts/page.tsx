import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileEdit, ArrowRight, Sparkles, Inbox } from 'lucide-react'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { PageContainer } from '@/components/ui/PageContainer'

export const dynamic = 'force-dynamic'

const UPDATE_TYPE_LABEL: Record<string, string> = {
  weekly: '주간',
  milestone: '마일스톤',
  retro: '회고',
  decision: '의사결정',
  blocker: '블로커',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default async function DraftsListPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/drafts')

  const admin = createAdminClient()
  const { data: drafts = [] } = await admin
    .from('weekly_update_drafts')
    .select('id, opportunity_id, week_number, title, content, update_type, source_message_count, status, created_at')
    .eq('target_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const projectIds = Array.from(new Set((drafts ?? []).map(d => d.opportunity_id).filter(Boolean)))
  const { data: projects = [] } = projectIds.length
    ? await admin.from('opportunities').select('id, title').in('id', projectIds)
    : { data: [] as Array<{ id: string; title: string }> }
  const projectMap = new Map((projects ?? []).map(p => [p.id, p.title]))

  const list = drafts ?? []

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="wide" className="pt-6 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">AI 주간 업데이트</p>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight">
            승인 대기 중인 초안
          </h1>
          <p className="text-[14px] text-txt-secondary mt-1.5">
            Ghostwriter 가 Discord 활동을 요약해 초안으로 만들어 둔 것입니다. 검토 후 승인하시면 프로젝트 업데이트로 게시됩니다.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="bg-surface-card border border-border rounded-2xl p-12 text-center">
            <Inbox size={32} className="text-txt-disabled mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-txt-primary mb-1">대기 중인 초안이 없습니다</p>
            <p className="text-[13px] text-txt-tertiary">
              다음 주에 Ghostwriter가 새 초안을 자동으로 보내드려요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(d => (
              <Link
                key={d.id}
                href={`/drafts/${d.id}`}
                className="flex items-center gap-4 bg-surface-card rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover-spring group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                  <FileEdit size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-bold text-txt-primary truncate">{d.title}</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[12px] text-txt-tertiary">
                    {projectMap.get(d.opportunity_id) && (
                      <>
                        <span className="font-medium text-txt-secondary">
                          {projectMap.get(d.opportunity_id)}
                        </span>
                        <span className="text-border">·</span>
                      </>
                    )}
                    <span>{d.week_number}주차</span>
                    {UPDATE_TYPE_LABEL[d.update_type] && (
                      <>
                        <span className="text-border">·</span>
                        <span>{UPDATE_TYPE_LABEL[d.update_type]}</span>
                      </>
                    )}
                    {d.source_message_count ? (
                      <>
                        <span className="text-border">·</span>
                        <span>디스코드 메시지 {d.source_message_count}건</span>
                      </>
                    ) : null}
                    <span className="text-border">·</span>
                    <span>{timeAgo(d.created_at)}</span>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
