'use client'

import { Suspense } from 'react'
import { ValidatedIdeasPage } from '@/components/ValidatedIdeasPage'

export default function ValidatedIdeas() {
  return (
    <Suspense>
      <ValidatedIdeasPage />
    </Suspense>
  )
}
