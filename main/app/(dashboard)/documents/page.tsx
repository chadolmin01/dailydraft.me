'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function DocumentsPage() {
  return (
    <div className="bg-surface-bg min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-dashed border-border pb-6">
            <div>
              <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                DOCUMENTS
              </div>
              <div className="h-8 w-36 bg-surface-sunken" />
            </div>
            <div className="h-10 w-32 bg-surface-sunken border border-border-strong" />
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-card border border-border-strong shadow-sharp p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-sunken border border-border shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-surface-sunken mb-1" />
                  <div className="h-3 w-32 bg-surface-sunken" />
                </div>
                <div className="h-4 w-20 bg-surface-sunken border border-border" />
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
