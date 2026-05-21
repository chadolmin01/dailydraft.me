'use client'

import React from 'react'
import { cn } from '@/src/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  /** Max-width variant. Maps to tailwind maxWidth tokens. */
  size?: 'narrow' | 'standard' | 'wide'
  /** Additional className */
  className?: string
  /** Use as a specific HTML element */
  as?: 'div' | 'section' | 'main' | 'article'
}

const sizeMap = {
  narrow: 'max-w-[768px]',
  standard: 'max-w-[900px]',
  wide: 'max-w-[1400px]',
} as const

/**
 * Centered max-width container with consistent horizontal padding.
 * Use this to wrap page-level content.
 *
 * Usage:
 *   <PageContainer size="standard">
 *     {existing page content}
 *   </PageContainer>
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  size = 'standard',
  className,
  as: Component = 'div',
}) => {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeMap[size],
        className
      )}
    >
      {children}
    </Component>
  )
}
