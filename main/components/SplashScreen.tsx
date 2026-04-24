'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [phase, setPhase] = useState<'enter' | 'show' | 'out' | 'done'>('enter')

  useEffect(() => {
    // Skip if already shown this session, or if a modal is about to open via URL params
    const hasDeepLink = typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).has('project') ||
      new URLSearchParams(window.location.search).has('profile')
    )
    if (sessionStorage.getItem('draft-splash-shown') || hasDeepLink) {
      setPhase('done')
      return
    }
    sessionStorage.setItem('draft-splash-shown', '1')

    const t1 = setTimeout(() => setPhase('show'), 100)
    const t2 = setTimeout(() => setPhase('out'), 1400)
    const t3 = setTimeout(() => setPhase('done'), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-9999 flex items-center justify-center bg-surface-bg transition-opacity duration-500 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Logo group */}
      <div
        className={`flex flex-col items-center gap-5 transition-all duration-700 ${
          phase === 'enter'
            ? 'opacity-0 scale-90 translate-y-4'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* D mark — rounded, with soft shadow */}
        <div className="w-20 h-20 rounded-2xl bg-surface-inverse flex items-center justify-center shadow-lg splash-mark">
          <span className="text-txt-inverse font-black text-4xl leading-none">D</span>
        </div>

        {/* Wordmark + tagline */}
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-500 delay-200 ${
            phase === 'enter'
              ? 'opacity-0 translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="text-txt-primary font-bold text-2xl tracking-tight">Draft.</span>
          <span className="text-txt-tertiary text-xs tracking-wide">
            where projects begin
          </span>
        </div>
      </div>

      <style jsx>{`
        .splash-mark {
          animation: splashMarkPulse 1.4s ease-in-out infinite;
        }
        @keyframes splashMarkPulse {
          0%, 100% { box-shadow: var(--shadow-lg); }
          50% { box-shadow: var(--shadow-xl); }
        }
      `}</style>
    </div>
  )
}
