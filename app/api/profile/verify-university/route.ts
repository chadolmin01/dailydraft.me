import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'

// 인증 코드 저장소 (메모리, 프로덕션에서는 Redis 권장)
const verificationCodes = new Map<string, { code: string; email: string; expiresAt: number }>()

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
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST: 인증 코드 발송
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

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

      // Rate limit: 1분에 1번
      const existing = verificationCodes.get(user.id)
      if (existing && Date.now() - (existing.expiresAt - 10 * 60 * 1000) < 60 * 1000) {
        return NextResponse.json({ error: '1분 후에 다시 시도해주세요' }, { status: 429 })
      }

      const verificationCode = generateCode()
      verificationCodes.set(user.id, {
        code: verificationCode,
        email: trimmedEmail,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10분
      })

      // 이메일 발송
      if (!isEmailEnabled() || !resend) {
        // 이메일 서비스 미설정 시 개발용 로그
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
        verificationCodes.delete(user.id)
        return NextResponse.json({ error: '이메일 발송에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // === 인증 코드 확인 ===
    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: '인증 코드를 입력해주세요' }, { status: 400 })
      }

      const stored = verificationCodes.get(user.id)
      if (!stored) {
        return NextResponse.json({ error: '인증 코드를 먼저 요청해주세요' }, { status: 400 })
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(user.id)
        return NextResponse.json({ error: '인증 코드가 만료되었습니다. 다시 요청해주세요' }, { status: 400 })
      }

      if (stored.code !== code.trim()) {
        return NextResponse.json({ error: '인증 코드가 일치하지 않습니다' }, { status: 400 })
      }

      // 인증 성공 → DB 업데이트 (users + profiles 양쪽)
      const [usersResult, profilesResult] = await Promise.all([
        supabase.from('users').update({ is_uni_verified: true } as never).eq('id', user.id),
        supabase.from('profiles').update({ is_uni_verified: true } as never).eq('user_id', user.id),
      ])

      if (usersResult.error && profilesResult.error) {
        return NextResponse.json({ error: '인증 상태 저장에 실패했습니다' }, { status: 500 })
      }

      verificationCodes.delete(user.id)
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
