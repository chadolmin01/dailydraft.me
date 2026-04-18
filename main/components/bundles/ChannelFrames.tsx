'use client'

/**
 * 채널별 플랫폼 프레임.
 * 각 어댑터가 생성한 텍스트를 "실제 플랫폼에서 어떻게 보일지" 미리보기.
 * 정밀 재현은 아니되 시각적 맥락이 생겨 회장이 승인 판단하기 쉬움.
 */

import { Heart, MessageCircle, Send, Bookmark, Repeat2 } from 'lucide-react'
import type { ChannelFormat, PersonaOutputRow } from '@/src/lib/personas/types'

interface ChannelFrameProps {
  format: ChannelFormat
  output: PersonaOutputRow
  orgName?: string
}

export function ChannelFrame({ format, output, orgName }: ChannelFrameProps) {
  const name = orgName || '우리 동아리'
  switch (format) {
    case 'instagram_caption':
      return <InstagramFrame output={output} orgName={name} />
    case 'linkedin_post':
      return <LinkedInFrame output={output} orgName={name} />
    case 'everytime_post':
      return <EverytimeFrame output={output} />
    case 'email_newsletter':
      return <EmailFrame output={output} orgName={name} />
    case 'discord_forum_markdown':
      return <DiscordFrame output={output} orgName={name} />
    default:
      return <RawFrame output={output} />
  }
}

// ============================================================
// Instagram — 모바일 카드 스타일
// ============================================================
function InstagramFrame({
  output,
  orgName,
}: {
  output: PersonaOutputRow
  orgName: string
}) {
  const { caption, hashtags } = parseInstagramContent(output.generated_content)
  return (
    <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl overflow-hidden max-w-md mx-auto shadow-sm">
      {/* 헤더: 계정 */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neutral-900 dark:text-white">
              {orgName.slice(0, 2)}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
          {orgName.toLowerCase().replace(/\s+/g, '_')}
        </span>
      </div>
      {/* 이미지 자리 (placeholder) */}
      <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
        <p className="text-xs text-neutral-400">이미지 자리 · 1:1</p>
      </div>
      {/* 액션 아이콘 */}
      <div className="flex items-center gap-3 px-3 py-2 text-neutral-900 dark:text-neutral-100">
        <Heart size={22} />
        <MessageCircle size={22} />
        <Send size={22} />
        <Bookmark size={22} className="ml-auto" />
      </div>
      {/* 캡션 */}
      <div className="px-3 pb-3 text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100">
        <span className="font-semibold mr-1.5">
          {orgName.toLowerCase().replace(/\s+/g, '_')}
        </span>
        <span className="whitespace-pre-wrap break-words">{caption}</span>
        {hashtags.length > 0 && (
          <p className="mt-2 text-brand break-words">{hashtags.join(' ')}</p>
        )}
      </div>
    </div>
  )
}

function parseInstagramContent(content: string): {
  caption: string
  hashtags: string[]
} {
  const lines = content.split('\n')
  const tagLineIdx = [...lines].reverse().findIndex((l) => /^\s*#/.test(l.trim()))
  if (tagLineIdx === -1) return { caption: content, hashtags: [] }
  const idx = lines.length - 1 - tagLineIdx
  const tagLine = lines[idx] ?? ''
  const caption = lines.slice(0, idx).join('\n').trim()
  const hashtags = tagLine.split(/\s+/).filter((t) => t.startsWith('#'))
  return { caption, hashtags }
}

// ============================================================
// LinkedIn — 데스크톱 피드 카드
// ============================================================
function LinkedInFrame({
  output,
  orgName,
}: {
  output: PersonaOutputRow
  orgName: string
}) {
  const { body, hashtags } = parseLinkedInContent(output.generated_content)
  return (
    <div className="bg-white dark:bg-neutral-900 border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-11 h-11 rounded-full bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#0A66C2]">
            {orgName.slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {orgName}
          </p>
          <p className="text-[11px] text-neutral-500">Now · Public</p>
        </div>
      </div>
      <div className="px-4 pb-3 text-[14px] leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
        {body}
        {hashtags.length > 0 && (
          <p className="mt-2 text-[#0A66C2] break-words">{hashtags.join(' ')}</p>
        )}
      </div>
      <div className="flex items-center gap-1 border-t border-border px-1 py-1">
        <LinkedInAction label="Like" />
        <LinkedInAction label="Comment" />
        <LinkedInAction label="Repost" />
        <LinkedInAction label="Send" />
      </div>
    </div>
  )
}

function LinkedInAction({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex-1 text-center text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      {label}
    </button>
  )
}

function parseLinkedInContent(content: string): {
  body: string
  hashtags: string[]
} {
  // parseInstagramContent와 동일한 형태
  return parseInstagramContent(content)
}

// ============================================================
// Everytime — 리스트 스타일 (한국 대학 커뮤니티)
// ============================================================
function EverytimeFrame({ output }: { output: PersonaOutputRow }) {
  const title =
    (output.input_context as { title?: string })?.title ?? '(제목 없음)'
  const body = output.generated_content.replace(title, '').trim()

  return (
    <div className="bg-white dark:bg-neutral-900 border border-border rounded-xl overflow-hidden shadow-sm">
      {/* 에타 게시판 헤더 */}
      <div className="px-4 py-2.5 border-b border-border bg-[#FF5722]/5">
        <p className="text-[11px] font-bold text-[#FF5722] tracking-wider">
          동아리 게시판
        </p>
      </div>
      {/* 제목 */}
      <div className="px-4 py-3.5 border-b border-border">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1.5">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span>익명</span>
          <span>·</span>
          <span>방금</span>
          <span>·</span>
          <span>조회 0</span>
        </div>
      </div>
      {/* 본문 */}
      <div className="px-4 py-4 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
        {body}
      </div>
      {/* 좋아요·댓글 */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border text-[11px] text-neutral-500">
        <span>👍 0</span>
        <span>💬 0</span>
      </div>
    </div>
  )
}

// ============================================================
// Email Newsletter — 이메일 클라이언트 프리뷰
// ============================================================
function EmailFrame({
  output,
  orgName,
}: {
  output: PersonaOutputRow
  orgName: string
}) {
  const parsed = parseEmailContent(output.generated_content)

  return (
    <div className="bg-white dark:bg-neutral-900 border border-border rounded-xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="border-b border-border">
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand">
              {orgName.slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {orgName}
              </p>
              <span className="text-[11px] text-neutral-500 shrink-0">방금</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              받는 사람: 구독자
            </p>
          </div>
        </div>
        {/* 제목 + 프리뷰 */}
        <div className="px-4 pb-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {parsed.subject}
          </h3>
          {parsed.preview && (
            <p className="text-xs text-neutral-500 italic">{parsed.preview}</p>
          )}
        </div>
      </div>
      {/* 본문 */}
      <div className="px-4 py-4 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
        {parsed.body}
      </div>
    </div>
  )
}

function parseEmailContent(content: string): {
  subject: string
  preview: string
  body: string
} {
  // 어댑터가 `# subject\n\n> preview\n\n{body}` 형식으로 저장.
  const subjectMatch = content.match(/^#\s+(.+)$/m)
  const previewMatch = content.match(/^>\s+(.+)$/m)
  const subject = subjectMatch?.[1]?.trim() || '(제목 없음)'
  const preview = previewMatch?.[1]?.trim() || ''

  let body = content
  if (subjectMatch) body = body.replace(subjectMatch[0], '')
  if (previewMatch) body = body.replace(previewMatch[0], '')
  return { subject, preview, body: body.trim() }
}

// ============================================================
// Discord — 메시지 버블
// ============================================================
function DiscordFrame({
  output,
  orgName,
}: {
  output: PersonaOutputRow
  orgName: string
}) {
  const title =
    (output.input_context as { title?: string })?.title ?? null
  return (
    <div className="bg-[#313338] rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#C9D1F5]">
              {orgName.slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-white">
                {orgName}
              </span>
              <span className="text-[10px] text-[#949BA4]">오늘 오후</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#5865F2] text-white font-semibold">
                BOT
              </span>
            </div>
            {title && (
              <p className="text-sm font-bold text-white mb-1">{title}</p>
            )}
            <div className="text-[14px] leading-relaxed text-[#DBDEE1] whitespace-pre-wrap break-words">
              {output.generated_content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Fallback
// ============================================================
function RawFrame({ output }: { output: PersonaOutputRow }) {
  return (
    <pre className="bg-surface-bg rounded-xl p-4 text-sm text-txt-primary whitespace-pre-wrap break-words leading-relaxed font-sans max-h-96 overflow-y-auto">
      {output.generated_content}
    </pre>
  )
}
