'use client'

import { useEffect, useState } from 'react'

interface ConnectingStepProps {
  clubId: string
  guildId: string
  guildName: string | null
  onSuccess: () => void
  onError: (msg: string) => void
}

/**
 * Step 3: 자동 연결 실행 + 결과 표시
 *
 * POST /api/discord/connect를 호출하여
 * guild → club 매핑 + 서버 프로비저닝을 자동으로 수행한다.
 * 성공하면 onSuccess, 실패하면 onError 콜백.
 */
export function ConnectingStep({
  clubId,
  guildId,
  guildName,
  onSuccess,
  onError,
}: ConnectingStepProps) {
  const [status, setStatus] = useState<'connecting' | 'provisioning' | 'done' | 'error'>('connecting')
  const [provisionInfo, setProvisionInfo] = useState<{
    created: number
    skipped: number
    fileTrailChannels: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function connect() {
      try {
        setStatus('connecting')

        const res = await fetch('/api/discord/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guild_id: guildId, club_id: clubId }),
        })

        if (cancelled) return

        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          onError(data.error ?? '연결에 실패했습니다')
          return
        }

        if (data.provision) {
          setProvisionInfo(data.provision)
        }

        setStatus('done')

        // 잠깐 결과를 보여준 뒤 완료 처리
        setTimeout(() => {
          if (!cancelled) onSuccess()
        }, 1500)
      } catch {
        if (!cancelled) {
          setStatus('error')
          onError('서버 오류가 발생했습니다')
        }
      }
    }

    connect()

    return () => { cancelled = true }
  }, [clubId, guildId, onSuccess, onError])

  return (
    <div className="space-y-4">
      {/* 연결 중 */}
      {(status === 'connecting' || status === 'provisioning') && (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-txt-secondary">
            {guildName ? `${guildName} 서버를` : '서버를'} 연결하고 있습니다...
          </p>
          <p className="text-xs text-txt-disabled">
            채널 구조를 설정하는 중입니다
          </p>
        </div>
      )}

      {/* 완료 */}
      {status === 'done' && (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-10 h-10 rounded-full bg-status-success-bg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-success-text">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-txt-primary">연결 완료</p>
          {provisionInfo && (
            <p className="text-xs text-txt-tertiary text-center">
              채널 {provisionInfo.created}개 생성, {provisionInfo.fileTrailChannels}개 FileTrail 등록
            </p>
          )}
        </div>
      )}

      {/* 에러 */}
      {status === 'error' && (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-10 h-10 rounded-full bg-status-danger-bg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-danger-text">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-txt-primary">연결 실패</p>
        </div>
      )}
    </div>
  )
}
