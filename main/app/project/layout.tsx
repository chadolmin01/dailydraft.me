'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const phases = [
  { id: 'ideate', label: 'Ideate', description: '아이디어 구체화', path: '/project/ideate' },
  { id: 'plan', label: 'Plan', description: 'PRD 생성', path: '/project/plan' },
  { id: 'build', label: 'Build', description: '태스크 정의', path: '/project/build' },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentPhaseIndex = phases.findIndex(p => pathname.startsWith(p.path));

  return (
    <div className="min-h-screen bg-surface-sunken">
      {/* Header */}
      <div className="bg-surface-card border-b border-border-strong">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-txt-primary mb-6">Project Studio</h1>

          {/* Phase Stepper */}
          <div className="flex items-center justify-between">
            {phases.map((phase, index) => {
              const isActive = pathname.startsWith(phase.path);
              const isPast = index < currentPhaseIndex;
              const isFuture = index > currentPhaseIndex;

              return (
                <React.Fragment key={phase.id}>
                  <Link
                    href={phase.path}
                    className={`flex-1 group ${index > 0 ? 'ml-4' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Step Circle */}
                      <div className={`
                        w-10 h-10 flex items-center justify-center text-sm font-bold
                        transition-all duration-200 border
                        ${isActive
                          ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                          : isPast
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-surface-sunken text-txt-tertiary border-border-strong group-hover:bg-surface-card'
                        }
                      `}>
                        {isPast ? '✓' : index + 1}
                      </div>

                      {/* Label */}
                      <div className="hidden sm:block">
                        <p className={`text-sm font-semibold ${isActive ? 'text-black' : 'text-txt-tertiary'}`}>
                          Phase {index + 1}: {phase.label}
                        </p>
                        <p className={`text-xs ${isActive ? 'text-txt-secondary' : 'text-txt-disabled'}`}>
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Connector Line */}
                  {index < phases.length - 1 && (
                    <div className={`
                      hidden sm:block flex-1 h-0.5 mx-4
                      ${index < currentPhaseIndex ? 'bg-emerald-500' : 'bg-border'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
