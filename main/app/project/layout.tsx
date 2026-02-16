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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Studio</h1>

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
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        transition-all duration-200
                        ${isActive
                          ? 'bg-black text-white'
                          : isPast
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                        }
                      `}>
                        {isPast ? '✓' : index + 1}
                      </div>

                      {/* Label */}
                      <div className="hidden sm:block">
                        <p className={`text-sm font-semibold ${isActive ? 'text-black' : 'text-gray-500'}`}>
                          Phase {index + 1}: {phase.label}
                        </p>
                        <p className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Connector Line */}
                  {index < phases.length - 1 && (
                    <div className={`
                      hidden sm:block flex-1 h-0.5 mx-4
                      ${index < currentPhaseIndex ? 'bg-emerald-500' : 'bg-gray-200'}
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
