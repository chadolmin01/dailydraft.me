/**
 * Ghostwriter E2E 시뮬레이션
 *
 * 실제 Discord 서버에 역할별 예시 메시지를 보내고,
 * 해당 메시지를 fetch → AI 분석 → 결과 출력까지 전체 파이프라인을 테스트한다.
 *
 * 실행: node scripts/test-ghostwriter-e2e.mjs
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match?.[1]?.trim()
}

const TOKEN = env('DISCORD_BOT_TOKEN')
const GEMINI_KEY = env('GEMINI_API_KEY')
const GUILD_ID = '1492207944530399495'
const API = 'https://discord.com/api/v10'

if (!TOKEN) { console.error('DISCORD_BOT_TOKEN 필요'); process.exit(1) }
if (!GEMINI_KEY) { console.error('GEMINI_API_KEY 필요'); process.exit(1) }

// ── Discord API ──
async function discord(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }
}

// ── Gemini API (간이 호출) ──
async function callGemini(systemPrompt, userPrompt) {
  // env에서 따옴표 제거
  const cleanKey = GEMINI_KEY.replace(/^["']|["']$/g, '')
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: cleanKey, vertexai: true })
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '네, 구조화된 주간 업데이트를 JSON으로 작성하겠습니다.' }] },
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
  })
  return response.text || ''
}

// ── 테스트 채널 생성 ──
async function createTestChannel() {
  const res = await discord('POST', `/guilds/${GUILD_ID}/channels`, {
    name: '🧪-ghostwriter-테스트',
    type: 0, // text
    topic: 'Ghostwriter E2E 시뮬레이션 채널 (자동 삭제 예정)',
  })
  if (!res.ok) throw new Error(`채널 생성 실패: ${JSON.stringify(res.data)}`)
  return res.data.id
}

// ── 메시지 보내기 ──
async function sendMsg(channelId, content) {
  const res = await discord('POST', `/channels/${channelId}/messages`, { content })
  if (!res.ok) console.warn('메시지 전송 실패:', res.data?.message)
  return res.data
}

// ── 메시지 fetch ──
async function fetchMessages(channelId) {
  const res = await discord('GET', `/channels/${channelId}/messages?limit=50`)
  if (!res.ok) throw new Error('메시지 조회 실패')
  return res.data.sort((a, b) => a.id.localeCompare(b.id))
}

// ── 채널 삭제 ──
async function deleteChannel(channelId) {
  await discord('DELETE', `/channels/${channelId}`)
}

// ── 메시지 전처리 (ghostwriter.ts 로직 재현) ──
// 시뮬레이션에서는 봇 필터를 스킵 (실제 환경에서는 팀원이 직접 메시지를 보냄)
function preprocessMessages(messages) {
  const human = messages
    .filter(m => m.content.trim().length > 0 || m.attachments?.length > 0)

  const memberSet = new Set()
  const formatted = human.map(m => {
    const date = new Date(m.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
    const name = m.author.global_name || m.author.username
    memberSet.add(name)
    const attachNote = m.attachments?.length > 0
      ? ` [첨부: ${m.attachments.map(a => a.filename).join(', ')}]`
      : ''
    const content = m.content.trim() || '(첨부파일 공유)'
    return `[${date}] ${name}: ${content}${attachNote}`
  }).join('\n')

  return { formatted, count: human.length, members: [...memberSet] }
}

// ── SYSTEM PROMPT (ghostwriter.ts에서 가져옴) ──
const SYSTEM_PROMPT = `당신은 대학 창업동아리 팀의 주간 업데이트를 작성하는 AI 도우미입니다.
팀원들이 Discord에서 나눈 대화를 분석하여 구조화된 주간 업데이트를 만듭니다.

## 규칙
1. **summary**: 3~4문장으로 핵심 활동 요약
2. **tasks**: 대화에서 언급된 작업. done=true 완료, done=false 진행 중, member 해당 팀원
3. **nextPlan**: 다음 주 계획 2~3문장
4. **teamStatus**: good/normal/hard
5. **confidence**: 각 섹션 high/mid/low
6. 합쇼체("-습니다/-입니다")
7. 잡담 무시, 프로젝트 관련만
8. 과장 금지, 불확실하면 confidence=low
9. 구조화된 체크인 우선
10. 핀 메시지(결정사항) 반드시 반영
11. 이전 피드백 반영
12. **디자인 작업 인식**: 이미지/스크린샷 첨부, Figma 링크, 디자인 파일은 디자인 작업의 증거. "(첨부파일 공유)"도 무시하지 말 것

## 출력 형식 (JSON)
\`\`\`json
{
  "title": "성과 한 줄 (30자 이내)",
  "updateType": "ideation|design|development|launch|general",
  "summary": "3~4문장 합쇼체",
  "tasks": [{"text":"작업","done":true,"member":"이름"}],
  "nextPlan": "2~3문장 합쇼체",
  "teamStatus": "good|normal|hard",
  "teamStatusReason": "판단 근거 1문장",
  "confidence": {"summary":"high|mid|low","tasks":"high|mid|low","nextPlan":"high|mid|low","teamStatus":"high|mid|low"}
}
\`\`\`
JSON만 출력하세요.`

// ═══════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════
async function run() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   Ghostwriter E2E 시뮬레이션                   ║')
  console.log('╚════════════════════════════════════════════════╝\n')

  // 1. 테스트 채널 생성
  console.log('📌 Step 1: 테스트 채널 생성')
  const channelId = await createTestChannel()
  console.log(`   ✅ #🧪-ghostwriter-테스트 (${channelId})\n`)

  try {
    // 2. 역할별 시뮬레이션 메시지 전송
    console.log('📌 Step 2: 역할별 예시 메시지 전송')

    // 역할별 메시지 (봇이 대신 전송하므로, 유저 이름을 메시지에 포함)
    const roleMessages = [
      // ── 개발자 (김개발) ──
      { name: '김개발', msg: '로그인 API 연동 완료했습니다. JWT 토큰 방식으로 구현했고 refresh token도 처리했어요' },
      { name: '김개발', msg: '회원가입 폼은 유효성 검사까지 구현 완료. 이메일 중복체크 API도 연동했습니다' },
      { name: '김개발', msg: '메인 페이지 반응형 작업 진행 중인데 태블릿 사이즈에서 레이아웃 깨지는 이슈 발견' },
      { name: '김개발', msg: 'Supabase RLS 정책 설정하다가 좀 막혔는데 결국 해결했습니다. policy 순서가 중요하더라고요' },

      // ── 디자이너 (박디자인) ──
      { name: '박디자인', msg: '온보딩 플로우 와이어프레임 완성했습니다 https://figma.com/file/abc123/onboarding-flow' },
      { name: '박디자인', msg: '메인 페이지 시안 v2 올립니다. 피드백 주세요 [첨부: main-page-v2.png (이미지/스크린샷)]' },
      { name: '박디자인', msg: '컴포넌트 라이브러리 정리 시작했어요. Button, Input, Card 3종 완료' },
      { name: '박디자인', msg: '프로필 페이지 디자인은 다음주에 할 예정입니다. 일단 와이어프레임만 잡아놨어요' },

      // ── 기획자 (이기획) ──
      { name: '이기획', msg: '교내 창업팀 인터뷰 3곳 완료! 공통적으로 팀 관리 도구 필요성 언급' },
      { name: '이기획', msg: '경쟁사 분석표 notion에 정리했습니다. Trello, Notion, Slack 3개 비교' },
      { name: '이기획', msg: '다음주 목표: 린캔버스 고객 세그먼트 섹션 작성 + 페르소나 정의' },
      { name: '이기획', msg: '인터뷰 대상자 1명 일정이 아직 안 잡혔는데 이번주 내로 확정할게요' },

      // ── 잡담 (무시되어야 함) ──
      { name: '김개발', msg: '아 오늘 날씨 좋다 ☀️' },
      { name: '이기획', msg: 'ㅋㅋㅋㅋ 점심 뭐 먹을까' },
    ]

    for (const { msg } of roleMessages) {
      await sendMsg(channelId, msg)
      await new Promise(r => setTimeout(r, 500))
    }
    console.log(`   ✅ ${roleMessages.length}개 메시지 전송 완료\n`)

    // 3. 메시지 fetch
    console.log('📌 Step 3: 메시지 수집')
    const fetched = await fetchMessages(channelId)
    console.log(`   ✅ ${fetched.length}개 메시지 수집`)

    // 4. 전처리 (시뮬레이션이므로 봇 메시지를 가상 유저로 매핑)
    console.log('\n📌 Step 4: 전처리')
    // 봇이 보낸 메시지를 가상 유저별로 매핑
    const nameMap = {}
    for (const rm of roleMessages) {
      nameMap[rm.msg.slice(0, 20)] = rm.name
    }
    const fakeMsgs = fetched.map((m, i) => ({
      ...m,
      author: {
        ...m.author,
        bot: false,
        global_name: roleMessages[i]?.name || m.author.global_name || m.author.username,
      }
    }))
    const { formatted, count, members } = preprocessMessages(fakeMsgs)
    console.log(`   메시지: ${count}개`)
    console.log(`   참여 멤버: ${members.join(', ')}`)
    console.log(`   ─── 전처리된 메시지 ───`)
    console.log(formatted.split('\n').map(l => `   ${l}`).join('\n'))
    console.log(`   ────────────────────────\n`)

    // 5. AI 호출
    console.log('📌 Step 5: Gemini AI 호출 (주간 업데이트 생성)')
    const prompt = [
      `## 프로젝트: FoodFinder (음식 추천 앱)`,
      `## Discord 채널: #🧪-ghostwriter-테스트`,
      `## 참여 멤버: ${members.join(', ')}`,
      `## 이번 주 Discord 대화 (${count}개 메시지)\n\n${formatted}`,
      '위 정보를 바탕으로 주간 업데이트를 작성해주세요.',
    ].join('\n\n')

    const aiResponse = await callGemini(SYSTEM_PROMPT, prompt)
    console.log('   ✅ AI 응답 수신\n')

    // 6. 파싱
    console.log('📌 Step 6: 결과 파싱 및 검증')
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/) || aiResponse.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
      console.error('   ❌ JSON 파싱 실패')
      console.log('   Raw:', aiResponse)
      return
    }

    const result = JSON.parse(jsonMatch[1])
    console.log('   ✅ 파싱 성공\n')

    // 7. 결과 출력
    console.log('═══════════════════════════════════════════════')
    console.log('   📋 AI 생성 주간 업데이트')
    console.log('═══════════════════════════════════════════════\n')

    console.log(`   📌 제목: ${result.title}`)
    console.log(`   📌 유형: ${result.updateType}`)
    console.log(`   📌 팀 상태: ${result.teamStatus} — ${result.teamStatusReason}`)
    console.log()

    console.log('   📝 요약:')
    console.log(`   ${result.summary}`)
    console.log()

    console.log('   ✅ 작업:')
    for (const task of result.tasks || []) {
      const icon = task.done ? '✅' : '⏳'
      const member = task.member ? ` (${task.member})` : ''
      console.log(`   ${icon} ${task.text}${member}`)
    }
    console.log()

    console.log('   📅 다음 주 계획:')
    console.log(`   ${result.nextPlan}`)
    console.log()

    console.log('   📊 신뢰도:')
    for (const [key, val] of Object.entries(result.confidence || {})) {
      const emoji = val === 'high' ? '🟢' : val === 'mid' ? '🟡' : '🔴'
      console.log(`   ${emoji} ${key}: ${val}`)
    }

    // 8. 검증
    console.log('\n═══════════════════════════════════════════════')
    console.log('   🔍 검증 체크리스트')
    console.log('═══════════════════════════════════════════════\n')

    const checks = [
      ['제목이 30자 이내', result.title.length <= 30],
      ['합쇼체 사용 (-습니다/-입니다)', /습니다|입니다/.test(result.summary)],
      ['updateType 유효', ['ideation', 'design', 'development', 'launch', 'general'].includes(result.updateType)],
      ['teamStatus 유효', ['good', 'normal', 'hard'].includes(result.teamStatus)],
      ['teamStatusReason 존재', !!result.teamStatusReason],
      ['tasks 배열 존재', Array.isArray(result.tasks) && result.tasks.length > 0],
      ['완료 작업 1개 이상', result.tasks?.some(t => t.done)],
      ['진행 중 작업 1개 이상', result.tasks?.some(t => !t.done)],
      ['잡담(날씨/점심) 미포함', !/날씨|점심/.test(result.summary + result.nextPlan)],
      ['디자인 작업 인식 (Figma/시안)', result.tasks?.some(t => /figma|시안|와이어프레임|컴포넌트|디자인/i.test(t.text))],
      ['멤버 이름 할당', result.tasks?.some(t => t.member)],
      ['confidence 4섹션 존재', result.confidence && Object.keys(result.confidence).length >= 4],
    ]

    let passed = 0
    for (const [name, ok] of checks) {
      console.log(`   ${ok ? '✅' : '❌'} ${name}`)
      if (ok) passed++
    }

    console.log(`\n   결과: ${passed}/${checks.length} 통과`)

  } finally {
    // 9. 정리
    console.log('\n📌 Step 9: 테스트 채널 삭제')
    await deleteChannel(channelId)
    console.log('   ✅ 채널 삭제 완료')
    console.log('\n🎉 E2E 시뮬레이션 완료!')
  }
}

run().catch(err => {
  console.error('❌ 시뮬레이션 실패:', err)
  process.exit(1)
})
