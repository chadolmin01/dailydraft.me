/**
 * 실제 Discord 서버에 팀 대화 예시를 보내는 스크립트
 * 개발자/디자이너/기획자 3인의 자연스러운 1주일 대화를 시뮬레이션
 *
 * 실행: node scripts/send-team-demo.mjs
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  return envContent.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^"|"$/g, '')
}

const TOKEN = env('DISCORD_BOT_TOKEN')
const GUILD = '1492207944530399495'
const API = 'https://discord.com/api/v10'

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  return { ok: res.ok, data: text ? JSON.parse(text) : null }
}

async function msg(chId, content) {
  await api('POST', `/channels/${chId}/messages`, { content })
  await new Promise(r => setTimeout(r, 1000)) // 1초 간격 — 채팅 흐름 느낌
}

async function run() {
  // 1. 데모 채널 생성
  console.log('채널 생성 중...')
  const ch = await api('POST', `/guilds/${GUILD}/channels`, {
    name: '🍔-foodfinder-팀채널',
    type: 0,
    topic: 'FoodFinder 팀 — 음식 추천 앱 프로젝트 (데모)',
  })
  if (!ch.ok) {
    console.error('채널 생성 실패:', ch.data)
    return
  }
  const chId = ch.data.id
  console.log(`✅ #🍔-foodfinder-팀채널 생성 (${chId})\n`)

  // ── 월요일: 주간 시작 ──
  console.log('📅 월요일 메시지 전송...')
  await msg(chId, '**━━ 월요일 ━━━━━━━━━━━━━━━━━━━**')
  await msg(chId, '안녕하세요! 이번 주도 화이팅합시다 💪')
  await msg(chId, '저는 이번주 로그인 API 연동 마무리할게요. JWT + refresh token 방식으로 가겠습니다')
  await msg(chId, '저도요~ 온보딩 플로우 와이어프레임 이번주 안에 끝내겠습니다. Figma에 올려놓을게요')
  await msg(chId, '저는 교내 창업팀 인터뷰 3곳 잡혀있어서 진행하고 결과 정리하겠습니다!')

  // ── 화요일: 개발자 진행 ──
  console.log('📅 화요일 메시지 전송...')
  await msg(chId, '**━━ 화요일 ━━━━━━━━━━━━━━━━━━━**')
  await msg(chId, '로그인 API 연동 완료했습니다! JWT 토큰 발급 + refresh token 갱신까지 다 됩니다')
  await msg(chId, '회원가입 폼도 유효성 검사까지 구현했어요. 이메일 중복체크 API도 연동 완료')
  await msg(chId, '오 빠르다 👏')

  // ── 수요일: 디자이너 작업 공유 ──
  console.log('📅 수요일 메시지 전송...')
  await msg(chId, '**━━ 수요일 ━━━━━━━━━━━━━━━━━━━**')
  await msg(chId, '온보딩 플로우 와이어프레임 완성했습니다!\nhttps://figma.com/file/abc123/onboarding-flow\n5단계로 구성했어요: 관심사 선택 → 위치 설정 → 알러지 입력 → 추천 미리보기 → 완료')
  await msg(chId, '메인 페이지 시안 v2도 올립니다. 피드백 주세요 🎨\n*(이미지 첨부: main-page-v2.png)*')
  await msg(chId, '우와 시안 예쁘다!! 색감 좋아요')
  await msg(chId, '저도 좋아요 👍 근데 검색창이 좀 더 눈에 띄면 좋을 것 같아요')
  await msg(chId, '아 맞다 오늘 날씨 진짜 좋다 ☀️ 밖에서 작업하고싶네')

  // ── 목요일: 기획자 + 이슈 ──
  console.log('📅 목요일 메시지 전송...')
  await msg(chId, '**━━ 목요일 ━━━━━━━━━━━━━━━━━━━**')
  await msg(chId, '교내 창업팀 인터뷰 3곳 완료했습니다!\n공통 피드백: 팀 관리 도구가 부족하다는 의견이 많았어요\n경쟁사 분석표도 Notion에 정리했습니다 (Trello, Notion, Slack 비교)')
  await msg(chId, '메인 페이지 반응형 작업 중인데 태블릿 사이즈에서 레이아웃 깨지는 이슈 발견했어요 😓\n일단 원인 파악 중입니다')
  await msg(chId, 'ㅋㅋㅋ 점심 뭐 먹을까')
  await msg(chId, '김밥천국 ㄱ')
  await msg(chId, '컴포넌트 라이브러리 정리 시작했어요. Button, Input, Card 3종 완료!\nhttps://figma.com/file/xyz789/component-library')

  // ── 금요일: 마무리 ──
  console.log('📅 금요일 메시지 전송...')
  await msg(chId, '**━━ 금요일 ━━━━━━━━━━━━━━━━━━━**')
  await msg(chId, 'Supabase RLS 정책 설정하다가 좀 막혔는데 결국 해결했습니다!\npolicy 적용 순서가 중요하더라고요')
  await msg(chId, '프로필 페이지 디자인은 다음주에 할 예정입니다. 일단 와이어프레임만 잡아놨어요')
  await msg(chId, '다음주 목표 정리:\n• 린캔버스 고객 세그먼트 섹션 작성\n• 페르소나 정의\n• 인터뷰 대상자 1명 일정 확정 (아직 미정)')
  await msg(chId, '검색창 피드백 반영해서 v3 작업할게요! 사이즈 키우고 아이콘 추가합니다')
  await msg(chId, '다들 수고하셨어요! 다음주도 파이팅 🔥')

  console.log('\n════════════════════════════════════════')
  console.log('✅ 전송 완료! Discord에서 확인하세요:')
  console.log('   #🍔-foodfinder-팀채널')
  console.log('════════════════════════════════════════')
}

run().catch(console.error)
