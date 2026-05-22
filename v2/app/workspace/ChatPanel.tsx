'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ListChecks,
  Mail,
  Search as SearchIcon,
  Sparkles,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { ChatInput } from './chat/ChatInput'
import { MessageBubble } from './chat/MessageBubble'
import { TypingIndicator } from './chat/TypingIndicator'
import { EmailDraftCard, extractEmailDrafts } from './chat/EmailDraftCard'
import { SuggestionCard } from './chat/SuggestionCard'
import { ChipButton } from './chat/ChipButton'
import { IconButton } from './chat/IconButton'

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

interface Props {
  folderId: string | null
  folderName?: string
}

const SUGGESTIONS = [
  {
    icon: <Sparkles size={14} />,
    label: '전체 진행 상황을 한 줄로 요약해주세요.',
    description: '폴더에 올라온 파일 기준',
  },
  {
    icon: <ListChecks size={14} />,
    label: '이번 주차에 아직 안 낸 팀을 알려주세요.',
    description: '매트릭스를 분석',
  },
  {
    icon: <Mail size={14} />,
    label: '미제출 팀에 보낼 리마인드 메일 초안을 만들어주세요.',
    description: 'Gmail 초안함에 저장',
  },
] as const

const QUICK_ACTIONS = ['미제출 팀', '오늘 활동', '메일 초안'] as const

export function ChatPanel({ folderId, folderName }: Props) {
  const qc = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null)

  const history = useQuery({
    queryKey: ['chat-history'],
    queryFn: async (): Promise<{ rows: ChatRow[] }> => {
      const res = await fetch('/api/chat')
      if (!res.ok) throw new Error('대화 기록 조회 실패')
      return res.json()
    },
  })

  const rows = history.data?.rows ?? []

  const send = useMutation({
    mutationFn: async (
      message: string,
    ): Promise<{ text: string; rows: ChatRow[]; tool_loops: number }> => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, folder_id: folderId }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '응답 실패')
      }
      return res.json()
    },
    onMutate: (message) => {
      setLastUserMessage(message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history'] })
      abortRef.current = null
    },
    onError: () => {
      abortRef.current = null
    },
  })

  const handleCancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    send.reset()
  }

  const handleSend = (message: string) => {
    const trimmed = message.trim()
    if (!trimmed || send.isPending) return
    send.mutate(trimmed)
  }

  const handleRetry = () => {
    if (lastUserMessage) {
      send.mutate(lastUserMessage)
    }
  }

  const handleSubmit = () => {
    handleSend(draft)
    setDraft('')
  }

  const clearHistory = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat', { method: 'DELETE' })
      if (!res.ok) throw new Error('대화 기록 삭제 실패')
    },
    onSuccess: () => {
      qc.setQueryData(['chat-history'], { rows: [] })
      setLastUserMessage(null)
      setShowSearch(false)
      setSearchQuery('')
    },
  })

  const handleClear = () => {
    if (rows.length === 0) return
    if (
      window.confirm(
        `대화 기록 ${rows.length}건을 모두 삭제하시겠습니까?\n폴더와 파일에는 영향이 없습니다.`,
      )
    ) {
      clearHistory.mutate()
    }
  }

  // 외부에서 챗 전송 트리거 가능하게 — window event 리스너.
  // 예: 매트릭스 "미제출 팀에 메일" 버튼이 dispatchEvent('draft:chat', {detail: '...'}).
  useEffect(() => {
    const onExternal = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === 'string' && detail.trim() && !send.isPending) {
        send.mutate(detail)
      }
    }
    window.addEventListener('draft:chat', onExternal)
    return () => window.removeEventListener('draft:chat', onExternal)
  }, [send])

  // 스크롤 위치 기반 자동 스크롤 — 이미 하단 근처일 때만 자동 따라가게,
  // 사용자가 위로 스크롤 중이면 끌어내리지 않음.
  const isNearBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isNearBottom()) {
      el.scrollTop = el.scrollHeight
    }
  }, [rows.length, send.isPending])

  // 스크롤 위치 변화 감지 → 하단 floating "맨 아래로" 버튼 표시.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setShowScrollDown(!isNearBottom() && rows.length > 3)
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [rows.length])

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const handleExport = () => {
    if (rows.length === 0) return
    const lines: string[] = []
    lines.push(`Draft 대화 기록 — ${new Date().toLocaleString('ko-KR')}`)
    lines.push('')
    for (const row of rows) {
      const text = extractText(row.content)
      if (!text) continue
      const ts = new Date(row.created_at).toLocaleString('ko-KR')
      const who = row.role === 'user' ? '나' : '비서'
      lines.push(`[${ts}] ${who}`)
      lines.push(text)
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `draft-chat-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 챗 내 검색 필터
  const filteredRows = searchQuery.trim()
    ? rows.filter((r) => {
        const text = extractText(r.content).toLowerCase()
        return text.includes(searchQuery.toLowerCase())
      })
    : rows

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 폴더 컨텍스트 + 액션 바 */}
      {(folderId && folderName) || rows.length > 0 ? (
        <div className="px-4 py-2 border-b border-hairline-dark flex items-center justify-between gap-2">
          <p className="text-caption text-on-dark-soft truncate min-w-0 flex-1">
            {folderId && folderName ? (
              <>
                현재 폴더 <span className="text-on-dark">{folderName}</span>
              </>
            ) : (
              <span>대화 {rows.length}건</span>
            )}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {rows.length >= 5 ? (
              <IconButton
                variant="ghost"
                size="sm"
                label={showSearch ? '검색 닫기' : '대화 내 검색'}
                onClick={() => {
                  setShowSearch((s) => !s)
                  if (showSearch) setSearchQuery('')
                }}
              >
                <SearchIcon size={14} />
              </IconButton>
            ) : null}
            {rows.length > 0 ? (
              <>
                <IconButton variant="ghost" size="sm" label="대화 내보내기" onClick={handleExport}>
                  <Download size={14} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="대화 지우기"
                  onClick={handleClear}
                  disabled={clearHistory.isPending}
                >
                  <Trash2 size={14} />
                </IconButton>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 검색 입력 */}
      {showSearch ? (
        <div className="px-4 py-2 border-b border-hairline-dark">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="대화 내 검색"
            autoFocus
            className="w-full h-8 px-3 bg-surface-dark-elevated border border-hairline-dark rounded-md text-caption text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-on-dark-soft"
          />
        </div>
      ) : null}

      {/* 메시지 스크롤 영역 */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto px-4 py-5 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="대화 기록"
        >
          {history.isLoading ? (
            <p className="text-body-sm text-on-dark-soft">불러오는 중…</p>
          ) : null}

          {rows.length === 0 && !history.isLoading ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-title-md text-on-dark">무엇을 도와드릴까요?</p>
                <p className="text-caption text-on-dark-soft">
                  아래 질문을 눌러보거나 직접 입력해보세요.
                </p>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <SuggestionCard
                    key={s.label}
                    icon={s.icon}
                    label={s.label}
                    description={s.description}
                    onClick={() => handleSend(s.label)}
                    disabled={send.isPending}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {searchQuery.trim() && filteredRows.length === 0 ? (
            <p className="text-body-sm text-on-dark-soft">검색 결과가 없습니다.</p>
          ) : null}

          {filteredRows.map((row) => {
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
              <MessageBubble
                key={row.id}
                role={row.role}
                text={text}
                createdAt={row.created_at}
              />
            )
          })}

          {send.isPending ? <TypingIndicator /> : null}

          {send.error && !send.isPending ? (
            <div className="chat-bubble-in rounded-2xl rounded-bl-md border border-on-dark-soft/40 bg-surface-dark-elevated px-4 py-3 max-w-[92%]">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-on-dark mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-body-sm text-on-dark">답변을 만들지 못했습니다.</p>
                  <p className="text-caption text-on-dark-soft mt-1">
                    잠시 후 다시 시도해 주세요.
                  </p>
                  {lastUserMessage ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1 mt-2 text-caption text-on-dark hover:text-on-dark-soft transition-colors"
                    >
                      <RefreshCw size={11} /> 다시 시도
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 맨 아래로 floating 버튼 */}
        {showScrollDown ? (
          <div className="absolute bottom-3 right-3 chat-bubble-in">
            <IconButton variant="solid" size="md" label="맨 아래로" onClick={scrollToBottom}>
              <ArrowDown size={16} strokeWidth={2.5} />
            </IconButton>
          </div>
        ) : null}
      </div>

      {/* Quick actions */}
      {folderId && rows.length > 0 ? (
        <div className="px-4 pt-2 pb-1 flex gap-2 overflow-x-auto border-t border-hairline-dark">
          {QUICK_ACTIONS.map((q) => (
            <ChipButton key={q} onClick={() => handleSend(q)} disabled={send.isPending}>
              {q}
            </ChipButton>
          ))}
        </div>
      ) : null}

      {/* 입력창 */}
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        pending={send.isPending}
        disabled={false}
        placeholder={folderId ? '메시지를 입력하세요' : '폴더 없이도 일반 대화는 가능합니다'}
      />
    </div>
  )
}
