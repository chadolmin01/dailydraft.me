'use client'

import React from 'react'
import { cn } from '@/src/lib/utils'

interface SectionProps {
  children: React.ReactNode
  /** Vertical padding variant */
  spacing?: 'sm' | 'md' | 'lg'
  /** Background color */
  bg?: 'white' | 'gray' | 'transparent'
  /** Additional className */
  className?: string
}

const spacingMap = {
  sm: 'py-12',
  md: 'py-16 md:py-20',
  lg: 'py-20 md:py-28',
} as const

const bgMap = {
  white: 'bg-surface-card',
  gray: 'bg-surface-sunken',
  transparent: '',
} as const

/**
 * Landing/marketing page section wrapper.
 * Provides consistent vertical spacing and background.
 *
 * Usage:
 *   <Section spacing="lg" bg="gray">
 *     <PageContainer size="standard">
 *       {content}
 *     </PageContainer>
 *   </Section>
 */
export const Section: React.FC<SectionProps> = ({
  children,
  spacing = 'md',
  bg = 'transparent',
  className,
}) => {
  return (
    <section className={cn(spacingMap[spacing], bgMap[bg], className)}>
      {children}
    </section>
  )
}
