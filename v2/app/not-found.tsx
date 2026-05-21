import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-display-md text-ink">페이지를 찾을 수 없습니다.</p>
        <p className="text-body-md text-muted">
          링크가 잘못되었거나, 해당 페이지가 옮겨졌을 수 있습니다.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors"
        >
          홈으로
        </a>
      </div>
    </main>
  )
}
