/**
 * 운영-대시보드 테스트: 한 줄 알림 + 스레드 (상태 이유 포함)
 * 실행: node scripts/send-dashboard-test.mjs
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const TOKEN = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)?.[1]?.trim()
const CHANNEL_ID = envContent.match(/DISCORD_OPS_DASHBOARD_CHANNEL_ID=(.+)/)?.[1]?.trim()

const API = 'https://discord.com/api/v10'

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) { console.error(`ERROR:`, JSON.stringify(data)); return null }
  return data
}

async function run() {
  const week = 15

  // 1. 한 줄 알림
  const msg = await api('POST', `/channels/${CHANNEL_ID}/messages`, {
    content: `📊 **${week}주차 주간 보고가 도착했습니다** (67% 제출)`,
  })
  if (!msg) return
  console.log('✅ 알림 전송')

  // 2. 스레드
  const thread = await api('POST', `/channels/${CHANNEL_ID}/messages/${msg.id}/threads`, {
    name: `${week}주차 주간 보고`,
    auto_archive_duration: 10080,
  })
  if (!thread) return
  console.log('✅ 스레드 생성')

  // 3. 요약 + 팀 현황 (상태 이유 포함)
  await api('POST', `/channels/${thread.id}/messages`, {
    content: [
      `**${week}주차 주간 보고**`,
      '',
      '제출률 **67%** (4/6팀) | 🟢2 🟡1 🔴1 🔕1',
      '',
      '🟢 **커머스 MVP** ✅ — 💬42건',
      '> 결제 연동 완료, 다음 주 클로즈드 베타 예정',
      '🟢 **교육 플랫폼** ⏳ — 💬35건',
      '> 온보딩 플로우 확정, 콘텐츠 업로드 진행 중',
      '🟡 **AI 챗봇** ⏳ — 💬28건',
      '> 디자인 시안 확정 지연으로 프론트 개발 대기 중',
      '🔴 **블록체인 지갑** ⏳ — 💬5건',
      '> 팀원 1명 이탈, 외부 API 연동 블로커 2주째 미해결',
      '🔕 **헬스케어 MVP** — 활동 부족',
    ].join('\n'),
  })
  console.log('✅ 요약 전송')

  // 4. TOP + 경고 + 링크
  await api('POST', `/channels/${thread.id}/messages`, {
    content: [
      '**🏆 활동 TOP**',
      '🥇 박영희 — 29건',
      '🥈 김철수 — 26건',
      '🥉 오서연 — 20건',
      '',
      '**🚨 연속 미제출**',
      '🚨 **헬스케어 MVP** — 3주 연속',
      '⚠️ **푸드테크** — 2주 연속',
      '',
      '📥 [CSV](https://draft.is/api/clubs/flip/reports/export?format=csv&week=15) · [인쇄용](https://draft.is/api/clubs/flip/reports/export?format=pdf&week=15) · [대시보드](https://draft.is/dashboard)',
    ].join('\n'),
  })
  console.log('✅ 상세 전송')

  console.log('\n🎉 Discord에서 확인하세요!')
}

run().catch(console.error)
