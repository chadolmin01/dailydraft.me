import * as fs from 'fs'
import { renderInviteCodeEmail } from '../src/lib/email/templates/invite-code'

const html = renderInviteCodeEmail({
  recipientName: '이성민',
  inviteCode: 'TEST1234',
  expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'
})

fs.writeFileSync('test-email.html', html)
console.log('Saved to test-email.html, length:', html.length)
