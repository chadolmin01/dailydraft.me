'use client'

import { useState } from 'react'
import {
  Loader2,
  Sparkles,
  Target,
  Wand2,
  PenLine,
  type LucideIcon,
} from 'lucide-react'
import { DiscordLearnModal } from './DiscordLearnModal'
import { AIPolishModal } from './AIPolishModal'
import { useGeneratePersona } from '@/src/hooks/usePersona'

type ActionKey = 'discord_learn' | 'benchmark' | 'ai_generate' | 'ai_polish'

interface ActionCard {
  key: ActionKey
  icon: LucideIcon
  title: string
  description: string
  /** 아직 구현 안 된 기능. true면 클릭 비활성. */
  comingSoon: boolean
}

const ACTIONS: ActionCard[] = [
  {
    key: 'discord_learn',
    icon: Sparkles,
    title: 'Discord 대화로 시작하기',
    description:
      '동아리 Discord에 이미 쌓인 공지·대화를 AI가 읽고 "이 동아리다운 톤"을 자동으로 뽑아드립니다. 아무것도 안 쓰셔도 됩니다.',
    comingSoon: false,
  },
  {
    key: 'benchmark',
    icon: Target,
    title: '다른 동아리 참고하기',
    description:
      '공개된 다른 동아리 페르소나를 참고 자료로 가져와, 우리 동아리 스타일로 각색합니다.',
    comingSoon: true,
  },
  {
    key: 'ai_generate',
    icon: Wand2,
    title: 'AI에게 초안 부탁하기',
    description:
      '회장님이 지금까지 적어둔 슬롯은 그대로 두고, 빈 칸만 AI가 알아서 채워줍니다. 가장 빠른 시작 방법입니다.',
    comingSoon: false,
  },
  {
    key: 'ai_polish',
    icon: PenLine,
    title: 'AI에게 다시 쓰라고 부탁하기',
    description:
      '"더 딱딱하게", "GenZ 톤으로", "스폰서 대상으로 다시" 같이 말하면 AI가 전체 슬롯을 그 방향으로 손봐줍니다.',
    comingSoon: false,
  },
]

interface Props {
  personaId?: string
  disabled?: boolean
}

/**
 * "쉽게 채우기" 4 액션카드 섹션.
 *
 * 'ai_generate'는 모달 없이 바로 실행 (빈 슬롯만 채움, 수동 슬롯 보호).
 * 'discord_learn' / 'ai_polish'는 자연어 입력이 필요해 모달 유지.
 * 'benchmark'는 아직 준비 중.
 */
export function PersonaActionCardsSection({ personaId, disabled = false }: Props) {
  const [openAction, setOpenAction] = useState<ActionKey | null>(null)
  const generate = useGeneratePersona(personaId)

  const handleClick = (key: ActionKey) => {
    if (key === 'ai_generate') {
      generate.mutate()
    } else {
      setOpenAction(key)
    }
  }

  return (
    <>
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-txt-primary">
            어떻게 시작할까요?
          </h2>
          <p className="text-xs text-txt-tertiary mt-0.5 leading-relaxed">
            13개 슬롯을 한 번에 AI가 채워드립니다. 회장님은 아래 카드 중 하나를 누르기만 하시면 됩니다. 마음에 안 드는 슬롯은 개별로 다시 쓰실 수 있습니다.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map((action) => (
            <ActionCardButton
              key={action.key}
              action={action}
              disabled={disabled || !personaId}
              loading={action.key === 'ai_generate' && generate.isPending}
              onClick={() => handleClick(action.key)}
            />
          ))}
        </div>
      </section>

      {personaId && (
        <>
          <DiscordLearnModal
            personaId={personaId}
            isOpen={openAction === 'discord_learn'}
            onClose={() => setOpenAction(null)}
          />
          <AIPolishModal
            personaId={personaId}
            isOpen={openAction === 'ai_polish'}
            onClose={() => setOpenAction(null)}
          />
        </>
      )}
    </>
  )
}

function ActionCardButton({
  action,
  disabled,
  loading,
  onClick,
}: {
  action: ActionCard
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  const isDisabled = disabled || action.comingSoon || loading
  const isComingSoon = action.comingSoon
  const Icon = action.icon

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`group relative text-left rounded-2xl border p-4 transition-colors ${
        isComingSoon
          ? 'bg-surface-sunken border-border opacity-60 cursor-not-allowed'
          : 'bg-surface-card border-border hover:border-brand-border hover:bg-surface-bg disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-surface-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
            isComingSoon ? 'bg-surface-bg/60' : 'bg-surface-bg'
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="text-brand animate-spin" />
          ) : (
            <Icon
              size={16}
              className={isComingSoon ? 'text-txt-tertiary' : 'text-txt-secondary'}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`text-sm font-semibold ${
                isComingSoon ? 'text-txt-tertiary' : 'text-txt-primary'
              }`}
            >
              {action.title}
            </h3>
            {isComingSoon && (
              <span className="shrink-0 text-[10px] text-txt-tertiary px-1.5 py-0.5 rounded bg-surface-bg border border-border">
                준비 중
              </span>
            )}
            {loading && (
              <span className="shrink-0 text-[10px] text-brand px-1.5 py-0.5 rounded bg-brand-bg">
                생성 중
              </span>
            )}
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isComingSoon ? 'text-txt-tertiary/80' : 'text-txt-tertiary'
            }`}
          >
            {loading
              ? '빈 슬롯을 채우는 중입니다. 10~40초 정도 소요됩니다.'
              : action.description}
          </p>
        </div>
      </div>
    </button>
  )
}
