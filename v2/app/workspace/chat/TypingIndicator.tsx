'use client'

/**
 * 응답 대기 중 표시. 3 dots 위로 출렁이는 애니메이션 — 라이트 톤.
 */
export function TypingIndicator() {
  return (
    <div
      className="chat-bubble-in inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-surface-soft border border-hairline"
      role="status"
      aria-label="응답을 작성하는 중입니다"
    >
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-soft" />
    </div>
  )
}
