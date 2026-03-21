'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', fontFamily: 'monospace' }}>
          <div style={{ maxWidth: 400, width: '100%', border: '2px solid #3F3F46', background: '#fff', padding: 40, textAlign: 'center', boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 64, height: 64, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>!</span>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717A', marginBottom: 8 }}>
              CRITICAL ERROR
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#18181B', marginBottom: 12 }}>
              문제가 발생했습니다
            </h2>
            <p style={{ fontSize: 14, color: '#71717A', marginBottom: 8 }}>
              페이지를 불러올 수 없습니다. 다시 시도해주세요.
            </p>
            {error.digest && (
              <p style={{ fontSize: 10, color: '#D4D4D8', marginBottom: 24 }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{ padding: '10px 24px', background: '#000', color: '#fff', border: '1px solid #000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
