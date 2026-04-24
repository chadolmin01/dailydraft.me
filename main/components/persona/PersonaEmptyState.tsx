'use client'

import { Instagram, Linkedin, Mail, MessageCircle, Sparkles } from 'lucide-react'

interface Props {
  clubName: string
  canCreate: boolean
  isCreating: boolean
  onCreate: () => void
}

/**
 * 페르소나가 아직 만들어지지 않은 상태.
 * 자동화를 모르는 회장도 "이게 뭔지, 왜 필요한지, 만들면 뭐가 좋은지"가
 * 한 화면에서 전달되도록 구체적 예시와 함께 설명.
 */
export function PersonaEmptyState({ clubName, canCreate, isCreating, onCreate }: Props) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-8 md:p-10 text-center">
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-bg flex items-center justify-center">
        <Sparkles size={24} className="text-brand" />
      </div>

      <h2 className="text-lg font-bold text-txt-primary mb-2">
        먼저, {clubName}의 "목소리"를 정해볼까요?
      </h2>

      <p className="text-sm text-txt-secondary leading-relaxed mb-6 max-w-lg mx-auto">
        AI가 회장님 대신 모집 공고·주간 업데이트·SNS 캡션을 써드리려면,
        <br />
        <strong className="text-txt-primary">"이 동아리다운 말투"</strong>가 뭔지 먼저 알아야 합니다.
        <br />한 번만 정해두면 아래 모든 채널에 같은 톤으로 나갑니다.
      </p>

      {/* 채널 아이콘 예시 — "어디에 쓰이는지" 시각적 단서 */}
      <div className="flex items-center justify-center gap-3 mb-7">
        <ChannelDot
          icon={MessageCircle}
          label="Discord"
          bg="bg-[#5865F2]/10"
          text="text-[#5865F2]"
        />
        <ChannelDot
          icon={Instagram}
          label="인스타"
          bg="bg-linear-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
          text="text-white"
          gradient
        />
        <ChannelDot
          icon={Linkedin}
          label="LinkedIn"
          bg="bg-[#0A66C2]/10"
          text="text-[#0A66C2]"
        />
        <ChannelDot
          icon={Mail}
          label="이메일"
          bg="bg-[#10B981]/10"
          text="text-[#10B981]"
        />
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
          <p className="text-[11px] text-txt-tertiary mt-3 leading-relaxed">
            3분이면 끝납니다. AI가 대부분 알아서 채워드리니 회장님은 확인만 하시면 됩니다.
          </p>
        </>
      ) : (
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-surface-bg text-xs text-txt-tertiary">
          대표·운영진이 아직 페르소나를 만들지 않았습니다
        </div>
      )}
    </div>
  )
}

function ChannelDot({
  icon: Icon,
  label,
  bg,
  text,
  gradient = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  bg: string
  text: string
  gradient?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${
          gradient ? 'shadow-sm' : ''
        }`}
      >
        <Icon size={16} className={text} />
      </div>
      <span className="text-[10px] text-txt-tertiary">{label}</span>
    </div>
  )
}
