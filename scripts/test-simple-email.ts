import * as fs from 'fs'
import * as path from 'path'
import { Resend } from 'resend'

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

  // Very simple HTML
  const html = `
    <html>
      <body>
        <h1>테스트 이메일</h1>
        <p>이것은 테스트입니다.</p>
        <p>초대 코드: <strong>TEST1234</strong></p>
      </body>
    </html>
  `

  console.log('Sending simple test email...')
  console.log('HTML:', html)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: 'chadolmin01@gmail.com',
    subject: '[테스트] 간단한 이메일',
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
