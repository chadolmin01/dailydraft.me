'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
            <div style={{ width: '4rem', height: '4rem', background: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'monospace' }}>D</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              문제가 발생했습니다
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#71717A', marginBottom: '1.5rem' }}>
              일시적인 오류가 발생했습니다. 다시 시도해주세요.
            </p>
            <button
              onClick={reset}
              style={{ padding: '0.625rem 1.5rem', background: '#18181B', color: '#fff', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
