'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { renderMarkdown } from '@/src/lib/markdown'

interface ChatRow {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: unknown
  created_at: string
  folder_id?: string | null
}

// CLAUDE.md Hard Rule: 시스템 용어 노출 금지 → tool_use / tool_result 는 UI 에 안 보이게
// 필터링. 매니저는 결론(텍스트) 만 보면 됨.
function extractText(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content
    .filter((b): b is { type: 'text'; text: string } =>
      typeof b === 'object' && b !== null && 'type' in b && (b as { type: unknown }).type === 'text',
    )
    .map(b => b.text)
    .join('\n\n')
}

interface EmailDraftRef {
  kind: 'gmail_draft' | 'mailto'
  url: string
  subject?: string
  recipientCount?: number
}

// 메일 초안 추출 — compose_email_draft 도구 결과에서 Gmail 초안 또는 mailto 링크.
function extractEmailDrafts(content: unknown): EmailDraftRef[] {
  const refs: EmailDraftRef[] = []
  if (!Array.isArray(content)) return refs
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    if (!('type' in block) || (block as { type: unknown }).type !== 'tool_result') continue
    const inner = (block as { content: unknown }).content
    if (typeof inner !== 'string') continue
    try {
      const parsed = JSON.parse(inner) as Record<string, unknown>
      if (parsed.kind === 'gmail_draft' && typeof parsed.gmail_url === 'string') {
        refs.push({
          kind: 'gmail_draft',
          url: parsed.gmail_url,
          subject: typeof parsed.subject === 'string' ? parsed.subject : undefined,
          recipientCount: typeof parsed.recipient_count === 'number' ? parsed.recipient_count : undefined,
        })
      } else if (typeof parsed.mailto_url === 'string') {
        refs.push({
          kind: 'mailto',
          url: parsed.mailto_url,
          subject: typeof parsed.subject === 'string' ? parsed.subject : undefined,
          recipientCount: typeof parsed.recipient_count === 'number' ? parsed.recipient_count : undefined,
        })
      }
    } catch {}
  }
  return refs
}

interface Props {
  folderId: string | null
}

export function ChatPanel({ folderId }: Props) {
  const qc = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')

  // 입력 길이에 맞춰 textarea 자동 높이 — 최대 7줄까지.
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const max = parseFloat(getComputedStyle(ta).lineHeight) * 7 + 16
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`
  }, [draft])

  const history = useQuery({
    queryKey: ['chat-history'],
    queryFn: async (): Promise<{ rows: ChatRow[] }> => {
      const res = await fetch('/api/chat')
      if (!res.ok) throw new Error('대화 기록 조회 실패')
      return res.json()
    },
  })

  const send = useMutation({
    mutationFn: async (message: string): Promise<{ text: string; rows: ChatRow[]; tool_loops: number }> => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, folder_id: folderId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '응답 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history'] })
    },
  })

  const clearHistory = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat', { method: 'DELETE' })
      if (!res.ok) throw new Error('대화 기록 삭제 실패')
    },
    onSuccess: () => {
      qc.setQueryData(['chat-history'], { rows: [] })
    },
  })

  const handleClear = () => {
    if (rows.length === 0) return
    if (window.confirm(`대화 기록 ${rows.length}건을 모두 삭제하시겠습니까?\n폴더와 파일에는 영향이 없습니다.`)) {
      clearHistory.mutate()
    }
  }

  const rows = history.data?.rows ?? []

  // 새 메시지 도착 / 응답 완료 시 자동 스크롤
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [rows.length, send.isPending])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || send.isPending) return
    send.mutate(trimmed)
    setDraft('')
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {history.isLoading ? (
          <p className="text-body-sm text-on-dark-soft">불러오는 중…</p>
        ) : null}

        {rows.length === 0 && !history.isLoading ? (
          <div className="text-body-sm text-on-dark-soft">
            <p>무엇을 도와드릴까요?</p>
            <ul className="mt-3 space-y-1.5 text-on-dark-soft text-caption">
              <li>· {'"3주차 미제출 팀 알려주세요."'}</li>
              <li>· {'"미제출 팀에 보낼 메일 초안 만들어주세요."'}</li>
              <li>· {'"FLIP 폴더에 어떤 파일이 있나요?"'}</li>
            </ul>
          </div>
        ) : null}

        {rows.map(row => {
          if (row.role === 'tool') {
            // tool_result 자체는 안 보이게 하되, 안에 메일 초안 정보가 있으면 그 자리에 카드.
            const drafts = extractEmailDrafts(row.content)
            if (drafts.length === 0) return null
            return (
              <div key={row.id} className="space-y-2">
                {drafts.map((draft, i) => (
                  <EmailDraftCard key={`${row.id}-${i}`} draft={draft} />
                ))}
              </div>
            )
          }
          const text = extractText(row.content)
          if (!text && row.role === 'assistant') return null
          return (
            <Message key={row.id} role={row.role} text={text} />
          )
        })}

        {send.isPending ? (
          <p className="text-body-sm text-on-dark-soft opacity-70">처리 중…</p>
        ) : null}

        {send.error ? (
          <div className="text-body-sm text-on-dark-soft border-l-2 border-on-dark-soft pl-3">
            <p>답변을 만들지 못했습니다.</p>
            <p className="text-caption opacity-70 mt-1">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="px-5 pb-2 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            disabled={clearHistory.isPending}
            className="text-caption text-on-dark-soft hover:text-on-dark transition-colors disabled:opacity-40"
          >
            {clearHistory.isPending ? '지우는 중…' : '대화 지우기'}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-hairline-dark">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={folderId ? '메시지를 입력하세요' : '폴더를 선택한 뒤 질문해주세요'}
          rows={1}
          className="w-full px-4 py-2 bg-surface-dark-elevated border border-hairline-dark rounded-md font-body text-body-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-on-dark resize-none overflow-y-auto"
          disabled={send.isPending}
        />
        <p className="text-caption text-on-dark-soft mt-2 opacity-60">
          Enter 로 보내기 · Shift+Enter 줄바꿈
        </p>
      </form>
    </div>
  )
}

function Message({
  role,
  text,
}: {
  role: 'user' | 'assistant'
  text: string
}) {
  if (role === 'user') {
    // 사용자 입력은 markdown 파싱 안 함 (그대로 표시)
    return (
      <div className="ml-auto max-w-[88%] bg-surface-dark-elevated rounded-lg px-3 py-2 text-body-sm text-on-dark whitespace-pre-wrap">
        {text}
      </div>
    )
  }
  // assistant 응답은 markdown 렌더 — 굵게/코드/링크/목록 등.
  const html = renderMarkdown(text)
  return (
    <div
      className="max-w-[92%] border-l-2 border-on-dark pl-3 text-body-sm text-on-dark chat-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function EmailDraftCard({ draft }: { draft: EmailDraftRef }) {
  const label = draft.kind === 'gmail_draft' ? 'Gmail 초안함에 저장됨' : '메일 초안 열기'
  const sub = draft.subject
    ? `${draft.subject}${draft.recipientCount ? ` · 수신 ${draft.recipientCount}명` : ''}`
    : draft.recipientCount
      ? `수신 ${draft.recipientCount}명`
      : '클릭하면 새 창에서 열립니다'

  return (
    <a
      href={draft.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-md bg-surface-dark-elevated border border-hairline-dark px-4 py-3 hover:bg-surface-dark-soft transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-sm text-on-dark font-medium">{label}</p>
          <p className="text-caption text-on-dark-soft mt-0.5 truncate">{sub}</p>
        </div>
        <span className="text-caption text-on-dark-soft shrink-0">Gmail 에서 열기 ↗</span>
      </div>
    </a>
  )
}
