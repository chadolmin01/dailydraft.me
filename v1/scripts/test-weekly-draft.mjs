/**
 * Ghostwriter 주간 초안 생성 시뮬레이션
 *
 * 실제 Discord 채널의 대화를 가져와서 Ghostwriter 전체 파이프라인을 실행한다.
 * 크론이 일요일에 하는 것과 동일한 동작을 즉시 실행.
 *
 * 사용법: node scripts/test-weekly-draft.mjs <채널ID> [프로젝트명]
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const TOKEN = env('DISCORD_BOT_TOKEN')
const GEMINI_KEY = env('GEMINI_API_KEY')
const API = 'https://discord.com/api/v10'

const channelId = process.argv[2]
const projectTitle = process.argv[3] || 'FoodFinder'

if (!channelId) {
  console.error('사용법: node scripts/test-weekly-draft.mjs <채널ID> [프로젝트명]')
  process.exit(1)
}

// ── Discord API ──
async function discord(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  })
  return res.json()
}

// ── 이미지 다운로드 ──
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
async function downloadImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = await res.arrayBuffer()
    return { base64: Buffer.from(buffer).toString('base64'), mimeType: contentType.split(';')[0] }
  } catch { return null }
}

function describeAttachment(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (IMAGE_EXTS.includes(ext)) return `${filename} (이미지/스크린샷)`
  if (['fig', 'sketch', 'xd', 'psd'].includes(ext)) return `${filename} (디자인 파일)`
  if (['pdf', 'docx', 'pptx'].includes(ext)) return `${filename} (문서)`
  return filename
}

async function run() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🤖 Ghostwriter 주간 초안 생성 시뮬레이션`)
  console.log(`   채널: ${channelId}`)
  console.log(`   프로젝트: ${projectTitle}`)
  console.log(`${'═'.repeat(60)}\n`)

  // 1. 메시지 수집
  console.log('📥 Discord 메시지 수집 중...')
  const allMessages = await discord(`/channels/${channelId}/messages?limit=100`)

  if (!Array.isArray(allMessages)) {
    console.error('❌ 메시지 가져오기 실패:', allMessages)
    return
  }

  // 봇 메시지 필터링, 시간순 정렬
  const humanMessages = allMessages
    .filter(m => !m.author.bot && (m.content?.trim().length > 0 || m.attachments?.length > 0))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  console.log(`   전체: ${allMessages.length}개, 사람: ${humanMessages.length}개\n`)

  if (humanMessages.length === 0) {
    console.log('⚠️  분석할 메시지가 없습니다.')
    return
  }

  // 2. 메시지 포맷팅 (ghostwriter.ts의 preprocessMessages와 동일)
  const members = new Set()
  const formatted = humanMessages.map(m => {
    const date = new Date(m.timestamp).toLocaleDateString('ko-KR', {
      month: 'short', day: 'numeric', weekday: 'short',
    })
    const name = m.author.global_name || m.author.username
    members.add(name)

    const attNote = m.attachments?.length > 0
      ? ` [첨부: ${m.attachments.map(a => describeAttachment(a.filename)).join(', ')}]`
      : ''
    const content = m.content?.trim() || '(첨부파일 공유)'
    return `[${date}] ${name}: ${content}${attNote}`
  }).join('\n')

  console.log('📋 수집된 대화:')
  console.log('─'.repeat(40))
  console.log(formatted)
  console.log('─'.repeat(40))
  console.log(`\n👥 참여 멤버: ${[...members].join(', ')}\n`)

  // 3. 이미지 수집 및 다운로드
  const imageAttachments = []
  for (const m of humanMessages) {
    for (const att of (m.attachments || [])) {
      const ext = att.filename?.split('.').pop()?.toLowerCase()
      if (IMAGE_EXTS.includes(ext) && imageAttachments.length < 10) {
        imageAttachments.push({
          url: att.url,
          filename: att.filename,
          author: m.author.global_name || m.author.username,
        })
      }
    }
  }

  const imageParts = []
  const imageDescriptions = []
  if (imageAttachments.length > 0) {
    console.log(`🖼️  이미지 ${imageAttachments.length}개 다운로드 중...`)
    for (const img of imageAttachments) {
      const downloaded = await downloadImage(img.url)
      if (downloaded) {
        imageParts.push({ inlineData: { data: downloaded.base64, mimeType: downloaded.mimeType } })
        imageDescriptions.push(`${img.filename} (by ${img.author})`)
        console.log(`   ✅ ${img.filename}`)
      }
    }
    console.log('')
  }

  // 4. AI 호출 (ghostwriter.ts의 SYSTEM_PROMPT + generateWeeklyDraft와 동일)
  console.log('🤖 Gemini AI 초안 생성 중...\n')

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY, vertexai: true })

  const systemPrompt = `당신은 대학 창업동아리 팀의 주간 업데이트를 작성하는 AI 도우미입니다.
팀원들이 Discord에서 나눈 대화를 분석하여 구조화된 주간 업데이트를 만듭니다.

## 규칙
1. **summary**: 3~4문장으로 핵심 활동을 요약합니다.
2. **tasks**: 대화에서 언급된 작업을 항목별로 추출합니다. done=true: 완료, done=false: 진행 중
3. **nextPlan**: 다음에 할 일로 언급된 내용을 정리합니다.
4. **teamStatus**: good/normal/hard 중 하나
5. **confidence**: 각 섹션의 신뢰도 (high/mid/low)
6. **톤**: 합쇼체("-습니다/-입니다") 사용
7. 잡담/사적 대화는 무시, 프로젝트 관련 내용만 추출
8. 과장 금지. 대화에 없는 내용을 지어내지 말 것
9. 이미지 분석: 첨부된 이미지의 시각적 내용을 분석하여 구체적 디자인 요소를 tasks/summary에 반영

## 출력 형식 (JSON)
\`\`\`json
{
  "title": "이번 주 가장 중요한 성과 한 줄 (30자 이내)",
  "updateType": "ideation|design|development|launch|general",
  "summary": "이번 주 활동 요약 (3~4문장, 합쇼체)",
  "tasks": [
    {"text": "작업 내용", "done": true, "member": "팀원명"},
    {"text": "진행 중인 작업", "done": false, "member": "팀원명"}
  ],
  "nextPlan": "다음 주 계획 (2~3문장, 합쇼체)",
  "teamStatus": "good|normal|hard",
  "teamStatusReason": "팀 상태 판단 근거 (1문장)",
  "confidence": {
    "summary": "high|mid|low",
    "tasks": "high|mid|low",
    "nextPlan": "high|mid|low",
    "teamStatus": "high|mid|low"
  }
}
\`\`\`
JSON만 출력하세요.`

  const userPrompt = [
    `## 프로젝트: ${projectTitle}`,
    `## 참여 멤버: ${[...members].join(', ')}`,
    `## 이번 주 Discord 대화 (${humanMessages.length}개 메시지)\n\n${formatted}`,
    imageParts.length > 0
      ? `\n## 첨부 이미지 (${imageParts.length}개)\n아래 이미지는 팀원들이 Discord에 공유한 디자인 시안/스크린샷입니다.\n각 이미지의 내용을 분석하여 tasks와 summary에 반영해주세요.\n파일: ${imageDescriptions.join(', ')}`
      : '',
    '위 정보를 바탕으로 주간 업데이트를 작성해주세요.',
  ].filter(Boolean).join('\n\n')

  const parts = [{ text: userPrompt }, ...imageParts]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '네, 구조화된 주간 업데이트를 JSON으로 작성하겠습니다.' }] },
      { role: 'user', parts },
    ],
  })

  const aiText = response.text || ''

  // 5. 결과 파싱 및 출력
  const jsonMatch = aiText.match(/```json\s*([\s\S]*?)```/) || aiText.match(/(\{[\s\S]*\})/)

  if (!jsonMatch) {
    console.log('⚠️  AI 응답을 파싱하지 못했습니다:')
    console.log(aiText)
    return
  }

  const draft = JSON.parse(jsonMatch[1])

  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║  📝 AI 주간 업데이트 초안                                ║')
  console.log('╠' + '═'.repeat(58) + '╣')
  console.log('')
  console.log(`  📌 제목: ${draft.title}`)
  console.log(`  📂 유형: ${draft.updateType}`)
  console.log('')
  console.log('  ── 요약 ──')
  console.log(`  ${draft.summary}`)
  console.log('')
  console.log('  ── 작업 ──')
  for (const t of draft.tasks || []) {
    const icon = t.done ? '✅' : '🔧'
    console.log(`  ${icon} ${t.text}${t.member ? ` — ${t.member}` : ''}`)
  }
  console.log('')
  console.log('  ── 다음 주 계획 ──')
  console.log(`  ${draft.nextPlan}`)
  console.log('')
  console.log(`  ── 팀 상태: ${draft.teamStatus === 'good' ? '🟢 순조' : draft.teamStatus === 'hard' ? '🔴 어려움' : '🟡 보통'} ──`)
  console.log(`  ${draft.teamStatusReason}`)
  console.log('')
  console.log('  ── 신뢰도 ──')
  for (const [key, val] of Object.entries(draft.confidence || {})) {
    const icon = val === 'high' ? '🟢' : val === 'mid' ? '🟡' : '🔴'
    console.log(`  ${icon} ${key}: ${val}`)
  }
  console.log('')
  console.log('╚' + '═'.repeat(58) + '╝')
  console.log('')
  console.log('이 초안이 실제 크론에서는:')
  console.log('  1. weekly_update_drafts 테이블에 저장')
  console.log('  2. 팀장에게 Discord DM으로 승인 요청')
  console.log('  3. 팀장이 Draft 앱에서 검토/수정/승인')
  console.log('')
}

run().catch(console.error)
