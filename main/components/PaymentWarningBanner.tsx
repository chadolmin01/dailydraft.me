'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, X, CreditCard, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentFailure {
  status: string
  daysUntilDowngrade: number
  gracePeriodEndsAt: string
  failureCount: number
}

interface PaymentStatusData {
  paymentFailure: PaymentFailure | null
  showWarning: boolean
  warningLevel: 'critical' | 'warning' | 'info' | null
}

export function PaymentWarningBanner() {
  const router = useRouter()
  const [data, setData] = useState<PaymentStatusData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/payment-status')
        if (response.ok) {
          const result = await response.json()
          setData(result.data)
        }
      } catch {
        // Silent fail
      }
    }

    fetchStatus()
  }, [])

  if (!data?.showWarning || !data.paymentFailure || dismissed) {
    return null
  }

  const { paymentFailure, warningLevel } = data

  const levelStyles = {
    critical: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const styles = levelStyles[warningLevel || 'info']

  const getMessage = () => {
    switch (paymentFailure.status) {
      case 'final_warning':
        return `긴급: ${paymentFailure.daysUntilDowngrade}일 후 무료 플랜으로 자동 전환됩니다.`
      case 'retry_failed':
        return `결제가 ${paymentFailure.failureCount}회 실패했습니다. ${paymentFailure.daysUntilDowngrade}일 내에 결제 수단을 확인해주세요.`
      case 'initial_failure':
        return `결제가 실패했습니다. ${paymentFailure.daysUntilDowngrade}일 내에 결제 수단을 업데이트해주세요.`
      default:
        return '결제에 문제가 있습니다. 결제 수단을 확인해주세요.'
    }
  }

  return (
    <div className={`${styles.bg} border-b ${styles.text} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
          <span className="font-medium">{getMessage()}</span>
          <div className="flex items-center gap-1 text-sm opacity-75">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(paymentFailure.gracePeriodEndsAt).toLocaleDateString('ko-KR')}까지
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/usage')}
            className={`flex items-center gap-2 px-4 py-1.5 ${styles.button} text-white text-sm font-medium rounded-lg transition-colors`}
          >
            <CreditCard className="w-4 h-4" />
            결제 수단 확인
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-black/10 rounded transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentWarningBanner
