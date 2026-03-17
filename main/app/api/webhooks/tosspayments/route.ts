// @ts-nocheck — hidden route (hiddenApiRoutes), Supabase types pending for payment tables
import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import {
  getPayment,
  verifyWebhookSignature,
} from '@/src/lib/payments/tosspayments-client'

/**
 * 토스페이먼츠 웹훅 처리
 * 결제 상태 변경 시 호출됨
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('Toss-Signature') || ''

    // Verify webhook signature (REQUIRED)
    const webhookSecret = process.env.TOSSPAYMENTS_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('TOSSPAYMENTS_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    const isValid = verifyWebhookSignature(payload, signature, webhookSecret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
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
          return NextResponse.json({ received: true })
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for raw payload access
export const config = {
  api: {
    bodyParser: false,
  },
}
