'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'

export function DirectMessageBox({ receiverId }: { receiverId: string }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSent(true)
      setContent('')
      setTimeout(() => setSent(false), 3000)
    } catch {
      setError('전송에 실패했습니다')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border border-border p-4 shadow-sm">
      <h4 className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-1.5">
        <Send size={10} /> SEND MESSAGE
      </h4>
      {sent ? (
        <p className="text-sm text-indicator-online font-medium py-2">쪽지가 전송되었습니다!</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="간단한 쪽지를 보내보세요..."
            rows={2}
            maxLength={2000}
            className="w-full px-3 py-2 text-base sm:text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent resize-none transition-colors mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-mono text-txt-tertiary">{content.length}/2000</span>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-40 transition-colors hover:opacity-90 active:scale-[0.97]"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              보내기
            </button>
          </div>
          {error && <p className="text-xs text-status-danger-text mt-1">{error}</p>}
        </>
      )}
    </div>
  )
}
