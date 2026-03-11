'use client'

import { PageContainer } from '@/components/ui/PageContainer'

export default function MessagesPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-full">
      <PageContainer size="wide" className="py-6">
        <div className="flex gap-4 h-[calc(100vh-120px)]">
          {/* Conversation List */}
          <div className="w-80 bg-white border border-gray-200 rounded-xl shrink-0 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-9 w-full bg-gray-100 rounded" />
            </div>
            <div className="p-2 space-y-1 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-36 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-mono">
              MESSAGES
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="h-10 w-full bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
