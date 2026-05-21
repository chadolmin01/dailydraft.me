'use client'

import { useState } from 'react'
import { loadPickerApi, GOOGLE_APP_ID, type PickerCallbackData } from '@/src/lib/google/picker'

interface Props {
  type: 'folder' | 'sheet'
  onPick: (item: { id: string; name: string }) => void
  className?: string
}

// Google 공식 Picker 모달 — Gmail 첨부와 동일한 UX.
// NEXT_PUBLIC_GOOGLE_API_KEY 가 없으면 렌더링 자체를 안 함 (사용자가 셋업 안 한 상태).
export function DrivePickerButton({ type, onPick, className }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!apiKey) return null

  const open = async () => {
    setBusy(true)
    setError(null)
    try {
      await loadPickerApi()

      const tokenRes = await fetch('/api/google/access-token')
      if (!tokenRes.ok) throw new Error('Google 토큰 조회 실패')
      const { access_token } = (await tokenRes.json()) as { access_token: string }

      const picker = window.google!.picker
      const view = new picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(type === 'folder')
        .setMimeTypes(
          type === 'folder'
            ? 'application/vnd.google-apps.folder'
            : 'application/vnd.google-apps.spreadsheet',
        )

      const builder = new picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(access_token)
        .setDeveloperKey(apiKey)
        .setAppId(GOOGLE_APP_ID)
        .setOrigin(window.location.origin)
        .setTitle(type === 'folder' ? '폴더 선택' : '시트 선택')
        .setCallback((data: PickerCallbackData) => {
          if (data.action === picker.Action.PICKED && data.docs?.[0]) {
            const doc = data.docs[0]
            onPick({ id: doc.id, name: doc.name })
          }
        })

      builder.build().setVisible(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={
          className ??
          'h-10 px-4 rounded-md border border-hairline bg-canvas text-ink text-button font-medium hover:bg-surface-soft transition-colors disabled:opacity-50'
        }
      >
        {busy ? '로딩…' : `Drive 에서 ${type === 'folder' ? '폴더' : '시트'} 선택`}
      </button>
      {error ? <p className="text-body-sm text-muted">{error}</p> : null}
    </div>
  )
}
