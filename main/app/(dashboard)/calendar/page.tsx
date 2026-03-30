'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function CalendarPage() {
  return (
    <div className="bg-surface-bg min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-border pb-6">
            <div>
              <div className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                CALENDAR
              </div>
              <div className="h-8 w-32 bg-surface-sunken" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-surface-sunken rounded-xl border border-border" />
              <div className="h-10 w-10 bg-surface-sunken rounded-xl border border-border" />
              <div className="h-10 w-24 bg-surface-sunken rounded-xl border border-border" />
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="bg-surface-card rounded-xl border border-border shadow-sharp p-6">
            <div className="grid grid-cols-7 gap-px bg-border overflow-hidden">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="bg-surface-sunken p-3 text-center text-[0.625rem] font-medium text-txt-tertiary">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-surface-card p-3 h-24 border-r border-b border-border" />
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
