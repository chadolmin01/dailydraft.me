'use client'

import { Sparkles, MessageCircle, Linkedin, Hash, Mail } from 'lucide-react'

interface Props {
  projectTitle: string
  clubName: string | null
  canCreate: boolean
  isCreating: boolean
  onCreate: () => void
}

/**
 * 프로젝트 페르소나가 아직 생성되지 않은 상태.
 * 클럽 페르소나와의 차이·예상 ROI·소요 시간을 압축해서 전달.
 * 합쇼체 + 데이터 우선, 친절 문구 최소화.
 */
export function ProjectPersonaEmptyState({
  projectTitle,
  clubName,
  canCreate,
  isCreating,
  onCreate,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-border rounded-2xl p-6 md:p-8">
        <div className="w-11 h-11 mb-4 rounded-xl bg-brand-bg flex items-center justify-center">
          <Sparkles size={20} className="text-brand" />
        </div>

        <h2 className="text-lg font-bold text-txt-primary mb-2">
          {projectTitle}의 페르소나를 만들어보시겠어요?
        </h2>

        <p className="text-sm text-txt-secondary leading-relaxed mb-5">
          주간 업데이트·외부 SNS·팀 공지가 {projectTitle} 다운 목소리로 나갑니다.
          {clubName && ` ${clubName} 클럽 페르소나를 기본값으로 참고합니다.`}
        </p>

        {/* 적용 채널 */}
        <div className="flex items-center gap-3 mb-6">
          <ChannelDot icon={MessageCircle} label="Discord" color="text-[#5865F2]" bg="bg-[#5865F2]/10" />
          <ChannelDot icon={Linkedin} label="LinkedIn" color="text-[#0A66C2]" bg="bg-[#0A66C2]/10" />
          <ChannelDot icon={Hash} label="Threads" color="text-[#1C1C1E]" bg="bg-[#1C1C1E]/8" />
          <ChannelDot icon={Mail} label="이메일" color="text-[#10B981]" bg="bg-[#10B981]/10" />
        </div>

        {canCreate ? (
          <>
            <button
              onClick={onCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              {isCreating ? '준비 중입니다...' : '시작하기'}
            </button>
            <p className="text-[11px] text-txt-tertiary mt-3">
              약 3분 소요 · AI 가 기본값을 자동 채움
            </p>
          </>
        ) : (
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-surface-bg text-xs text-txt-tertiary">
            프로젝트 리드가 아직 페르소나를 만들지 않았습니다
          </div>
        )}
      </div>

      {/* 보조 설명 — 클럽 페르소나와의 차이 */}
      <div className="grid md:grid-cols-2 gap-3">
        <InfoCard
          title="클럽 페르소나와 다른 이유"
          body="클럽 공식 톤과 팀 내부 톤은 다릅니다. 테크니컬 업데이트·프로젝트 전용 어휘·타겟 청중이 달라지기 때문입니다."
        />
        <InfoCard
          title="기수 종료 후"
          body={`프로젝트가 끝나면 페르소나는 자동으로 ${clubName ?? '클럽'} 아카이브로 편입됩니다. 다음 기수 팀이 참고해 새로 시작할 수 있습니다.`}
        />
      </div>
    </div>
  )
}

function ChannelDot({
  icon: Icon,
  label,
  color,
  bg,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
  bg: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon size={16} className={color} />
      </div>
      <span className="text-[10px] text-txt-tertiary">{label}</span>
    </div>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-txt-primary mb-1">{title}</p>
      <p className="text-[11px] text-txt-tertiary leading-relaxed">{body}</p>
    </div>
  )
}
