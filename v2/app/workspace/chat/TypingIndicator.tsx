'use client'

/**
 * 응답 대기 중 표시. 3 dots 위로 출렁이는 애니메이션.
 * "처리 중…" 텍스트보다 채팅 인터페이스 톤에 맞음.
 */
export function TypingIndicator() {
  return (
    <div
      className="chat-bubble-in inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-surface-dark-elevated"
      role="status"
      aria-label="응답을 작성하는 중입니다"
    >
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-on-dark-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-on-dark-soft" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-on-dark-soft" />
    </div>
  )
}
