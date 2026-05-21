'use client'

import { useEffect } from 'react'

/**
 * Global Error Boundary — 루트 layout 자체가 실패할 때만 발동.
 * `app/error.tsx` 와 달리 <html>·<body> 가 없는 상태에서 렌더되므로
 * 자체적으로 DOM 루트를 구성. 스타일링은 인라인으로.
 *
 * 이전 브루탈리즘 스타일(모노스페이스·검은 박스·CRITICAL ERROR 영문 라벨) 리프레시.
 * Electric Indigo + Toss 톤으로 통일.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global] Unhandled error:', error)
    // 루트 레이아웃이 터졌으므로 PostHog Provider·React Query 등 모든 컨텍스트가 죽은 상태.
    // 안전한 최소 경로로만 전송 — fetch + keepalive 는 unload 중에도 살아남는다.
    try {
      fetch('/api/client-error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          name: error.name,
          stack: error.stack,
          source: 'global-error',
          digest: error.digest,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // silent — 절대 사용자 UI 를 덮을 수 없음
    }
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#F8F9FB',
          color: '#1C1C1E',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E5E8EB',
              borderRadius: 20,
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#1C1C1E',
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              잠깐 문제가 생겼어요
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#3A3A3C',
                lineHeight: 1.5,
                margin: '0 0 4px',
              }}
            >
              앱을 불러오지 못했습니다. 새로고침으로 대부분 해결됩니다.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: 11,
                  color: '#8E8E93',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                문의 시:{' '}
                <code
                  style={{
                    padding: '2px 6px',
                    background: '#EEF0F3',
                    borderRadius: 4,
                    fontFamily:
                      '"JetBrains Mono", Consolas, Menlo, monospace',
                    fontSize: 10,
                  }}
                >
                  {error.digest}
                </code>
              </p>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 28,
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#5E6AD2',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(94, 106, 210, 0.2)',
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid #E5E8EB',
                  background: '#FFFFFF',
                  color: '#3A3A3C',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                홈으로
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
