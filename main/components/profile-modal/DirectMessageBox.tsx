'use client'

import { useState } from 'react'
import { Loader2, Send, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { useBlockUser, useUserBlocks, useUnblockUser } from '@/src/hooks/useUserBlocks'

export function DirectMessageBox({ receiverId }: { receiverId: string }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // 차단/해제 — 최소 UI. 현재 차단 상태에 따라 토글.
  const { data: blocks = [] } = useUserBlocks()
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()
  const isBlocked = blocks.some(b => b.blocked_id === receiverId)

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser.mutateAsync(receiverId)
        toast.success('차단을 해제했습니다')
      } else {
        if (!confirm('이 사용자를 차단하시겠어요? 초대·커피챗·쪽지가 양방향으로 차단됩니다.')) return
        await blockUser.mutateAsync({ blocked_id: receiverId })
        toast.success('차단했습니다')
      }
    } catch {
      toast.error('처리에 실패했습니다')
    }
  }

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
    <div className="bg-surface-sunken rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-[13px] font-semibold text-txt-secondary flex items-center gap-1.5">
          <Send size={13} /> 쪽지 보내기
        </h4>
        <button
          onClick={handleToggleBlock}
          disabled={blockUser.isPending || unblockUser.isPending}
          className="flex items-center gap-1 text-[11px] text-txt-tertiary hover:text-status-danger-text transition-colors"
        >
          <ShieldOff size={11} />
          {isBlocked ? '차단 해제' : '차단'}
        </button>
      </div>
      {sent ? (
        <p className="text-sm text-status-success-text font-semibold py-2">쪽지가 전송되었습니다!</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="간단한 쪽지를 보내보세요..."
            rows={2}
            maxLength={2000}
            className="w-full px-4 py-3 text-sm bg-surface-card rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none transition-all mb-2.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-txt-tertiary">{content.length}/2000</span>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white text-[13px] font-semibold rounded-xl hover:bg-brand-hover disabled:opacity-40 transition-colors active:scale-[0.97]"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              보내기
            </button>
          </div>
          {error && <p className="text-xs text-status-danger-text mt-1.5">{error}</p>}
        </>
      )}
    </div>
  )
}
