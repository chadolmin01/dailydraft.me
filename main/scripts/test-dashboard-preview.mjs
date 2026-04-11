/**
 * 운영-대시보드 메시지 로컬 미리보기
 * 실행: node scripts/test-dashboard-preview.mjs
 */

const STATUS_EMOJI = { good: '🟢', normal: '🟡', hard: '🔴' }
const STATUS_LABEL = { good: '순조', normal: '보통', hard: '어려움' }

const weekNumber = 15

// 샘플 데이터
const result = {
  totalTeams: 6,
  draftsCreated: 4,
  lowActivityTeams: ['헬스케어 MVP'],
  drafts: [
    { opportunityId: '1', projectTitle: '커머스 MVP', status: 'pending', teamStatus: 'good', teamStatusReason: '', sourceMessageCount: 15 },
    { opportunityId: '2', projectTitle: 'AI 챗봇', status: 'pending', teamStatus: 'normal', teamStatusReason: '블로커 존재', sourceMessageCount: 8 },
    { opportunityId: '3', projectTitle: '블록체인 지갑', status: 'pending', teamStatus: 'hard', teamStatusReason: '팀원 이탈', sourceMessageCount: 3 },
    { opportunityId: '4', projectTitle: '교육 플랫폼', status: 'approved', teamStatus: 'good', teamStatusReason: '', sourceMessageCount: 12 },
  ],
  activityByTeam: new Map([
    ['1', { totalMessages: 42, topMembers: [
      { discordUsername: '김철수', messageCount: 18, channelsActive: 3 },
      { discordUsername: '박영희', messageCount: 14, channelsActive: 2 },
      { discordUsername: '이민수', messageCount: 10, channelsActive: 2 },
    ]}],
    ['2', { totalMessages: 28, topMembers: [
      { discordUsername: '정하은', messageCount: 15, channelsActive: 2 },
      { discordUsername: '김철수', messageCount: 8, channelsActive: 1 },
      { discordUsername: '최유진', messageCount: 5, channelsActive: 1 },
    ]}],
    ['3', { totalMessages: 5, topMembers: [
      { discordUsername: '한지우', messageCount: 3, channelsActive: 1 },
      { discordUsername: '송태민', messageCount: 2, channelsActive: 1 },
    ]}],
    ['4', { totalMessages: 35, topMembers: [
      { discordUsername: '오서연', messageCount: 20, channelsActive: 3 },
      { discordUsername: '박영희', messageCount: 15, channelsActive: 2 },
    ]}],
  ]),
  consecutiveMissing: [
    { projectTitle: '헬스케어 MVP', weeks: 3 },
    { projectTitle: '푸드테크', weeks: 2 },
  ],
  clubSlug: 'flip',
}

// ── 메시지 생성 (dashboard-summary.ts 로직 동일) ──

const { totalTeams, draftsCreated, lowActivityTeams, drafts } = result

const submissionRate = totalTeams > 0 ? Math.round((draftsCreated / totalTeams) * 100) : 0
const barFilled = Math.round(submissionRate / 10)
const progressBar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled)

const teamLines = drafts.map((d) => {
  const emoji = STATUS_EMOJI[d.teamStatus] || '⚪'
  const label = STATUS_LABEL[d.teamStatus] || d.teamStatus
  const statusTag = d.status === 'approved' ? '✅' : d.status === 'pending' ? '⏳' : '❌'

  let activityInfo = `${d.sourceMessageCount}건`
  if (result.activityByTeam) {
    const teamActivity = result.activityByTeam.get(d.opportunityId)
    if (teamActivity) {
      activityInfo = `💬${teamActivity.totalMessages} | ${d.sourceMessageCount}건`
    }
  }

  return `${emoji} **${d.projectTitle}** — ${label} | ${statusTag} ${activityInfo}`
})

const lowActivityLines = lowActivityTeams.map((name) => `🔕 **${name}** — 활동 부족`)

const statusCounts = { good: 0, normal: 0, hard: 0 }
for (const d of drafts) {
  if (d.teamStatus in statusCounts) statusCounts[d.teamStatus]++
}

const statusBar = [
  statusCounts.good > 0 ? `🟢${statusCounts.good}` : null,
  statusCounts.normal > 0 ? `🟡${statusCounts.normal}` : null,
  statusCounts.hard > 0 ? `🔴${statusCounts.hard}` : null,
].filter(Boolean).join(' ')

// 활동 TOP 멤버
let topMembersSection = ''
if (result.activityByTeam && result.activityByTeam.size > 0) {
  const allMembers = new Map()
  for (const [, teamData] of result.activityByTeam) {
    for (const member of teamData.topMembers) {
      const current = allMembers.get(member.discordUsername) || 0
      allMembers.set(member.discordUsername, current + member.messageCount)
    }
  }
  const sorted = [...allMembers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (sorted.length > 0) {
    const memberLines = sorted.map(([name, count], i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '
      return `${medal} ${name} — ${count}건`
    })
    topMembersSection = ['', '**💬 이번 주 활동 TOP**', ...memberLines].join('\n')
  }
}

// 연속 미제출 경고
let escalationSection = ''
if (result.consecutiveMissing && result.consecutiveMissing.length > 0) {
  const warnings = result.consecutiveMissing.map((t) => {
    const emoji = t.weeks >= 3 ? '🚨' : '⚠️'
    return `${emoji} **${t.projectTitle}** — ${t.weeks}주 연속 미제출`
  })
  escalationSection = ['', '**🚨 연속 미제출 경고**', ...warnings].join('\n')
}

const baseUrl = 'https://draft.is'
const reportLink = `${baseUrl}/api/clubs/${result.clubSlug}/reports/export?format=csv&week=${weekNumber}`

const message = [
  `**📊 ${weekNumber}주차 주간 현황**`,
  '',
  `\`${progressBar}\` **${submissionRate}%** (${draftsCreated}/${totalTeams}팀 제출)`,
  statusBar ? `팀 상태: ${statusBar}` : '',
  '',
  '━━━━━━━━━━━━━━━━━━━━',
  '',
  ...teamLines,
  ...lowActivityLines,
  topMembersSection,
  escalationSection,
  '',
  '━━━━━━━━━━━━━━━━━━━━',
  '',
  '⏳ 승인 대기 | ✅ 승인 완료 | ❌ 거부/만료',
  `📥 [CSV 다운로드](${reportLink})`,
  `📋 [상세 보기](${baseUrl}/dashboard)`,
].filter(line => line !== undefined).join('\n')

console.log('\n╔══════════════════════════════════════════╗')
console.log('║   #운영-대시보드 메시지 미리보기          ║')
console.log('╚══════════════════════════════════════════╝\n')
console.log(message)
console.log('\n─────────────────────────────────────────')
console.log(`총 글자수: ${message.length}자`)
console.log('─────────────────────────────────────────\n')
