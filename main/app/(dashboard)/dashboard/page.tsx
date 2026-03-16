'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function DashboardPage() {
  return (
    <div className="bg-surface-bg min-h-full">
      {/* Welcome */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-dashed border-border pb-6">
            <div>
              <div className="h-4 w-24 bg-surface-sunken border border-border mb-2" />
              <div className="h-8 w-64 bg-surface-sunken border border-border" />
            </div>
            <div className="h-10 w-32 bg-surface-sunken border border-border" />
          </div>
        </PageContainer>
      </Section>

      {/* Stats */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 bg-surface-inverse text-txt-inverse flex items-center justify-center text-[0.5rem] font-bold font-mono">S</span>
            <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">Stats Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-card border border-border-strong shadow-sharp p-5 relative">
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
                <div className="text-[0.625rem] font-mono text-txt-disabled mb-1">{String(i).padStart(2, '0')}</div>
                <div className="h-4 w-20 bg-surface-sunken border border-border mb-3" />
                <div className="h-8 w-16 bg-surface-sunken border border-border" />
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>

      {/* Recommended + Calendar */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#4F46E5] text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">R</span>
                <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">Recommended</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-card border border-border-strong shadow-sharp p-6 h-36 relative">
                  <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
                  <div className="text-[0.625rem] font-mono text-txt-disabled">{String(i).padStart(2, '0')}</div>
                </div>
              ))}
            </div>
            <div className="bg-surface-card border border-border-strong shadow-sharp p-6 relative">
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 bg-surface-inverse text-txt-inverse flex items-center justify-center text-[0.5rem] font-bold font-mono">C</span>
                <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">Calendar</span>
              </div>
              <div className="h-64 bg-surface-sunken border border-dashed border-border flex items-center justify-center text-sm text-txt-disabled font-mono">
                CALENDAR
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* My Projects */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 bg-[#059669] text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">P</span>
            <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">My Projects</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-card border border-border-strong shadow-sharp p-5 flex items-center gap-6 relative">
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
                <div className="text-[0.625rem] font-mono text-txt-disabled">{String(i).padStart(2, '0')}</div>
                <div className="w-12 h-12 bg-surface-sunken border border-border shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-surface-sunken border border-border mb-2" />
                  <div className="h-4 w-72 bg-surface-sunken border border-border" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
