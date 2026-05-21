import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '아이디어 검증 | Draft',
  description: 'AI 3인 토론으로 당신의 스타트업 아이디어를 검증하세요',
}

export default function IdeaValidatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full overflow-hidden">
      {children}
    </div>
  )
}
