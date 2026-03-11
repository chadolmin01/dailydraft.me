'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'

export default function DashboardPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-full">
      {/* Welcome */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-64 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
        </PageContainer>
      </Section>

      {/* Stats */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
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
              <div className="h-6 w-48 bg-gray-200 rounded" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-36" />
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-64 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-400 font-mono">
                CALENDAR
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* My Projects */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="h-6 w-36 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-72 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </Section>
    </div>
  )
}
