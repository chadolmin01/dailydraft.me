'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  padding?: string
  className?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'p-4',
  className = '',
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-sm ${padding} ${className}`}>
      {children}
    </div>
  )
}

export default Card
