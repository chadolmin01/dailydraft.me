import * as fs from 'fs'
import * as path from 'path'
import { Resend } from 'resend'
import { renderInviteCodeEmail } from '../src/lib/email/templates/invite-code'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'DailyDraft <onboarding@resend.dev>'

async function sendInvite() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    process.exit(1)
  }

  const resend = new Resend(RESEND_API_KEY)

  // 실제 초대 코드
  const inviteCode = 'DRAFT001'
  const expiresAt = '2026-03-19T19:20:51.435729+00:00'

  const html = renderInviteCodeEmail({
    recipientName: '이성민',
    inviteCode,
    expiresAt,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me',
  })

  console.log('Sending real invite email...')

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: 'chadolmin01@gmail.com',
    subject: `[DailyDraft] 프리미엄 초대 코드: ${inviteCode}`,
    html,
  })

  if (error) {
    console.error('Failed:', error)
    process.exit(1)
  }

  console.log('Sent! Email ID:', data?.id)
}

sendInvite()
