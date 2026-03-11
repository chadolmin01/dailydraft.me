'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function DocumentsPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <div>
              <div className="text-xs font-mono text-gray-500 mb-2">DOCUMENTS</div>
              <div className="h-8 w-36 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
