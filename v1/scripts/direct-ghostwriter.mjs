/**
 * ghostwriter 함수를 직접 호출 — 크론 우회 테스트
 * 에러가 어디서 나는지 정확히 잡기 위함
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

// 환경변수 주입 (Next.js 없이 실행하기 위해)
process.env.GEMINI_API_KEY = getEnv('GEMINI_API_KEY')
process.env.VERTEX_AI_EXPRESS = 'true'

const TOKEN = getEnv('DISCORD_BOT_TOKEN')
const admin = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
)

// Discord 메시지 가져오기
console.log('📥 Discord 메시지 수집...')
const res = await fetch('https://discord.com/api/v10/channels/1492363167135957082/messages?limit=100', {
  headers: { Authorization: `Bot ${TOKEN}` }
})
const rawMsgs = await res.json()
console.log(`  전체: ${rawMsgs.length}개`)

// DiscordMessage 형태로 변환
const messages = rawMsgs.map(m => ({
  id: m.id,
  content: m.content || '',
  author: {
    id: m.author.id,
    username: m.author.username,
    global_name: m.author.global_name,
    bot: m.author.bot || false,
  },
  timestamp: m.timestamp,
  attachments: (m.attachments || []).map(a => ({
    url: a.url,
    filename: a.filename,
    content_type: a.content_type,
    size: a.size,
  })),
  embeds: m.embeds || [],
}))

// ghostwriter 함수 직접 호출
console.log('\n🤖 generateWeeklyDraft 호출...')
try {
  const { generateWeeklyDraft } = await import('../src/lib/discord/ghostwriter.ts')

  const result = await generateWeeklyDraft(messages, 'FoodFinder', {
    channelName: '🍔-foodfinder-팀채널',
  })

  if (result) {
    console.log('\n✅ 초안 생성 성공!')
    console.log(`  제목: ${result.title}`)
    console.log(`  유형: ${result.updateType}`)
    console.log(`  메시지 수: ${result.sourceMessageCount}`)

    const parsed = JSON.parse(result.content)
    console.log(`\n  요약: ${parsed.summary}`)
    console.log(`  작업: ${parsed.tasks?.length || 0}개`)
    console.log(`  팀 상태: ${parsed.teamStatus}`)

    // DB에 저장
    const { data: opp } = await admin.from('opportunities').select('id, creator_id').limit(1).single()
    const now = new Date()
    const weekNumber = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7)

    const { data: saved, error: saveErr } = await admin.from('weekly_update_drafts').insert({
      opportunity_id: opp.id,
      target_user_id: opp.creator_id,
      week_number: weekNumber,
      title: result.title,
      content: result.content,
      update_type: result.updateType,
      source_message_count: result.sourceMessageCount,
      status: 'pending',
    }).select('id').single()

    if (saveErr) {
      console.log(`\n⚠️  DB 저장 실패: ${saveErr.message}`)
    } else {
      console.log(`\n📦 DB 저장 완료: ${saved.id}`)
      console.log(`   http://localhost:3000/drafts/${saved.id}`)
    }

    // DM 발송
    const { data: profile } = await admin.from('profiles').select('discord_user_id').eq('user_id', opp.creator_id).single()
    if (profile?.discord_user_id) {
      console.log(`\n📱 DM 발송 중... (discord_user_id: ${profile.discord_user_id})`)
      const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: profile.discord_user_id }),
      })
      const dmChannel = await dmChannelRes.json()

      if (dmChannel.id) {
        const baseUrl = 'http://localhost:3000'
        const dmRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: `📝 ${weekNumber}주차 업데이트 초안`,
              description: `**FoodFinder**의 주간 업데이트 초안이 준비됐습니다.\n\n> **${result.title}**\n> ${parsed.summary.slice(0, 150)}`,
              color: 0x22c55e,
              fields: [
                { name: '유형', value: result.updateType, inline: true },
                { name: '주차', value: `${weekNumber}주차`, inline: true },
              ],
              footer: { text: 'Draft • 30초만 확인해주세요' },
            }],
            components: [{
              type: 1,
              components: [{
                type: 2,
                style: 5,
                label: '✅ 확인하고 승인하기',
                url: `${baseUrl}/drafts/${saved.id}`,
              }],
            }],
          }),
        })

        if (dmRes.ok) {
          console.log('✅ DM 발송 완료! Discord에서 확인하세요.')
        } else {
          const err = await dmRes.text()
          console.log(`❌ DM 발송 실패: ${err}`)
        }
      }
    }
  } else {
    console.log('\n❌ generateWeeklyDraft returned null (메시지 부족)')
  }
} catch (err) {
  console.error('\n❌ 에러 발생:', err)
}
