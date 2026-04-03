'use client'

import React from 'react'

export const BackgroundGrid: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Hero area brand tint */}
      <div className="absolute top-0 left-0 right-0 h-[80vh] bg-gradient-to-b from-brand-bg/20 via-transparent to-transparent" />

      {/* Edge fades */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_100%)] opacity-70" />
    </div>
  )
}
