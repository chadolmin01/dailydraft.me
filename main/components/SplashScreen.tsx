'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [phase, setPhase] = useState<'grid' | 'logo' | 'out' | 'done'>('grid')

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('draft-splash-shown')) {
      setPhase('done')
      return
    }
    sessionStorage.setItem('draft-splash-shown', '1')

    const t1 = setTimeout(() => setPhase('logo'), 600)
    const t2 = setTimeout(() => setPhase('out'), 1600)
    const t3 = setTimeout(() => setPhase('done'), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-surface-bg transition-opacity duration-500 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Grid lines — animated drawing */}
      <svg
        className="absolute inset-0 w-full h-full splash-grid"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="splash-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="0.5"
              className="splash-grid-line"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#splash-grid-pattern)" />
      </svg>

      {/* Center crosshair — blueprint reference point */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`splash-crosshair ${phase === 'grid' ? '' : 'splash-crosshair-fade'}`}>
          <div className="w-px h-16 bg-border-strong" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-px bg-border-strong" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-txt-tertiary rounded-full" />
        </div>
      </div>

      {/* Logo — appears after grid draws */}
      <div
        className={`relative z-10 flex flex-col items-center gap-5 transition-all duration-500 ${
          phase === 'grid'
            ? 'opacity-0 scale-95 translate-y-3'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {/* D mark */}
        <div className="w-20 h-20 bg-surface-inverse flex items-center justify-center">
          <span className="text-txt-inverse font-black text-4xl leading-none">D</span>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-txt-primary font-bold text-2xl tracking-tight">Draft.</span>
          <span className="text-txt-tertiary text-xs tracking-wide">
            where projects begin
          </span>
        </div>
      </div>

      {/* Corner dots — minimal frame */}
      <div className={`splash-corners ${phase === 'grid' ? '' : 'splash-corners-visible'}`}>
        <div className="absolute top-10 left-10 w-2 h-2 bg-border-strong" />
        <div className="absolute top-10 right-10 w-2 h-2 bg-border-strong" />
        <div className="absolute bottom-10 left-10 w-2 h-2 bg-border-strong" />
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-border-strong" />
      </div>

      <style jsx>{`
        /* Grid pattern fade-in */
        .splash-grid {
          opacity: 0;
          animation: splashGridReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes splashGridReveal {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* Grid lines draw-in effect */
        .splash-grid-line {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: splashLineDraw 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes splashLineDraw {
          0% { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }

        /* Crosshair */
        .splash-crosshair {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          animation: splashCrosshairIn 0.4s 0.2s ease-out forwards;
        }
        .splash-crosshair-fade {
          opacity: 1;
          animation: splashCrosshairOut 0.3s ease-in forwards;
        }
        @keyframes splashCrosshairIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splashCrosshairOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Corner brackets */
        .splash-corners > div {
          opacity: 0;
          transform: scale(0.8);
        }
        .splash-corners-visible > div {
          animation: splashCornerIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .splash-corners-visible > div:nth-child(1) { animation-delay: 0ms; }
        .splash-corners-visible > div:nth-child(2) { animation-delay: 60ms; }
        .splash-corners-visible > div:nth-child(3) { animation-delay: 120ms; }
        .splash-corners-visible > div:nth-child(4) { animation-delay: 180ms; }
        @keyframes splashCornerIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
