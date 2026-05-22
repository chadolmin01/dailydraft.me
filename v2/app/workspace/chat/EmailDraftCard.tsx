'use client'

import { ExternalLink, Mail } from 'lucide-react'

export interface EmailDraftRef {
  kind: 'gmail_draft' | 'mailto'
  url: string
  subject?: string
  recipientCount?: number
}

export function EmailDraftCard({ draft }: { draft: EmailDraftRef }) {
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
      className="chat-bubble-in block rounded-2xl bg-surface-dark-elevated border border-hairline-dark px-4 py-3 hover:border-on-dark-soft hover:bg-surface-dark-soft transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-surface-dark grid place-items-center shrink-0 border border-hairline-dark">
          <Mail size={16} className="text-on-dark-soft group-hover:text-on-dark transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-on-dark font-medium">{label}</p>
          <p className="text-caption text-on-dark-soft mt-0.5 truncate">{sub}</p>
        </div>
        <ExternalLink size={14} className="text-on-dark-soft shrink-0" />
      </div>
    </a>
  )
}

// 메일 초안 추출 — compose_email_draft 도구 결과에서 Gmail 초안 또는 mailto 링크.
export function extractEmailDrafts(content: unknown): EmailDraftRef[] {
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
          recipientCount:
            typeof parsed.recipient_count === 'number' ? parsed.recipient_count : undefined,
        })
      } else if (typeof parsed.mailto_url === 'string') {
        refs.push({
          kind: 'mailto',
          url: parsed.mailto_url,
          subject: typeof parsed.subject === 'string' ? parsed.subject : undefined,
          recipientCount:
            typeof parsed.recipient_count === 'number' ? parsed.recipient_count : undefined,
        })
      }
    } catch {}
  }
  return refs
}
