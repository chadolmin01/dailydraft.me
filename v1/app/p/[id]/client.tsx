'use client'

import { ProjectDetail } from '@/components/ProjectDetail'
import { MicroPromptPopup } from '@/components/onboarding/MicroPromptPopup'

export function ProjectDetailClient({ id }: { id: string }) {
  return (
    <>
      <ProjectDetail id={id} />
      {/* 30초 체류 시 Ambient 1문항 팝업. MicroPromptPopup 자체가 로그인·AI 미완료·쿨다운 체크 */}
      <MicroPromptPopup pathname={`/p/${id}`} thresholdMs={30_000} />
    </>
  )
}
