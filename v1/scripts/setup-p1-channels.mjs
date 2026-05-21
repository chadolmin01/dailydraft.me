/**
 * P1 채널 추가: #기획-리뷰 포럼 + #디자인-리뷰 태그 확장
 * 멱등: 이미 존재하면 스킵
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const tokenMatch = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)
const TOKEN = tokenMatch?.[1]?.trim()

const GUILD = '1492207944530399495'
const API = 'https://discord.com/api/v10'

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

  const catProject = channels.find(c => c.name === '💡 프로젝트' && c.type === 4)

  // ── 1. #기획-리뷰 (포럼 채널) ──
  if (!byName['기획-리뷰']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '기획-리뷰',
      type: 15, // Forum
      parent_id: catProject?.id,
      topic: '기획/비즈니스 산출물 공유 & 피드백. 시장조사, 사업계획서, 인터뷰 정리 등을 올려주세요.',
      default_auto_archive_duration: 10080, // 7일
      available_tags: [
        { name: '📊 시장조사', moderated: false },
        { name: '📝 사업계획서', moderated: false },
        { name: '🎤 인터뷰', moderated: false },
        { name: '💡 아이디어', moderated: false },
        { name: '👀 리뷰 요청', moderated: false },
        { name: '✅ 확정', moderated: false },
      ],
    })
    if (ch) console.log('✅ #기획-리뷰 (포럼) 생성:', ch.id)
  } else {
    console.log('⏭️ #기획-리뷰 이미 존재')
  }

  // ── 2. #디자인-리뷰 태그 확장 ──
  const designReview = byName['디자인-리뷰']
  if (designReview) {
    // 기존 태그 확인
    const existingTags = designReview.available_tags || []
    const existingNames = existingTags.map(t => t.name)

    const newTags = [
      { name: '📐 와이어프레임', moderated: false },
      { name: '🔀 핸드오프', moderated: false },
    ].filter(t => !existingNames.includes(t.name))

    if (newTags.length > 0) {
      const updatedTags = [...existingTags, ...newTags]
      await api('PATCH', `/channels/${designReview.id}`, {
        available_tags: updatedTags,
      })
      console.log(`✅ #디자인-리뷰 태그 추가: ${newTags.map(t => t.name).join(', ')}`)
    } else {
      console.log('⏭️ #디자인-리뷰 태그 이미 최신')
    }
  } else {
    console.log('⚠️ #디자인-리뷰 채널을 찾을 수 없습니다')
  }

  console.log('\n🎉 P1 채널 세팅 완료!')
}

run().catch(console.error)
