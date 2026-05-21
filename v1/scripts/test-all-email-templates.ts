// 7개 이메일 템플릿 전부 실제 발송 — 디자인 통일 확인용
import * as fs from 'fs'
import * as path from 'path'
import { Resend } from 'resend'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      let v = valueParts.join('=').trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env[key.trim()] = v
    }
  })
}

import { APP_URL } from '../src/constants/app'
import { renderInviteCodeEmail } from '../src/lib/email/templates/invite-code'
import { renderCoffeeChatRequestEmail } from '../src/lib/email/templates/coffee-chat-request'
import { renderCoffeeChatReminderEmail } from '../src/lib/email/templates/coffee-chat-reminder'
import { renderCoffeeChatResponseEmail } from '../src/lib/email/templates/coffee-chat-response'
import { renderInstitutionAnnounceEmail } from '../src/lib/email/templates/institution-announce'
import { renderDeadlineNotificationEmail } from '../src/lib/email/templates/deadline-notification'
import { renderWeeklyDigestEmail } from '../src/lib/email/templates/weekly-digest'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'DailyDraft <onboarding@resend.dev>'
// APP_URL은 ../src/constants/app 에서 import
const TO = 'chadolmin01@gmail.com'

async function main() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set')
    process.exit(1)
  }
  const resend = new Resend(RESEND_API_KEY)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const jobs: Array<{ subject: string; html: string }> = [
    {
      subject: '[Draft 프리뷰 1/7] 초대 코드',
      html: renderInviteCodeEmail({
        recipientName: '이성민',
        inviteCode: 'TEST1234',
        expiresAt: expiresAt.toISOString(),
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 2/7] 커피챗 요청',
      html: renderCoffeeChatRequestEmail({
        ownerName: '이성민',
        requesterName: '김채원',
        requesterMessage: '안녕하세요! 프로젝트 내용이 흥미로워서 꼭 한번 이야기 나누고 싶습니다. 저는 백엔드 개발을 3년 정도 해왔습니다.',
        projectTitle: 'Draft — 대학생 프로젝트 매칭',
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 3/7] 커피챗 리마인더',
      html: renderCoffeeChatReminderEmail({
        ownerName: '이성민',
        requesterName: '김채원',
        projectTitle: 'Draft — 대학생 프로젝트 매칭',
        requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 4/7] 커피챗 수락',
      html: renderCoffeeChatResponseEmail({
        requesterName: '김채원',
        ownerName: '이성민',
        projectTitle: 'Draft — 대학생 프로젝트 매칭',
        accepted: true,
        contactInfo: 'lee.seongmin@example.com',
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 5/7] 기관 공지',
      html: renderInstitutionAnnounceEmail({
        recipientName: '이성민',
        institutionName: '서울대학교 창업지원단',
        subject: '2026 봄학기 창업 아이디어 공모전 안내',
        body: '안녕하세요. 2026년 봄학기 창업 아이디어 공모전이 시작됩니다.\n\n참가 자격: 재학생 누구나\n제출 마감: 2026년 4월 30일\n\n많은 관심 부탁드립니다.',
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 6/7] 마감 임박 알림',
      html: renderDeadlineNotificationEmail({
        userName: '이성민',
        events: [
          { id: '1', title: '예비창업패키지 2026', organizer: '창업진흥원', daysLeft: 1, registrationUrl: 'https://example.com/1' },
          { id: '2', title: '청년창업사관학교 15기', organizer: '중소벤처기업부', daysLeft: 3, registrationUrl: 'https://example.com/2' },
          { id: '3', title: 'K-Startup 그랜드 챌린지', organizer: 'KISED', daysLeft: 7, registrationUrl: 'https://example.com/3' },
        ],
        appUrl: APP_URL,
      }),
    },
    {
      subject: '[Draft 프리뷰 7/7] 주간 다이제스트',
      html: renderWeeklyDigestEmail({
        userName: '이성민',
        summary: '이번 주에는 창업 지원 프로그램 12건, 해커톤 4건이 새로 올라왔습니다. 관심 태그와 가장 잘 맞는 3건을 골라봤습니다.',
        recommendedEvents: [
          { id: 'a', title: '2026 소셜벤처 경연대회', organizer: '한국사회적기업진흥원', event_type: '공모전', registration_end_date: new Date(Date.now() + 5 * 86400000).toISOString(), registration_url: 'https://example.com/a', interest_tags: ['소셜벤처', '창업', 'ESG'] },
          { id: 'b', title: 'AI 스타트업 해커톤', organizer: 'Draft', event_type: '해커톤', registration_end_date: new Date(Date.now() + 10 * 86400000).toISOString(), registration_url: 'https://example.com/b', interest_tags: ['AI', '해커톤'] },
        ],
        popularEvents: [
          { id: 'c', title: '예비창업패키지 2026', organizer: '창업진흥원', event_type: '지원사업', registration_end_date: new Date(Date.now() + 2 * 86400000).toISOString(), registration_url: 'https://example.com/c', interest_tags: ['창업', '정부지원'] },
        ],
      }),
    },
  ]

  for (const [i, job] of jobs.entries()) {
    process.stdout.write(`[${i + 1}/${jobs.length}] ${job.subject} ... `)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO,
      subject: job.subject,
      html: job.html,
    })
    if (error) {
      console.log('FAIL')
      console.error(error)
      process.exit(1)
    }
    console.log(`OK (${data?.id})`)
    // Resend rate limit: 2 req/s
    await new Promise(r => setTimeout(r, 600))
  }
  console.log('\n모두 발송 완료. chadolmin01@gmail.com 받은편지함 확인해주세요.')
}

main()
