'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

interface PendingSetup {
  id: string
  discord_guild_id: string
  discord_guild_name: string | null
  selected_tone: string
  selected_channels: string[]
}

interface Club {
  id: string
  name: string
  slug: string
  logo_url: string | null
  role: string
}

type Step = 'loading' | 'need-login' | 'need-discord' | 'no-pending' | 'select-club' | 'connecting' | 'done' | 'error'

/** 연결 완료 후 3초 카운트다운 → 채널 매핑 페이지로 자동 이동 */
function DoneStep({
  connectedGuild,
  clubs,
  selectedClub,
  router,
}: {
  connectedGuild: string | null
  clubs: Club[]
  selectedClub: string | null
  router: ReturnType<typeof useRouter>
}) {
  const [countdown, setCountdown] = useState(3)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  const getSettingsUrl = () => {
    const club = clubs.find(c => c.id === selectedClub)
    return club ? `/clubs/${club.slug}/settings` : '/explore'
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          router.push(getSettingsUrl())
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const handleGoNow = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    router.push(getSettingsUrl())
  }

  return (
    <div className="bg-surface-card rounded-2xl border border-border p-6 text-center">
      <CheckCircle2 size={48} className="mx-auto mb-4 text-status-success-text" />
      <h2 className="text-lg font-bold text-txt-primary mb-2">연결 완료</h2>
      <p className="text-sm text-txt-secondary mb-2">
        <strong>{connectedGuild}</strong> 서버가 클럽에 연결되었습니다.
      </p>
      <p className="text-xs text-txt-tertiary mb-6">
        다음 단계: 어떤 채널의 대화를 주간 업데이트에 사용할지 설정합니다.
      </p>

      <button
        onClick={handleGoNow}
        className="w-full px-4 py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        채널 매핑 설정하기
        <ArrowRight size={14} />
      </button>
      <p className="text-[11px] text-txt-disabled mt-3">
        {countdown}초 후 자동으로 이동합니다
      </p>
    </div>
  )
}

export default function ConnectDiscordPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const guildIdParam = searchParams.get('guild')

  const [step, setStep] = useState<Step>('loading')
  const [pendingSetups, setPendingSetups] = useState<PendingSetup[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [selectedSetup, setSelectedSetup] = useState<PendingSetup | null>(null)
  const [connectedGuild, setConnectedGuild] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. 인증 상태 확인 후 데이터 fetch
  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setStep('need-login')
      return
    }

    fetchConnectData()
  }, [authLoading, isAuthenticated])

  async function fetchConnectData() {
    try {
      const res = await fetch('/api/discord/connect')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      if (!data.discord_linked) {
        setStep('need-discord')
        return
      }

      const setups: PendingSetup[] = data.pending_setups || []
      const userClubs: Club[] = data.clubs || []

      if (setups.length === 0) {
        setStep('no-pending')
        return
      }

      setPendingSetups(setups)
      setClubs(userClubs)

      // guild 파라미터가 있으면 해당 setup 자동 선택
      if (guildIdParam) {
        const match = setups.find(s => s.discord_guild_id === guildIdParam)
        if (match) setSelectedSetup(match)
      }

      // setup이 1개면 자동 선택
      if (setups.length === 1) {
        setSelectedSetup(setups[0])
      }

      setStep('select-club')
    } catch {
      setErrorMsg('데이터를 불러오는 데 실패했습니다')
      setStep('error')
    }
  }

  // 2. 연결 실행
  async function handleConnect() {
    if (!selectedSetup || !selectedClub) return

    setStep('connecting')
    try {
      const res = await fetch('/api/discord/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guild_id: selectedSetup.discord_guild_id,
          club_id: selectedClub,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || '연결에 실패했습니다')
        setStep('error')
        return
      }

      setConnectedGuild(data.guild_name || selectedSetup.discord_guild_name)
      setStep('done')
    } catch {
      setErrorMsg('서버 오류가 발생했습니다')
      setStep('error')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5865F2' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">Discord 연결</h1>
        </div>
        <p className="text-sm text-txt-secondary">Discord 서버를 Draft 클럽에 연결하면 주간 업데이트가 자동으로 생성됩니다.</p>
      </div>

      {/* Loading */}
      {step === 'loading' && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-txt-tertiary" />
        </div>
      )}

      {/* 로그인 필요 */}
      {step === 'need-login' && (
        <div className="bg-surface-card rounded-2xl border border-border p-6 text-center">
          <p className="text-txt-secondary mb-4">Discord 서버를 연결하려면 먼저 로그인이 필요합니다.</p>
          <button
            onClick={() => router.push(`/login?redirect=/connect/discord${guildIdParam ? `?guild=${guildIdParam}` : ''}`)}
            className="px-6 py-3 bg-surface-inverse text-txt-inverse rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            로그인하기
          </button>
        </div>
      )}

      {/* Discord 계정 연결 필요 */}
      {step === 'need-discord' && (
        <div className="bg-surface-card rounded-2xl border border-border p-6 text-center">
          <p className="text-txt-secondary mb-4">Discord 계정이 Draft에 연결되어 있지 않습니다.</p>
          <a
            href={`/api/discord/oauth?returnTo=/connect/discord${guildIdParam ? `?guild=${guildIdParam}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#5865F2' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord 계정 연결
          </a>
        </div>
      )}

      {/* 대기 중인 설정 없음 */}
      {step === 'no-pending' && (
        <div className="bg-surface-card rounded-2xl border border-border p-6 text-center">
          <p className="text-txt-secondary mb-2">연결 대기 중인 Discord 서버가 없습니다.</p>
          <p className="text-xs text-txt-tertiary">Discord 서버에 Draft 봇을 먼저 초대해주세요.</p>
        </div>
      )}

      {/* 클럽 선택 */}
      {step === 'select-club' && (
        <div className="space-y-4">
          {/* 서버 정보 */}
          {selectedSetup && (
            <div className="bg-surface-card rounded-2xl border border-border p-4">
              <p className="text-xs text-txt-tertiary mb-1">Discord 서버</p>
              <p className="font-semibold text-txt-primary">{selectedSetup.discord_guild_name}</p>
              <p className="text-xs text-txt-tertiary mt-1">
                AI 톤: {selectedSetup.selected_tone === 'formal' ? '합쇼체' : selectedSetup.selected_tone === 'casual' ? '부드러운 합쇼체' : 'English'}
              </p>
            </div>
          )}

          {/* 여러 setup이 있을 때 선택 */}
          {pendingSetups.length > 1 && !selectedSetup && (
            <div className="bg-surface-card rounded-2xl border border-border p-4">
              <p className="text-sm font-medium text-txt-primary mb-3">연결할 서버를 선택하세요</p>
              <div className="space-y-2">
                {pendingSetups.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSetup(s)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-surface-sunken transition-colors"
                  >
                    <span className="font-medium text-txt-primary">{s.discord_guild_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 클럽 선택 */}
          {selectedSetup && (
            <div className="bg-surface-card rounded-2xl border border-border p-4">
              <p className="text-sm font-medium text-txt-primary mb-3">연결할 클럽을 선택하세요</p>
              {clubs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-txt-secondary mb-3">관리 중인 클럽이 없습니다.</p>
                  <Link
                    href="/clubs"
                    className="inline-block px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
                  >
                    클럽 만들기
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {clubs.map(club => (
                    <button
                      key={club.id}
                      onClick={() => setSelectedClub(club.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedClub === club.id
                          ? 'border-brand bg-brand-bg'
                          : 'border-border hover:bg-surface-sunken'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-sunken flex items-center justify-center text-sm font-bold text-txt-tertiary">
                            {club.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-txt-primary">{club.name}</span>
                          <span className="ml-2 text-xs text-txt-tertiary">{club.role === 'owner' ? '소유자' : '관리자'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedClub && (
                <button
                  onClick={handleConnect}
                  className="w-full mt-4 px-4 py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover active:scale-[0.98] transition-all"
                >
                  연결하기
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 연결 중 */}
      {step === 'connecting' && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin text-brand" />
          <p className="text-sm text-txt-secondary">연결하고 있습니다...</p>
        </div>
      )}

      {/* 완료 → 3초 후 채널 매핑 페이지로 자동 이동 */}
      {step === 'done' && (
        <DoneStep
          connectedGuild={connectedGuild}
          clubs={clubs}
          selectedClub={selectedClub}
          router={router}
        />
      )}

      {/* 에러 */}
      {step === 'error' && (
        <div className="bg-surface-card rounded-2xl border border-border p-6 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-status-danger-text" />
          <h2 className="text-lg font-bold text-txt-primary mb-2">연결 실패</h2>
          <p className="text-sm text-txt-secondary mb-4">{errorMsg}</p>
          <button
            onClick={() => { setStep('loading'); fetchConnectData() }}
            className="px-4 py-2.5 bg-surface-sunken text-txt-primary rounded-xl text-sm font-semibold hover:bg-surface-card border border-border transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}
