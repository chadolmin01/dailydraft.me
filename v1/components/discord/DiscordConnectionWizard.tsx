'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StepIndicator, type WizardStep } from './wizard/StepIndicator'
import { ServerStep } from './wizard/ServerStep'
import { BotInstallStep } from './wizard/BotInstallStep'
import { ConnectingStep } from './wizard/ConnectingStep'

interface DiscordConnectionWizardProps {
  clubId: string
  clubSlug: string
}

/**
 * Discord 연결 위저드 (3단계)
 *
 * ClubDiscordSettings에서 isConnected === false일 때 표시.
 * 서버 준비 → 봇 설치(폴링) → 자동 연결의 3단계를 안내한다.
 *
 * 각 단계는 독립 컴포넌트로, 위저드는 상태 머신(step) + 콜백만 관리.
 */
export function DiscordConnectionWizard({ clubId, clubSlug }: DiscordConnectionWizardProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<WizardStep>('server')
  const [detectedGuild, setDetectedGuild] = useState<{
    discord_guild_id: string
    discord_guild_name: string | null
  } | null>(null)

  // Step 1 완료 → Step 2로 이동
  const handleServerReady = useCallback(() => {
    setStep('bot-install')
  }, [])

  // Step 2: 봇 감지됨 → Step 3으로 이동
  const handleBotDetected = useCallback((setup: {
    discord_guild_id: string
    discord_guild_name: string | null
  }) => {
    setDetectedGuild(setup)
    setStep('connecting')
  }, [])

  // Step 3: 연결 성공
  const handleConnectSuccess = useCallback(() => {
    // 연결 상태 쿼리 무효화 → ClubDiscordSettings가 isConnected=true로 전환
    queryClient.invalidateQueries({ queryKey: ['discord-channels'] })
    queryClient.invalidateQueries({ queryKey: ['ghostwriter-settings'] })
    toast.success('Discord 서버가 연결되었습니다')
  }, [queryClient])

  // Step 3: 연결 실패
  const handleConnectError = useCallback((msg: string) => {
    toast.error(msg)
    // 봇 설치 단계로 되돌리지 않음 — 재시도 가능하도록 그대로 유지
  }, [])

  return (
    <div className="space-y-4">
      <StepIndicator current={step} />

      {step === 'server' && (
        <ServerStep onNext={handleServerReady} />
      )}

      {step === 'bot-install' && (
        <BotInstallStep
          clubSlug={clubSlug}
          onDetected={handleBotDetected}
        />
      )}

      {step === 'connecting' && detectedGuild && (
        <ConnectingStep
          clubId={clubId}
          guildId={detectedGuild.discord_guild_id}
          guildName={detectedGuild.discord_guild_name}
          onSuccess={handleConnectSuccess}
          onError={handleConnectError}
        />
      )}
    </div>
  )
}
