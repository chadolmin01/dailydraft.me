'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function NetworkPage() {
  return (
    <div className="bg-surface-bg min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-border pb-6">
            <div>
              <div className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                NETWORK
              </div>
              <div className="h-8 w-40 bg-surface-sunken" />
            </div>
            <div className="h-9 w-64 bg-surface-sunken rounded-xl border border-border" />
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-surface-card rounded-xl border border-border shadow-md p-5 text-center">
                <div className="w-16 h-16 bg-surface-sunken rounded-xl border border-border mx-auto mb-3" />
                <div className="h-5 w-24 bg-surface-sunken mx-auto mb-1" />
                <div className="h-4 w-20 bg-surface-sunken mx-auto mb-3" />
                <div className="flex justify-center gap-1">
                  <div className="h-5 w-14 bg-surface-sunken rounded-xl border border-border" />
                  <div className="h-5 w-14 bg-surface-sunken rounded-xl border border-border" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
