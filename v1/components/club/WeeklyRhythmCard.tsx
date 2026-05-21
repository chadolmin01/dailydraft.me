'use client'

import { useMemo } from 'react'
import { Calendar, Coffee, FileText, Sparkles, BarChart3 } from 'lucide-react'

interface WeeklyRhythmProps {
  pendingTeams: number
  totalTeams: number
  submissionRate: number
}

/**
 * 이번 주 운영 리듬 카드 — 요일별 권장 액션.
 * 근거: 주간 업데이트 사이클이 월→금이 기본. 운영자의 주간 루틴을 문서로 고정하는 역할.
 */
export function WeeklyRhythmCard({ pendingTeams, totalTeams, submissionRate }: WeeklyRhythmProps) {
  const today = new Date().getDay() // 0=일 1=월 ... 6=토

  const focus = useMemo(() => {
    if (today === 1) {
      return {
        icon: BarChart3,
        title: '월요일 — 지난주 요약 확인',
        body: '다이제스트 이메일 확인 후, 리듬이 깨진 팀에 먼저 연락하세요',
      }
    }
    if (today >= 2 && today <= 3) {
      return {
        icon: Coffee,
        title: `${today === 2 ? '화' : '수'}요일 — 팀 체크인`,
        body: pendingTeams > 0
          ? `미제출 ${pendingTeams}팀의 블로커를 파악할 시점입니다`
          : '모든 팀이 제출했습니다. 멘토링 매칭이나 리소스 공유에 집중하세요',
      }
    }
    if (today === 4) {
      return {
        icon: FileText,
        title: '목요일 — 주간 회고 리마인드',
        body: '팀장들에게 이번 주 업데이트 작성을 슬쩍 환기해보세요',
      }
    }
    if (today === 5) {
      return {
        icon: FileText,
        title: '금요일 — 회고 마감일',
        body: pendingTeams > 0
          ? `오늘 안에 ${pendingTeams}팀이 회고를 남기면 좋겠습니다`
          : `이번 주 ${submissionRate}% 제출 완료. 다음주 준비를 시작할 시간입니다`,
      }
    }
    if (today === 6 || today === 0) {
      return {
        icon: Sparkles,
        title: today === 6 ? '토요일 — 잠시 숨 고르기' : '일요일 — 다음주 설계',
        body: today === 0
          ? '운영자 다이제스트가 내일 아침 발송됩니다. 이번 주 KPI를 미리 훑어보세요'
          : '회고와 체크리스트가 밀려있다면 이번 주말을 활용하세요',
      }
    }
    return null
  }, [today, pendingTeams, submissionRate])

  if (!focus) return null
  const Icon = focus.icon

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Icon size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand mb-0.5">
            <Calendar size={11} />
            이번 주 포커스
          </div>
          <p className="text-[14px] font-bold text-txt-primary">{focus.title}</p>
          <p className="text-[12px] text-txt-secondary mt-1">{focus.body}</p>
          {totalTeams > 0 && (
            <div className="flex items-center gap-3 mt-3 text-[11px] text-txt-tertiary">
              <span>이번 주 {totalTeams - pendingTeams}/{totalTeams} 제출</span>
              <span className="text-border">·</span>
              <span>{submissionRate}% 완료</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
