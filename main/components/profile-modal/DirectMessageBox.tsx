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
    <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4">
      <h4 className="text-[13px] font-semibold text-txt-secondary mb-2.5 flex items-center gap-1.5">
        <Send size={13} /> 쪽지 보내기
      </h4>
      {sent ? (
        <p className="text-[14px] text-[#34C759] font-semibold py-2">쪽지가 전송되었습니다!</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="간단한 쪽지를 보내보세요..."
            rows={2}
            maxLength={2000}
            className="w-full px-4 py-3 text-[14px] bg-white dark:bg-[#2C2C2E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 resize-none transition-all mb-2.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-txt-tertiary">{content.length}/2000</span>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3182F6] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2272EB] disabled:opacity-40 transition-colors active:scale-[0.97]"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              보내기
            </button>
          </div>
          {error && <p className="text-[12px] text-[#FF3B30] mt-1.5">{error}</p>}
        </>
      )}
    </div>
  )
}
