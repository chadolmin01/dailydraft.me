'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  iconSize?: number
  showToast?: boolean
  toastMessage?: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  className = '',
  iconSize = 14,
  showToast = true,
  toastMessage = '복사되었습니다',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      if (showToast) {
        toast.success(toastMessage)
      }

      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={`${label || text} 복사`}
      className={`inline-flex items-center gap-1 text-txt-tertiary hover:text-txt-secondary transition-colors ${className}`}
    >
      {copied ? (
        <Check size={iconSize} className="text-green-500" />
      ) : (
        <Copy size={iconSize} />
      )}
      {label && <span className="text-xs">{label}</span>}
    </button>
  )
}

/**
 * 클릭 가능한 텍스트 + 복사 버튼 조합
 */
interface CopyableTextProps {
  text: string
  className?: string
  iconSize?: number
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  text,
  className = '',
  iconSize = 12,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('복사되었습니다')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 group cursor-pointer hover:text-txt-primary transition-colors ${className}`}
      title="클릭하여 복사"
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check size={iconSize} className="text-green-500 shrink-0" />
      ) : (
        <Copy size={iconSize} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  )
}

export default CopyButton
