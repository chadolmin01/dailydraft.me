/**
 * P0 채널 추가: #운영-대시보드, #자기소개
 * 멱등: 이미 존재하면 스킵
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const tokenMatch = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)
const TOKEN = tokenMatch?.[1]?.trim()

const GUILD = '1492207944530399495'
const API = 'https://discord.com/api/v10'
const BOT_ROLE_ID = '1492208038528942200'

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`ERROR ${method} ${path}:`, JSON.stringify(data))
    return null
  }
  return data
}

async function run() {
  const channels = await api('GET', `/guilds/${GUILD}/channels`)
  if (!channels) { console.error('채널 목록 조회 실패'); return }

  const byName = {}
  channels.forEach(c => { byName[c.name] = c })

  const catOps = channels.find(c => c.name === '📋 운영' && c.type === 4)
  const catFree = channels.find(c => c.name === '🗣️ 자유' && c.type === 4)
  const everyoneId = GUILD

  // ── 1. #운영-대시보드 (봇 전용, 읽기전용) ──
  if (!byName['운영-대시보드']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '운영-대시보드',
      type: 0,
      parent_id: catOps?.id,
      topic: '매주 AI가 자동 게시하는 전체 팀 현황 요약. 봇 전용 채널입니다.',
      permission_overwrites: [
        { id: everyoneId, type: 0, deny: '2048' }, // 일반 쓰기 불가
        { id: BOT_ROLE_ID, type: 0, allow: '2048' }, // 봇만 쓰기
      ],
    })
    if (ch) console.log('✅ #운영-대시보드 생성:', ch.id)
  } else {
    console.log('⏭️ #운영-대시보드 이미 존재')
  }

  // ── 2. #자기소개 ──
  if (!byName['자기소개']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '자기소개',
      type: 0,
      parent_id: catFree?.id,
      position: 0,
      topic: '새로 오신 분은 여기에 자기소개를 남겨주세요! 이름, 학년, 관심 분야, 한 줄 각오.',
    })
    if (ch) {
      console.log('✅ #자기소개 생성:', ch.id)
      // 템플릿 메시지 작성
      await api('POST', `/channels/${ch.id}/messages`, {
        content: `**자기소개 템플릿** 📝

아래 양식을 복사해서 자기소개를 올려주세요!

\`\`\`
이름:
학년/학과:
역할: 개발 / 디자인 / 기획·비즈
관심 분야:
한 줄 각오:
\`\`\`

> 편하게 적어주세요. 양식 안 지켜도 괜찮습니다.`,
      })
    }
  } else {
    console.log('⏭️ #자기소개 이미 존재')
  }

  console.log('\n🎉 P0 채널 세팅 완료!')
}

run().catch(console.error)
