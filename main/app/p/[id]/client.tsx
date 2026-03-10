'use client'

import { ProjectDetail } from '@/components/ProjectDetail'

export function ProjectDetailClient({ id }: { id: string }) {
  return <ProjectDetail id={id} />
}
