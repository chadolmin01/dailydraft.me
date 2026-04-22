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
  toastMessage = '클립보드에 복사했습니다',
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
      toast.error('복사에 실패했습니다', {
        description: '브라우저가 clipboard 권한을 허용하지 않는 경우입니다. 해당 텍스트를 직접 선택해 복사해 주세요.',
      })
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? '복사 완료' : `${label || text} 클립보드에 복사`}
      title={copied ? '복사했습니다' : '클릭하시면 클립보드에 복사됩니다'}
      className={`inline-flex items-center gap-1 text-txt-tertiary hover:text-txt-secondary transition-colors ${className}`}
    >
      {copied ? (
        <Check size={iconSize} className="text-status-success-text icon-bounce" aria-hidden="true" />
      ) : (
        <Copy size={iconSize} aria-hidden="true" />
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
      toast.success('클립보드에 복사했습니다')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('복사에 실패했습니다', {
        description: '브라우저 권한이 차단된 경우일 수 있습니다. 텍스트를 직접 선택해 복사해 주세요.',
      })
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? `${text} 복사 완료` : `${text} 클립보드에 복사`}
      className={`inline-flex items-center gap-1.5 group cursor-pointer hover:text-txt-primary transition-colors ${className}`}
      title={copied ? '복사했습니다' : '클릭하시면 클립보드에 복사됩니다'}
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check size={iconSize} className="text-status-success-text shrink-0" aria-hidden="true" />
      ) : (
        <Copy size={iconSize} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
      )}
    </button>
  )
}

export default CopyButton
