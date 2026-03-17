// Test script for sending invite code email
import * as fs from 'fs'
import * as path from 'path'
import { Resend } from 'resend'
import { renderInviteCodeEmail } from '../src/lib/email/templates/invite-code'

// Load .env.local manually
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

async function sendTestEmail() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set')
    process.exit(1)
  }

  const resend = new Resend(RESEND_API_KEY)

  const testCode = 'TEST1234'
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const html = renderInviteCodeEmail({
    recipientName: '이성민',
    inviteCode: testCode,
    expiresAt: expiresAt.toISOString(),
    appUrl: 'https://dailydraft.me',
  })

  // Debug: check HTML
  console.log('HTML length:', html?.length || 0)
  console.log('HTML preview:', html?.substring(0, 200) || 'EMPTY')

  if (!html || html.length === 0) {
    console.error('HTML is empty!')
    process.exit(1)
  }

  console.log('Sending test email to chadolmin01@gmail.com...')
  console.log('From:', FROM_EMAIL)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: 'chadolmin01@gmail.com',
    subject: `[DailyDraft] 프리미엄 초대 코드: ${testCode}`,
    html,
  })

  if (error) {
    console.error('Failed to send email:', error)
    process.exit(1)
  }

  console.log('Email sent successfully!')
  console.log('Email ID:', data?.id)
}

sendTestEmail()
