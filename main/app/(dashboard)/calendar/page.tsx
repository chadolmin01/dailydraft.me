'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function CalendarPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <div>
              <div className="text-xs font-mono text-gray-500 mb-2">CALENDAR</div>
              <div className="h-8 w-32 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded" />
              <div className="h-10 w-10 bg-gray-200 rounded" />
              <div className="h-10 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="bg-gray-50 p-3 text-center text-xs font-bold text-gray-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-white p-3 h-24" />
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
