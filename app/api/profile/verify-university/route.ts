import { createClient } from '@/src/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import crypto from 'crypto'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// 유효한 대학 이메일 도메인
const UNIVERSITY_DOMAINS = [
  'ac.kr', 'edu', 'edu.kr',
  'kaist.ac.kr', 'postech.ac.kr', 'unist.ac.kr', 'gist.ac.kr', 'dgist.ac.kr',
  'snu.ac.kr', 'yonsei.ac.kr', 'korea.ac.kr', 'skku.edu', 'hanyang.ac.kr',
  'cau.ac.kr', 'khu.ac.kr', 'hufs.ac.kr', 'uos.ac.kr', 'konkuk.ac.kr',
  'dongguk.edu', 'hongik.ac.kr', 'sookmyung.ac.kr', 'ewha.ac.kr', 'kookmin.ac.kr',
  'ssu.ac.kr', 'sejong.ac.kr', 'kw.ac.kr', 'mju.ac.kr', 'smu.ac.kr',
  'seoultech.ac.kr', 'hansung.ac.kr', 'syu.ac.kr', 'duksung.ac.kr',
  'ajou.ac.kr', 'inha.ac.kr', 'gachon.ac.kr', 'dankook.ac.kr', 'kau.ac.kr',
  'kyonggi.ac.kr', 'hs.ac.kr', 'suwon.ac.kr', 'yongin.ac.kr',
  'cnu.ac.kr', 'chungbuk.ac.kr', 'hnu.kr', 'pcu.ac.kr',
  'pusan.ac.kr', 'knu.ac.kr', 'donga.ac.kr', 'pknu.ac.kr', 'gnu.ac.kr',
  'ulsan.ac.kr', 'yu.ac.kr', 'kmu.ac.kr',
  'jnu.ac.kr', 'jbnu.ac.kr', 'chosun.ac.kr',
  'kangwon.ac.kr', 'jejunu.ac.kr', 'hallym.ac.kr',
  'karts.ac.kr', 'knsu.ac.kr',
]

function isUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return UNIVERSITY_DOMAINS.some(ud => domain === ud || domain.endsWith('.' + ud))
}

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

// POST: 인증 코드 발송 / 검증
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const admin = getAdminClient()
    const body = await request.json()
    const { action, email, code } = body as { action: string; email?: string; code?: string }

    // === 인증 코드 발송 ===
    if (action === 'send') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 })
      }

      const trimmedEmail = email.trim().toLowerCase()

      if (!isUniversityEmail(trimmedEmail)) {
        return NextResponse.json({ error: '대학 이메일(.ac.kr, .edu)만 인증 가능합니다' }, { status: 400 })
      }

      // 이미 인증된 유저인지 확인
      const { data: userData } = await supabase
        .from('users')
        .select('is_uni_verified')
        .eq('id', user.id)
        .single()

      if ((userData as { is_uni_verified: boolean | null } | null)?.is_uni_verified) {
        return NextResponse.json({ error: '이미 인증된 계정입니다' }, { status: 400 })
      }

      // DB에서 기존 인증 코드 조회 (rate limit + 재발송 간격 체크)
      const now = new Date()
      const { data: existing } = await admin
        .from('verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // 잠금 상태 확인
        if (existing.locked_until && new Date(existing.locked_until) > now) {
          return NextResponse.json({ error: '인증 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요' }, { status: 429 })
        }

        // 시간당 발송 횟수 제한 (5회)
        const sendResetAt = new Date(existing.send_reset_at)
        if (now < sendResetAt && existing.send_count >= 5) {
          return NextResponse.json({ error: '요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요' }, { status: 429 })
        }

        // 1분 재발송 간격
        const updatedAt = new Date(existing.updated_at)
        if (now.getTime() - updatedAt.getTime() < 60 * 1000) {
          return NextResponse.json({ error: '1분 후에 다시 시도해주세요' }, { status: 429 })
        }
      }

      const verificationCode = generateCode()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10분
      const sendResetAt = (existing && new Date(existing.send_reset_at) > now)
        ? existing.send_reset_at
        : new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1시간

      const newSendCount = (existing && new Date(existing.send_reset_at) > now)
        ? existing.send_count + 1
        : 1

      // DB에 upsert
      const { error: upsertError } = await admin
        .from('verification_codes')
        .upsert({
          user_id: user.id,
          code: verificationCode,
          email: trimmedEmail,
          attempts: 0,
          send_count: newSendCount,
          expires_at: expiresAt.toISOString(),
          send_reset_at: sendResetAt,
          locked_until: null,
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' })

      if (upsertError) {
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
      }

      // 이메일 발송
      if (!isEmailEnabled() || !resend) {
        console.log(`[DEV] Verification code for ${trimmedEmail}: ${verificationCode}`)
        return NextResponse.json({ success: true, dev: true })
      }

      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: trimmedEmail,
        subject: '[DailyDraft] 대학 인증 코드',
        html: `
          <div style="font-family: monospace; max-width: 400px; margin: 0 auto; padding: 32px; border: 2px solid #000;">
            <h2 style="margin: 0 0 16px; font-size: 18px;">대학 인증 코드</h2>
            <p style="margin: 0 0 24px; color: #666; font-size: 14px;">아래 인증 코드를 입력해주세요.</p>
            <div style="background: #000; color: #fff; padding: 16px; text-align: center; font-size: 28px; letter-spacing: 8px; font-weight: bold;">
              ${verificationCode}
            </div>
            <p style="margin: 16px 0 0; color: #999; font-size: 12px;">10분 이내에 입력해주세요.</p>
          </div>
        `,
      })

      if (sendError) {
        // 발송 실패 시 DB 코드 삭제
        await admin.from('verification_codes').delete().eq('user_id', user.id)
        return NextResponse.json({ error: '이메일 발송에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // === 인증 코드 확인 ===
    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: '인증 코드를 입력해주세요' }, { status: 400 })
      }

      const now = new Date()

      // DB에서 저장된 코드 조회
      const { data: stored } = await admin
        .from('verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!stored) {
        return NextResponse.json({ error: '인증 코드를 먼저 요청해주세요' }, { status: 400 })
      }

      // 잠금 상태 확인
      if (stored.locked_until && new Date(stored.locked_until) > now) {
        return NextResponse.json({ error: '인증 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요' }, { status: 429 })
      }

      // 만료 확인
      if (new Date(stored.expires_at) < now) {
        await admin.from('verification_codes').delete().eq('user_id', user.id)
        return NextResponse.json({ error: '인증 코드가 만료되었습니다. 다시 요청해주세요' }, { status: 400 })
      }

      // 코드 비교 (타이밍 공격 방지)
      const codeMatch = crypto.timingSafeEqual(
        Buffer.from(stored.code),
        Buffer.from(code.trim().padEnd(stored.code.length))
      ) && stored.code.length === code.trim().length

      if (!codeMatch) {
        const newAttempts = (stored.attempts || 0) + 1

        if (newAttempts >= 5) {
          // 5회 실패 → 15분 잠금 + 코드 무효화
          await admin
            .from('verification_codes')
            .update({
              attempts: newAttempts,
              locked_until: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
              code: '', // 코드 무효화
              updated_at: now.toISOString(),
            })
            .eq('user_id', user.id)
          return NextResponse.json({ error: '인증 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요' }, { status: 429 })
        }

        await admin
          .from('verification_codes')
          .update({ attempts: newAttempts, updated_at: now.toISOString() })
          .eq('user_id', user.id)
        return NextResponse.json({ error: `인증 코드가 일치하지 않습니다 (${newAttempts}/5)` }, { status: 400 })
      }

      // 인증 성공 → DB 업데이트 + 코드 삭제
      const [usersResult, profilesResult] = await Promise.all([
        supabase.from('users').update({ is_uni_verified: true } as never).eq('id', user.id),
        supabase.from('profiles').update({ is_uni_verified: true } as never).eq('user_id', user.id),
      ])

      if (usersResult.error && profilesResult.error) {
        return NextResponse.json({ error: '인증 상태 저장에 실패했습니다' }, { status: 500 })
      }

      // 인증 완료 → 코드 레코드 삭제
      await admin.from('verification_codes').delete().eq('user_id', user.id)

      return NextResponse.json({ success: true, verified: true })
    }

    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// GET: 인증 상태 확인
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_uni_verified, university')
      .eq('id', user.id)
      .single()

    const d = userData as { is_uni_verified: boolean | null; university: string | null } | null

    return NextResponse.json({
      is_verified: d?.is_uni_verified || false,
      university: d?.university || null,
    })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
