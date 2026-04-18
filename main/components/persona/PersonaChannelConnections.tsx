'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ExternalLink, Link2, Plug, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  usePersonaChannels,
  useDisconnectChannel,
  type ConnectedChannel,
} from '@/src/hooks/usePersonaChannels'
import { CHANNEL_BRANDS } from '@/components/bundles/channel-brand'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useState } from 'react'
import type { ChannelFormat } from '@/src/lib/personas/types'

interface Props {
  personaId: string
  clubSlug: string
  canEdit: boolean
}

/**
 * 외부 SNS 채널 연결 섹션.
 *
 * R3.4 초기:
 *   - LinkedIn만 실제 연결/발행 지원
 *   - Threads·Instagram은 "준비 중" (앱 리뷰 통과 후 활성)
 *
 * 페르소나 페이지 하단 (템플릿 라이브러리 위)에 배치.
 */

interface ChannelDef {
  channel_type: string // DB 저장되는 키
  brand_key: ChannelFormat // CHANNEL_BRANDS 조회 키
  label: string
  description: string
  comingSoon: boolean
  startUrl?: (personaId: string, returnTo: string) => string
}

const CHANNEL_DEFS: ChannelDef[] = [
  {
    channel_type: 'linkedin',
    brand_key: 'linkedin_post',
    label: 'LinkedIn',
    description:
      '연결하시면 승인한 글이 본인 LinkedIn 피드에 자동으로 올라갑니다. 토큰 수명 60일.',
    comingSoon: false,
    startUrl: (pid, ret) =>
      `/api/oauth/linkedin/start?persona_id=${pid}&return_to=${encodeURIComponent(ret)}`,
  },
  {
    channel_type: 'threads',
    brand_key: 'instagram_caption', // 임시: Threads 전용 브랜드는 추후. Meta 패밀리라 인스타 그라디언트 차용
    label: 'Threads',
    // Threads는 개인 계정 그대로 OAuth 가능 (Instagram과 달리 비즈 전환 불필요).
    // Meta App Review 통과 전까지 comingSoon 유지. 통과 후 comingSoon: false로 플립.
    description:
      '본인 Threads 계정에 자동 발행됩니다. Meta 앱 리뷰 승인 대기 중.',
    comingSoon: true,
    startUrl: (pid, ret) =>
      `/api/oauth/threads/start?persona_id=${pid}&return_to=${encodeURIComponent(ret)}`,
  },
  {
    channel_type: 'instagram',
    brand_key: 'instagram_caption',
    label: 'Instagram',
    description:
      'Meta 앱 리뷰 통과 후 활성화됩니다. 지금은 상세 페이지에서 "복사해서 올리기"를 쓰실 수 있습니다.',
    comingSoon: true,
  },
]

export function PersonaChannelConnections({ personaId, clubSlug, canEdit }: Props) {
  const { data, isLoading } = usePersonaChannels(personaId)
  const disconnect = useDisconnectChannel(personaId)
  const searchParams = useSearchParams()
  const [disconnectTarget, setDisconnectTarget] =
    useState<ConnectedChannel | null>(null)

  // OAuth 콜백 후 결과 토스트
  useEffect(() => {
    const linkedin = searchParams.get('linkedin')
    if (linkedin === 'ok') {
      toast.success('LinkedIn 연결이 완료되었습니다. 이제 자동 발행이 가능합니다.')
    } else if (linkedin === 'error') {
      const msg = searchParams.get('msg') || '알 수 없는 오류'
      toast.error(`LinkedIn 연결 실패: ${msg}`)
    }

    const threads = searchParams.get('threads')
    if (threads === 'ok') {
      toast.success('Threads 연결이 완료되었습니다. 이제 자동 발행이 가능합니다.')
    } else if (threads === 'error') {
      const msg = searchParams.get('msg') || '알 수 없는 오류'
      toast.error(`Threads 연결 실패: ${msg}`)
    }
  }, [searchParams])

  const connectedByType = new Map<string, ConnectedChannel>()
  for (const c of data?.channels ?? []) connectedByType.set(c.channel_type, c)

  const returnTo = `/clubs/${clubSlug}/settings/persona`

  return (
    <>
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-txt-primary">
            어디로 자동 발행할까요?
          </h2>
          <p className="text-xs text-txt-tertiary mt-0.5 leading-relaxed">
            아래 SNS 계정을 연결해두시면, 번들 승인 시 해당 플랫폼에 <strong className="text-txt-secondary">자동으로 글이 올라갑니다</strong>. 연결 안 된 채널은 복사해서 직접 올리시면 됩니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {CHANNEL_DEFS.map((def) => {
            const brand = CHANNEL_BRANDS[def.brand_key]
            const connected = connectedByType.get(def.channel_type)
            const Icon = brand?.icon

            return (
              <div
                key={def.channel_type}
                className={`bg-surface-card border rounded-2xl p-4 flex flex-col gap-3 ${
                  connected?.expired
                    ? 'border-status-danger-text/30'
                    : connected
                      ? 'border-brand-border'
                      : 'border-border'
                } ${def.comingSoon ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      connected && !connected.expired
                        ? brand?.accent ?? 'bg-brand'
                        : brand?.bg ?? 'bg-surface-bg'
                    }`}
                  >
                    {Icon && (
                      <Icon
                        size={18}
                        className={
                          connected && !connected.expired
                            ? 'text-white'
                            : brand?.text ?? 'text-txt-secondary'
                        }
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-semibold text-txt-primary">
                        {def.label}
                      </h3>
                      {def.comingSoon && (
                        <span className="text-[10px] text-txt-tertiary px-1.5 py-0.5 rounded bg-surface-bg border border-border">
                          준비 중
                        </span>
                      )}
                      {connected && !connected.expired && !def.comingSoon && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-status-success-text">
                          <CheckCircle2 size={11} />
                          연결됨
                        </span>
                      )}
                      {connected?.expired && (
                        <span className="text-[10px] text-status-danger-text">
                          만료
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-txt-tertiary leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                </div>

                {/* 액션 영역 */}
                {!def.comingSoon && canEdit && (
                  <div className="flex items-center gap-2 mt-auto">
                    {connected && !connected.expired ? (
                      <>
                        <div className="flex-1 text-[10px] text-txt-tertiary truncate">
                          계정: <span className="text-txt-secondary">{connected.account_ref.slice(0, 10)}...</span>
                        </div>
                        <button
                          onClick={() => setDisconnectTarget(connected)}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold text-txt-tertiary hover:bg-status-danger-text/5 hover:text-status-danger-text transition-colors"
                        >
                          <X size={11} />
                          해제
                        </button>
                      </>
                    ) : connected?.expired ? (
                      <a
                        href={def.startUrl?.(personaId, returnTo)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 ${
                          brand?.accent
                        }`}
                      >
                        <Link2 size={12} />
                        다시 연결하기
                      </a>
                    ) : (
                      <a
                        href={def.startUrl?.(personaId, returnTo)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 ${
                          brand?.accent
                        }`}
                      >
                        <Plug size={12} />
                        {def.label} 연결하기
                      </a>
                    )}
                  </div>
                )}

                {def.comingSoon && (
                  <div className="mt-auto inline-flex items-center gap-1 text-[10px] text-txt-tertiary">
                    <ExternalLink size={10} />곧 지원 예정
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 초기 로딩 상태 */}
        {isLoading && (
          <p className="text-[11px] text-txt-tertiary mt-2">
            연결 상태 확인 중...
          </p>
        )}
      </section>

      <ConfirmModal
        isOpen={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={() => {
          if (!disconnectTarget) return
          disconnect.mutate(disconnectTarget.id, {
            onSuccess: () => setDisconnectTarget(null),
          })
        }}
        title={
          disconnectTarget
            ? `${disconnectTarget.channel_type} 연결 해제`
            : '연결 해제'
        }
        message="해제하시면 이 플랫폼으로 자동 발행이 중단됩니다. 다시 연결하시려면 OAuth 인증을 처음부터 다시 하셔야 합니다."
        confirmText={disconnect.isPending ? '해제 중...' : '해제하기'}
        variant="warning"
      />
    </>
  )
}
