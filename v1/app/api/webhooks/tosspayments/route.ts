import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'
import {
  getPayment,
  verifyWebhookSignature,
} from '@/src/lib/payments/tosspayments-client'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * 토스페이먼츠 웹훅 처리
 * 결제 상태 변경 시 호출됨
 */
export const POST = withErrorCapture(async (request: NextRequest) => {
    const payload = await request.text()
    const signature = request.headers.get('Toss-Signature') || ''

    // Verify webhook signature (REQUIRED)
    const webhookSecret = process.env.TOSSPAYMENTS_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('TOSSPAYMENTS_WEBHOOK_SECRET is not configured')
      return ApiResponse.internalError()
    }

    const isValid = verifyWebhookSignature(payload, signature, webhookSecret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return ApiResponse.unauthorized('Invalid signature')
    }

    const event = JSON.parse(payload)
    const { eventType, data } = event

    console.log(`[Webhook] Received event: ${eventType}`)

    const supabase = createAdminClient()

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, status } = data

        // Get full payment details
        const payment = await getPayment(paymentKey)

        // Find and update payment history
        const { data: paymentRecord } = await supabase
          .from('payment_history')
          .select('*')
          .eq('payment_key', paymentKey)
          .single()

        if (!paymentRecord) {
          console.warn(`Payment record not found for key: ${paymentKey}`)
          return ApiResponse.ok({ received: true })
        }

        // Map Toss status to our status
        let newStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled'
        switch (status) {
          case 'DONE':
            newStatus = 'completed'
            break
          case 'CANCELED':
          case 'PARTIAL_CANCELED':
            newStatus = 'canceled'
            break
          case 'ABORTED':
          case 'EXPIRED':
            newStatus = 'failed'
            break
          default:
            newStatus = 'pending'
        }

        // Update payment history
        await supabase
          .from('payment_history')
          .update({
            status: newStatus,
            receipt_url: payment.receipt?.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id)

        // Handle subscription cancellation
        if (
          (status === 'CANCELED' || status === 'PARTIAL_CANCELED') &&
          paymentRecord.subscription_id
        ) {
          // Get the subscription
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', paymentRecord.subscription_id)
            .single()

          if (subscription) {
            // If this was a refund, cancel the subscription
            await supabase
              .from('subscriptions')
              .update({
                status: 'canceled',
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', paymentRecord.subscription_id)
          }
        }

        // Handle boost cancellation
        if (
          (status === 'CANCELED' || status === 'PARTIAL_CANCELED') &&
          paymentRecord.boost_id
        ) {
          await supabase
            .from('boosts')
            .update({
              status: 'canceled',
            })
            .eq('id', paymentRecord.boost_id)
        }

        break
      }

      case 'BILLING_STATUS_CHANGED': {
        // Handle billing key status changes (for subscription renewals)
        const { billingKey, status } = data

        if (status === 'EXPIRED' || status === 'CANCELED') {
          // Find subscription by billing key and update
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('billing_key', billingKey)
        }

        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    return ApiResponse.ok({ received: true })
})

// Disable body parsing for raw payload access
export const config = {
  api: {
    bodyParser: false,
  },
}
