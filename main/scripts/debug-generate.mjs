import { readFileSync } from 'fs'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const TOKEN = getEnv('DISCORD_BOT_TOKEN')
const GEMINI_KEY = getEnv('GEMINI_API_KEY')

// 1. Discord에서 메시지 가져오기
const res = await fetch('https://discord.com/api/v10/channels/1492363167135957082/messages?limit=100', {
  headers: { Authorization: `Bot ${TOKEN}` }
})
const allMsgs = await res.json()

console.log(`전체 메시지: ${allMsgs.length}`)

const human = allMsgs.filter(m =>
  m.author.bot !== true &&
  (m.content?.trim().length > 0 || m.attachments?.length > 0)
)
console.log(`사람 메시지 (봇 제외): ${human.length}`)

for (const m of human) {
  const att = m.attachments?.length ? ` [IMG: ${m.attachments.map(a=>a.filename).join(',')}]` : ''
  console.log(`  ${m.author.global_name || m.author.username}: ${(m.content||'(첨부)').slice(0,80)}${att}`)
}

// 2. 크론이 하는 것과 동일하게 fetchChannelMessages 시뮬레이션
// 크론은 after 파라미터 없이 호출 (last_fetched_message_id = null)
// Discord API는 after 없으면 최신 메시지부터 반환 (limit 기본 50)
console.log(`\ntotalSignals = ${human.length} + 0(checkin) + 0(pin) = ${human.length}`)
console.log(`minRequired = max(settings?.min_messages ?? 3, 1) = 3`)
console.log(`${human.length} < 3 = ${human.length < 3} → ${human.length < 3 ? 'SKIP (null)' : 'PROCEED'}`)

if (human.length >= 3) {
  console.log('\n🤖 직접 AI 호출 테스트...')
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY, vertexai: true })

  const formatted = human
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(m => {
      const name = m.author.global_name || m.author.username
      const content = m.content?.trim() || '(첨부파일 공유)'
      return `${name}: ${content}`
    }).join('\n')

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `다음 대화를 3줄로 요약해줘:\n${formatted}`,
  })
  console.log('AI 응답:', response.text?.slice(0, 200))
}
