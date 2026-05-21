'use client'

import { FileText } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * @deprecated MVP 모드 숨김 (access manifest: tier='hidden', middleware 가 /explore 리다이렉트).
 * 코드 보존용 — 추후 재활용 여부 판단 후 활성화 or 삭제 결정.
 */
export default function DocumentsPage() {
  return (
    <div className="bg-surface-bg min-h-full">
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex justify-between items-center border-b border-border pb-6">
            <div>
              <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                DOCUMENTS
              </div>
              <h1 className="text-2xl font-bold text-txt-primary">문서</h1>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <EmptyState
            icon={FileText}
            title="문서 기능 준비 중"
            description="곧 만나보실 수 있습니다"
          />
        </PageContainer>
      </Section>
    </div>
  )
}
