'use client'

import { useClubBotActivity } from '@/src/hooks/useClub'
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  ListTodo,
  MessageSquare,
  XCircle,
} from 'lucide-react'

// 패턴 타입 → 한국어 라벨
const PATTERN_LABELS: Record<string, string> = {
  'vote-needed': '투표 제안',
  'blocker': '블로커 감지',
  'question-buried': '질문 묻힘',
  'schedule-confirmed': '일정 확정',
  'conversation-end': '마무리 요약',
  'task-assigned': '할 일 배정',
  'decision-made': '결정 사항',
  'resource-shared': '자료 공유',
}

// 리소스 타입 → 한국어 라벨
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  design: '디자인',
  code: '코드',
  document: '문서',
  link: '링크',
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '-'

  const diff = Date.now() - date.getTime()
  if (diff < 60000) return '방금'

  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/** javascript: 등 위험 프로토콜 차단 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ClubBotActivity({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useClubBotActivity(slug)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-border-default/20 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={40} className="mx-auto text-txt-disabled mb-3" />
        <p className="text-sm text-txt-tertiary">데이터를 불러오는 데 실패했습니다</p>
        <p className="text-xs text-txt-disabled mt-1">잠시 후 다시 시도해 주십시오</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={40} className="mx-auto text-txt-disabled mb-3" />
        <p className="text-sm text-txt-tertiary">봇 활동 데이터를 불러올 수 없습니다</p>
      </div>
    )
  }

  const { summary, tasks, decisions, resources, interventions } = data
  const hasAnyData = interventions.length > 0 || tasks.length > 0 || decisions.length > 0 || resources.length > 0

  if (!hasAnyData) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={40} className="mx-auto text-txt-disabled mb-3" />
        <p className="text-sm text-txt-tertiary">아직 봇 활동이 없습니다</p>
        <p className="text-xs text-txt-disabled mt-1">Discord에서 대화가 감지되면 여기에 표시됩니다</p>
      </div>
    )
  }

  const totalTasks = summary.completed_tasks + summary.pending_tasks

  return (
    <div className="space-y-6">

      {/* ─── 요약 카드 ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="감지" value={summary.total_interventions} />
        <StatCard
          label="수락률"
          value={summary.acceptance_rate !== null ? `${summary.acceptance_rate}%` : '-'}
        />
        <StatCard
          label="할 일"
          value={totalTasks > 0 ? `${summary.completed_tasks}/${totalTasks}` : '-'}
        />
        <StatCard label="결정" value={summary.total_decisions} />
      </div>

      {/* ─── 할 일 목록 ─── */}
      {tasks.length > 0 && (
        <Section title="할 일" icon={<ListTodo size={15} />} count={tasks.length}>
          <div className="space-y-1">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-bg-sunken/50 transition-colors"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" aria-label="완료됨" />
                ) : (
                  <Circle size={16} className="text-txt-disabled mt-0.5 shrink-0" aria-label="미완료" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === 'completed' ? 'text-txt-tertiary line-through' : 'text-txt-primary'}`}>
                    {task.task_description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-txt-tertiary">
                    <span>{task.assignee_name}</span>
                    {task.deadline && (
                      <>
                        <span className="w-[3px] h-[3px] rounded-full bg-txt-disabled" />
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(task.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-txt-disabled shrink-0">{formatRelativeDate(task.created_at)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── 결정 사항 ─── */}
      {decisions.length > 0 && (
        <Section title="결정 사항" icon={<FileText size={15} />} count={decisions.length}>
          <div className="space-y-1">
            {decisions.map(d => (
              <div key={d.id} className="py-2.5 px-3 rounded-lg hover:bg-bg-sunken/50 transition-colors">
                <p className="text-sm font-semibold text-txt-primary">{d.topic}</p>
                <p className="text-sm text-txt-secondary mt-0.5">{d.result}</p>
                <span className="text-xs text-txt-disabled">{formatRelativeDate(d.decided_at)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── 공유 자료 ─── */}
      {resources.length > 0 && (
        <Section title="공유된 자료" icon={<Link2 size={15} />} count={resources.length}>
          <div className="space-y-1">
            {resources.map(r => {
              const safe = isSafeUrl(r.url)
              return safe ? (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${r.label} 링크 열기`}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-bg-sunken/50 transition-colors group"
                >
                  <ResourceContent r={r} />
                  <ExternalLink size={14} className="text-txt-disabled group-hover:text-brand shrink-0 transition-colors" />
                </a>
              ) : (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                >
                  <ResourceContent r={r} />
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ─── 최근 감지 로그 ─── */}
      {interventions.length > 0 && (
        <Section title="감지 로그" icon={<MessageSquare size={15} />} count={interventions.length}>
          <div className="space-y-1">
            {interventions.map(iv => (
              <div
                key={iv.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bg-sunken/50 transition-colors"
              >
                <ResponseIcon response={iv.user_response} />
                <span className="text-sm text-txt-primary flex-1">
                  {PATTERN_LABELS[iv.pattern_type] ?? iv.pattern_type}
                </span>
                <span className="text-xs text-txt-disabled shrink-0">
                  {formatRelativeDate(iv.created_at)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Sub-components ───

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl p-4 text-center">
      <div className="text-xl font-extrabold text-txt-primary">{value}</div>
      <div className="text-xs text-txt-tertiary mt-1">{label}</div>
    </div>
  )
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-txt-tertiary">{icon}</span>
        <h3 className="text-[15px] font-bold text-txt-primary">{title}</h3>
        <span className="text-xs text-txt-disabled">{count}</span>
      </div>
      {children}
    </div>
  )
}

function ResponseIcon({ response }: { response: string | null }) {
  if (response === 'accepted') return <CheckCircle2 size={14} className="text-success shrink-0" aria-label="수락됨" />
  if (response === 'dismissed') return <XCircle size={14} className="text-danger shrink-0" aria-label="무시됨" />
  return <Circle size={14} className="text-txt-disabled shrink-0" aria-label="대기 중" />
}

function ResourceContent({ r }: { r: { label: string; shared_by_name: string; resource_type: string } }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-txt-primary group-hover:text-brand transition-colors truncate">
        {r.label}
      </p>
      <div className="flex items-center gap-2 mt-0.5 text-xs text-txt-tertiary">
        <span>{r.shared_by_name}</span>
        <span className="w-[3px] h-[3px] rounded-full bg-txt-disabled" />
        <span>{RESOURCE_TYPE_LABELS[r.resource_type] ?? r.resource_type}</span>
      </div>
    </div>
  )
}
