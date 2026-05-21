/**
 * 디자인 시안 이미지 분석 테스트
 *
 * 사용법:
 *   1. Discord 채널에 디자인 시안/스크린샷 이미지를 올린다
 *   2. 이 스크립트를 실행한다:
 *      node scripts/test-image-analysis.mjs <채널ID>
 *
 *   채널ID 없이 실행하면 데모 채널(🍔-foodfinder-팀채널)을 사용한다.
 *
 * 결과: AI가 이미지를 어떻게 분석하는지 터미널에 출력
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

if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN 필요'); process.exit(1) }
if (!GEMINI_KEY) { console.error('❌ GEMINI_API_KEY 필요'); process.exit(1) }

const channelId = process.argv[2]
if (!channelId) {
  console.error('사용법: node scripts/test-image-analysis.mjs <채널ID>')
  console.error('')
  console.error('채널ID 찾는 법:')
  console.error('  Discord에서 채널 우클릭 → "채널 ID 복사"')
  console.error('  (개발자 모드: 설정 → 고급 → 개발자 모드 활성화)')
  process.exit(1)
}

// ── Discord API ──
async function discord(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  return { ok: res.ok, data: text ? JSON.parse(text) : null }
}

// ── 이미지 다운로드 ──
async function downloadImage(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  const contentType = res.headers.get('content-type') || 'image/png'
  const buffer = await res.arrayBuffer()
  return {
    base64: Buffer.from(buffer).toString('base64'),
    mimeType: contentType.split(';')[0],
  }
}

async function run() {
  console.log(`\n📸 채널 ${channelId}에서 이미지 메시지 수집 중...\n`)

  // 1. 최근 메시지 50개 가져오기
  const msgs = await discord('GET', `/channels/${channelId}/messages?limit=50`)
  if (!msgs.ok) {
    console.error('❌ 메시지 가져오기 실패:', msgs.data)
    return
  }

  // 2. 이미지 첨부파일 있는 메시지 필터
  const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
  const imageMessages = msgs.data.filter(m =>
    m.attachments?.some(a => {
      const ext = a.filename?.split('.').pop()?.toLowerCase()
      return IMAGE_EXTS.includes(ext)
    })
  )

  if (imageMessages.length === 0) {
    console.log('⚠️  이미지가 포함된 메시지가 없습니다.')
    console.log('')
    console.log('테스트 방법:')
    console.log('  1. Discord 채널에 디자인 시안/스크린샷을 올려주세요')
    console.log('  2. 다시 이 스크립트를 실행하세요')
    return
  }

  console.log(`✅ 이미지 메시지 ${imageMessages.length}개 발견\n`)

  // 3. 이미지 다운로드
  const images = []
  for (const m of imageMessages.slice(0, 5)) {
    for (const att of m.attachments) {
      const ext = att.filename?.split('.').pop()?.toLowerCase()
      if (!IMAGE_EXTS.includes(ext)) continue

      console.log(`  ⬇️  ${att.filename} (by ${m.author.global_name || m.author.username})`)
      const img = await downloadImage(att.url)
      if (img) {
        images.push({
          ...img,
          filename: att.filename,
          author: m.author.global_name || m.author.username,
          text: m.content || '(텍스트 없음)',
        })
      }
    }
  }

  if (images.length === 0) {
    console.error('❌ 이미지 다운로드 실패')
    return
  }

  console.log(`\n🤖 Gemini에 ${images.length}개 이미지 분석 요청 중...\n`)

  // 4. Gemini 멀티모달 호출
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY, vertexai: true })

  const imageParts = images.map(img => ({
    inlineData: { data: img.base64, mimeType: img.mimeType },
  }))

  const imageList = images.map((img, i) => `${i + 1}. ${img.filename} (by ${img.author}) — "${img.text}"`).join('\n')

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `당신은 대학 프로젝트 팀의 디자인 작업을 분석하는 AI입니다.
아래 이미지는 팀원들이 Discord에 공유한 디자인 시안/스크린샷입니다.

각 이미지에 대해 다음을 분석해주세요:
1. **무엇인지**: UI 시안, 와이어프레임, 로고, 아이콘, 발표자료 등
2. **어떤 페이지/화면인지**: 메인 페이지, 로그인, 대시보드 등
3. **디자인 요소**: 레이아웃, 색상 톤, 주요 컴포넌트
4. **작업 진행도 추정**: 초기 시안, 중간 단계, 거의 완성 등
5. **주간 업데이트에 쓸 한 줄 요약**

이미지 목록:
${imageList}

한국어 합쇼체로 답변해주세요.`,
          },
          ...imageParts,
        ],
      },
    ],
  })

  const result = response.text || ''

  console.log('═'.repeat(60))
  console.log('📋 AI 이미지 분석 결과')
  console.log('═'.repeat(60))
  console.log('')
  console.log(result)
  console.log('')
  console.log('═'.repeat(60))

  // 5. Ghostwriter 전체 파이프라인도 테스트 (이미지 포함)
  console.log('\n🔄 Ghostwriter 전체 파이프라인 테스트...\n')

  // 전체 메시지로 대화 텍스트 구성
  const allMessages = msgs.data
    .filter(m => !m.author.bot)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const conversation = allMessages.map(m => {
    const date = new Date(m.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
    const name = m.author.global_name || m.author.username
    const attNote = m.attachments?.length > 0
      ? ` [첨부: ${m.attachments.map(a => a.filename).join(', ')}]`
      : ''
    const content = m.content?.trim() || '(첨부파일 공유)'
    return `[${date}] ${name}: ${content}${attNote}`
  }).join('\n')

  const ghostwriterPrompt = `당신은 대학 창업동아리 팀의 주간 업데이트를 작성하는 AI 도우미입니다.

## 규칙
- summary: 3~4문장 요약
- tasks: done/진행중 구분, member 표기
- 이미지 분석: 첨부된 이미지의 시각적 내용을 분석하여 구체적 디자인 요소를 tasks/summary에 반영
- 톤: 합쇼체

## 출력: JSON
\`\`\`json
{
  "title": "30자 이내 한 줄",
  "summary": "...",
  "tasks": [{"text": "...", "done": true/false, "member": "..."}],
  "designAnalysis": "이미지에서 파악한 디자인 작업 상세 설명"
}
\`\`\`

## 대화 내역 (${allMessages.length}개)
${conversation}

## 첨부 이미지 (${images.length}개)
${imageList}
아래 이미지를 분석하여 반영해주세요.`

  const ghostwriterResult = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{
      role: 'user',
      parts: [
        { text: ghostwriterPrompt },
        ...imageParts,
      ],
    }],
  })

  const gwText = ghostwriterResult.text || ''

  console.log('═'.repeat(60))
  console.log('📝 Ghostwriter 초안 (이미지 반영)')
  console.log('═'.repeat(60))
  console.log('')

  // JSON 파싱 시도
  const jsonMatch = gwText.match(/```json\s*([\s\S]*?)```/) || gwText.match(/(\{[\s\S]*\})/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      console.log(`제목: ${parsed.title}`)
      console.log(`\n요약:\n${parsed.summary}`)
      console.log('\n작업:')
      for (const t of parsed.tasks || []) {
        console.log(`  ${t.done ? '✅' : '🔧'} ${t.text}${t.member ? ` (${t.member})` : ''}`)
      }
      if (parsed.designAnalysis) {
        console.log(`\n🎨 디자인 분석:\n${parsed.designAnalysis}`)
      }
    } catch {
      console.log(gwText)
    }
  } else {
    console.log(gwText)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('✅ 테스트 완료!')
  console.log('═'.repeat(60))
}

run().catch(console.error)
