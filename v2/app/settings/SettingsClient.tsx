'use client'

import { useEffect, useState } from 'react'

interface Props {
  email: string | null
}

export function SettingsClient({ email }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 워크스페이스 이름
  const [wsName, setWsName] = useState('')
  const [wsSaving, setWsSaving] = useState(false)
  const [wsError, setWsError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workspace')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('failed')))
      .then((ws: { name: string }) => setWsName(ws.name))
      .catch(() => {})
  }, [])

  const saveWsName = async () => {
    const name = wsName.trim()
    if (!name) return
    setWsSaving(true)
    setWsError(null)
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '저장 실패')
      }
    } catch (e) {
      setWsError((e as Error).message)
    } finally {
      setWsSaving(false)
    }
  }

  // 수동 동기화 — 매니저가 cron 안 기다리고 즉시 처리하고 싶을 때.
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const runSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/sync/drive', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '동기화 실패')
      }
      const data = (await res.json()) as { processed_total: number; folders_seen: number }
      setSyncResult(`${data.folders_seen}개 폴더 확인 · ${data.processed_total}개 파일 처리 완료`)
    } catch (e) {
      setSyncResult((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    const phrase = '삭제'
    const typed = window.prompt(
      `계정과 모든 데이터를 영구 삭제합니다.\n\n` +
      `· 워크스페이스 / 폴더 / 채팅 기록 / Google 토큰 모두 제거\n` +
      `· Google Drive 자체 폴더와 파일은 그대로 남음\n` +
      `· 되돌릴 수 없습니다\n\n` +
      `확인을 위해 "${phrase}" 를 정확히 입력해 주세요.`,
    )
    if (typed !== phrase) {
      if (typed !== null) setError('입력이 일치하지 않아 취소되었습니다.')
      return
    }

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '삭제에 실패했습니다.')
      }
      const data = await res.json() as { google_revoke_url: string }
      window.location.href = `/?deleted=1&revoke=${encodeURIComponent(data.google_revoke_url)}`
    } catch (e) {
      setError((e as Error).message)
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-canvas py-section px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-display-lg text-ink">설정</h1>
          <p className="text-body-sm text-muted">계정과 권한을 관리합니다.</p>
        </header>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">계정</h2>
          <dl className="text-body-md space-y-2">
            <Row k="이메일" v={email ?? '—'} />
            <Row k="로그인" v="Google" />
          </dl>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">워크스페이스</h2>
          <div className="space-y-2">
            <label className="block">
              <span className="text-title-sm text-ink block mb-1">이름</span>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="내 워크스페이스"
                maxLength={60}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveWsName}
                disabled={wsSaving || !wsName.trim()}
                className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors disabled:opacity-50"
              >
                {wsSaving ? '저장 중…' : '저장'}
              </button>
              {wsError ? <p className="text-body-sm text-muted">{wsError}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">데이터 내보내기</h2>
          <p className="text-body-sm text-muted">
            Draft 에 저장된 워크스페이스 · 폴더 · 채팅 기록을 JSON 으로 다운로드합니다.
            Google 토큰 값은 보안상 메타데이터만 포함됩니다.
          </p>
          <a
            href="/api/account/export"
            download
            className="inline-flex items-center h-10 px-4 rounded-md border border-hairline text-ink text-button font-medium hover:bg-surface-soft transition-colors"
          >
            JSON 다운로드
          </a>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">Drive 동기화</h2>
          <p className="text-body-sm text-muted">
            연결된 폴더의 새 파일을 즉시 확인하고 항목(마감·요구사항 등)을 추출합니다.
            자동 동기화는 15분마다 실행되며, 이 버튼은 그 사이 수동 트리거 용도입니다.
            한 번에 최대 3개 파일까지 처리합니다.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors disabled:opacity-50"
            >
              {syncing ? '동기화 중…' : '지금 동기화'}
            </button>
            {syncResult ? <p className="text-body-sm text-muted">{syncResult}</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">Google 연결</h2>
          <p className="text-body-sm text-muted">
            Google 권한이 끊겼거나 다른 계정으로 바꾸려면 다시 연결해 주세요. Draft 가
            현재 보유한 토큰이 새 토큰으로 교체됩니다.
          </p>
          <a
            href="/api/auth/google"
            className="inline-flex items-center h-10 px-4 rounded-md border border-hairline text-ink text-button font-medium hover:bg-surface-soft transition-colors"
          >
            Google 다시 연결
          </a>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas p-6 space-y-3">
          <h2 className="text-title-lg text-ink">위험 영역</h2>
          <p className="text-body-sm text-muted">
            계정과 모든 데이터를 영구 삭제합니다. Google Drive 자체 폴더는 영향받지
            않습니다.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center h-10 px-4 rounded-md border border-hairline text-ink text-button font-medium hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            {deleting ? '삭제 중…' : '계정 삭제'}
          </button>
          {error ? <p className="text-body-sm text-muted">{error}</p> : null}
        </section>

        <footer className="border-t border-hairline pt-6 flex gap-4">
          <a href="/workspace" className="text-body-sm text-muted hover:text-ink transition-colors">
            ← 워크스페이스로
          </a>
          <a href="/privacy" className="text-body-sm text-muted hover:text-ink transition-colors ml-auto">
            개인정보 처리방침
          </a>
          <a href="/terms" className="text-body-sm text-muted hover:text-ink transition-colors">
            이용약관
          </a>
        </footer>
      </div>
    </main>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-4">
      <dt className="text-body-sm text-muted-soft w-20 shrink-0">{k}</dt>
      <dd className="text-body-md text-ink">{v}</dd>
    </div>
  )
}
