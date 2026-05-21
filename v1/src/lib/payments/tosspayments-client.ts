/**
 * 토스페이먼츠 API 클라이언트
 * 문서: https://developers.tosspayments.com/
 */

import crypto from 'crypto'

const TOSSPAYMENTS_API_URL = 'https://api.tosspayments.com/v1'

// 환경변수에서 키 가져오기
function getSecretKey(): string {
  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY
  if (!secretKey) {
    throw new Error('TOSSPAYMENTS_SECRET_KEY 환경변수가 설정되지 않았습니다')
  }
  return secretKey
}

function getClientKey(): string {
  const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY
  if (!clientKey) {
    throw new Error('NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY 환경변수가 설정되지 않았습니다')
  }
  return clientKey
}

// Basic Auth 헤더 생성
function getAuthHeader(): string {
  const secretKey = getSecretKey()
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

// ================================================
// 타입 정의
// ================================================

export interface TossPaymentRequest {
  amount: number
  orderId: string
  orderName: string
  successUrl: string
  failUrl: string
  customerEmail?: string
  customerName?: string
  customerMobilePhone?: string
}

export interface TossPaymentConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface TossPayment {
  paymentKey: string
  orderId: string
  orderName: string
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED'
  requestedAt: string
  approvedAt?: string
  useEscrow: boolean
  cultureExpense: boolean
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  virtualAccount?: {
    accountNumber: string
    accountType: string
    bank: string
    customerName: string
    dueDate: string
    expired: boolean
    settlementStatus: string
    refundStatus: string
  }
  transfer?: {
    bank: string
    settlementStatus: string
  }
  mobilePhone?: {
    carrier: string
    customerMobilePhone: string
    settlementStatus: string
  }
  giftCertificate?: {
    approveNo: string
    settlementStatus: string
  }
  cashReceipt?: {
    type: string
    amount: number
    taxFreeAmount: number
    issueNumber: string
    receiptUrl: string
  }
  discount?: {
    amount: number
  }
  cancels?: Array<{
    cancelAmount: number
    cancelReason: string
    taxFreeAmount: number
    taxAmount?: number
    refundableAmount: number
    canceledAt: string
    transactionKey: string
  }>
  secret?: string
  type: 'NORMAL' | 'BILLING' | 'CONNECTPAY'
  easyPay?: {
    provider: string
    amount: number
    discountAmount: number
  }
  country: string
  failure?: {
    code: string
    message: string
  }
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  taxFreeAmount: number
  method: '카드' | '가상계좌' | '계좌이체' | '휴대폰' | '문화상품권' | '도서문화상품권' | '게임문화상품권' | '간편결제'
  version: string
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  currency: string
  metadata?: Record<string, unknown>
}

export interface TossBillingKeyRequest {
  authKey: string
  customerKey: string
}

export interface TossBilling {
  billingKey: string
  customerKey: string
  method: string
  cardCompany: string
  cardNumber: string
  card: {
    issuerCode: string
    acquirerCode: string
    number: string
    cardType: string
    ownerType: string
  }
}

export interface TossBillingPaymentRequest {
  billingKey: string
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
}

export interface TossPaymentCancelRequest {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
  refundReceiveAccount?: {
    bank: string
    accountNumber: string
    holderName: string
  }
}

export interface TossError {
  code: string
  message: string
}

// ================================================
// API 호출 함수
// ================================================

/**
 * 결제 승인
 * 클라이언트에서 결제 완료 후 서버에서 승인 처리
 */
export async function confirmPayment(
  request: TossPaymentConfirmRequest
): Promise<TossPayment> {
  const response = await fetch(`${TOSSPAYMENTS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossPayment
}

/**
 * 결제 조회
 */
export async function getPayment(paymentKey: string): Promise<TossPayment> {
  const response = await fetch(
    `${TOSSPAYMENTS_API_URL}/payments/${encodeURIComponent(paymentKey)}`,
    {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossPayment
}

/**
 * 주문 ID로 결제 조회
 */
export async function getPaymentByOrderId(orderId: string): Promise<TossPayment> {
  const response = await fetch(
    `${TOSSPAYMENTS_API_URL}/payments/orders/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossPayment
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  request: TossPaymentCancelRequest
): Promise<TossPayment> {
  const { paymentKey, ...cancelBody } = request

  const response = await fetch(
    `${TOSSPAYMENTS_API_URL}/payments/${encodeURIComponent(paymentKey)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cancelBody),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossPayment
}

/**
 * 빌링키 발급 (정기결제용)
 */
export async function issueBillingKey(
  request: TossBillingKeyRequest
): Promise<TossBilling> {
  const response = await fetch(`${TOSSPAYMENTS_API_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossBilling
}

/**
 * 빌링키로 결제 (정기결제)
 */
export async function payWithBillingKey(
  request: TossBillingPaymentRequest
): Promise<TossPayment> {
  const { billingKey, ...paymentBody } = request

  const response = await fetch(
    `${TOSSPAYMENTS_API_URL}/billing/${encodeURIComponent(billingKey)}`,
    {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(data.code, data.message)
  }

  return data as TossPayment
}

// ================================================
// 에러 클래스
// ================================================

export class TossPaymentsError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'TossPaymentsError'
    this.code = code
  }
}

// ================================================
// 유틸리티 함수
// ================================================

/**
 * 주문 ID 생성
 */
export function generateOrderId(prefix: string = 'TB'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`.toUpperCase()
}

/**
 * 결제 URL 생성 (클라이언트용)
 */
export function getPaymentWidgetUrl(): { clientKey: string; customerKey: string } {
  return {
    clientKey: getClientKey(),
    customerKey: `customer_${Date.now()}`,
  }
}

/**
 * 웹훅 시그니처 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
  return signature === expectedSignature
}
