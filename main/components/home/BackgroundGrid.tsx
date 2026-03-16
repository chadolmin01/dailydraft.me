'use client'

import React from 'react'

export const BackgroundGrid: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base Grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '3rem 3rem'
        }}
      />

      {/* Radial fade for the grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_100%)] opacity-80" />

      {/* Architectural Elements Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-20" aria-hidden="true">
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="black" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Left Abstract Structure */}
        <g className="text-txt-primary" transform="translate(-50, 100)">
           <path d="M100,50 L300,50" stroke="currentColor" strokeWidth="1" />
           <path d="M100,50 L100,400" stroke="currentColor" strokeWidth="1" />
           <path d="M100,400 L300,400" stroke="currentColor" strokeWidth="1" />
           <path d="M300,50 L300,400" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />

           {/* Cross lines */}
           <path d="M100,150 L300,250" stroke="currentColor" strokeWidth="0.5" />
           <path d="M100,300 L300,200" stroke="currentColor" strokeWidth="0.5" />

           {/* Circles/Nodes */}
           <circle cx="100" cy="50" r="2" fill="currentColor" />
           <circle cx="300" cy="50" r="2" fill="currentColor" />
           <circle cx="100" cy="400" r="2" fill="currentColor" />
        </g>

        {/* Right Wireframe Building Mesh */}
        <g className="text-txt-primary" transform="translate(1000, 50) scale(1.5)">
           <path d="M100,0 L200,50 L100,100 L0,50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
           <path d="M100,100 L100,250" stroke="currentColor" strokeWidth="0.5" />
           <path d="M200,50 L200,200" stroke="currentColor" strokeWidth="0.5" />
           <path d="M0,50 L0,200" stroke="currentColor" strokeWidth="0.5" />
           <path d="M0,200 L100,250 L200,200" stroke="currentColor" strokeWidth="0.5" />

           {/* Internal structure lines */}
           <path d="M100,0 L100,100" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
           <path d="M0,50 L200,50" stroke="currentColor" strokeWidth="0.2" />
           <path d="M100,250 L200,50" stroke="currentColor" strokeWidth="0.2" opacity="0.5" />
           <path d="M100,250 L0,50" stroke="currentColor" strokeWidth="0.2" opacity="0.5" />
        </g>
      </svg>

      {/* Corner Marks */}
      <div className="absolute top-10 left-10 w-4 h-4 border-l border-t border-border-strong opacity-50" />
      <div className="absolute top-10 right-10 w-4 h-4 border-r border-t border-border-strong opacity-50" />
      <div className="absolute bottom-10 left-10 w-4 h-4 border-l border-b border-border-strong opacity-50" />
      <div className="absolute bottom-10 right-10 w-4 h-4 border-r border-b border-border-strong opacity-50" />
    </div>
  )
}
