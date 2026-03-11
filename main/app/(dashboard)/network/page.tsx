'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function NetworkPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <div>
              <div className="text-xs font-mono text-gray-500 mb-2">NETWORK</div>
              <div className="h-8 w-40 bg-gray-200 rounded" />
            </div>
            <div className="h-9 w-64 bg-gray-100 rounded" />
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="h-5 w-24 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-4 w-20 bg-gray-100 rounded mx-auto mb-3" />
                <div className="flex justify-center gap-1">
                  <div className="h-5 w-14 bg-gray-100 rounded" />
                  <div className="h-5 w-14 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
