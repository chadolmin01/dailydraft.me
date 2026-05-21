import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let initialized = false
let initFailed = false

function ensureInitialized(): boolean {
  if (initialized) return true
  if (initFailed) return false
  // VAPID_SUBJECT 폴백 — env 누락 시 dailydraft.me로 (web-push는 mailto:/https: 만 허용)
  // 폴백 안 두면 setVapidDetails(undefined, ...)가 동기 throw → 호출자 흐름 전체 붕괴
  const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@dailydraft.me'
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    // 키가 없으면 푸시 영구 비활성화 (in-app/email 흐름은 보호)
    initFailed = true
    console.warn('[push] VAPID 키 미설정 — Web Push 비활성화')
    return false
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    initialized = true
    return true
  } catch (err) {
    initFailed = true
    console.warn('[push] setVapidDetails 실패 — Web Push 비활성화:', err)
    return false
  }
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  // 푸시 초기화 실패해도 호출자(이메일/in-app 알림 흐름)는 절대 깨지면 안 됨
  if (!ensureInitialized()) return
  const supabaseAdmin = getSupabaseAdmin()
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const message = JSON.stringify(payload)
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      ).catch(async (err) => {
        // 만료된 구독 자동 삭제
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}
