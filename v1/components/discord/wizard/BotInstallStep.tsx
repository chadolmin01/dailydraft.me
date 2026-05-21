'use client'

import { useEffect } from 'react'
import { useDiscordPolling } from './useDiscordPolling'

interface BotInstallStepProps {
  clubSlug: string
  onDetected: (setup: { discord_guild_id: string; discord_guild_name: string | null }) => void
}

/**
 * Step 2: 봇 설치 + 감지 폴링
 *
 * 봇 초대 링크를 보여주고, 유저가 설치를 완료하면
 * 폴링으로 자동 감지하여 다음 단계로 진행한다.
 * 최대 5분 대기 후 수동 새로고침 안내.
 */
export function BotInstallStep({ clubSlug, onDetected }: BotInstallStepProps) {
  const { detected, isPolling, startPolling } = useDiscordPolling()

  // 마운트 시 폴링 시작
  useEffect(() => {
    startPolling()
  }, [startPolling])

  // 봇 감지되면 콜백
  useEffect(() => {
    if (detected) {
      onDetected({
        discord_guild_id: detected.discord_guild_id,
        discord_guild_name: detected.discord_guild_name,
      })
    }
  }, [detected, onDetected])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-txt-primary mb-1">Draft 봇을 서버에 설치하세요</h3>
        <p className="text-xs text-txt-tertiary">
          아래 버튼을 클릭하면 Discord 봇 초대 페이지가 열립니다.
          서버를 선택하고 "승인"을 눌러주세요.
        </p>
      </div>

      {/* 봇 초대 버튼 */}
      <a
        href={`/api/discord/install?club=${clubSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#5865F2' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        Draft 봇 설치하기
      </a>

      {/* 감지 상태 */}
      <div className="bg-surface-bg rounded-xl p-3 flex items-center gap-3">
        {isPolling ? (
          <>
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
            <p className="text-xs text-txt-tertiary">
              봇 설치를 감지하는 중입니다... 설치가 완료되면 자동으로 다음 단계로 넘어갑니다.
            </p>
          </>
        ) : detected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-status-success-text shrink-0" />
            <p className="text-xs text-txt-secondary font-semibold">
              {detected.discord_guild_name ?? '서버'} 감지됨
            </p>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-txt-disabled shrink-0" />
            <p className="text-xs text-txt-tertiary">
              감지 시간이 초과되었습니다. 봇을 설치한 후 페이지를 새로고침해주세요.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
