/**
 * Discord 하네스 엔지니어링 — 채널/역할 재구성
 *
 * 기존 setup-discord.mjs 위에 추가 채널을 생성한다.
 * 멱등: 이미 존재하는 채널은 스킵 (이름 기준 체크)
 *
 * 추가 채널:
 * - #시작하기 (온보딩, 읽기 전용)
 * - #주간-체크인 (포럼 — 매주 스레드 자동 생성)
 * - #결정-로그 (중요 결정 아카이브)
 * - #디자인-리뷰 (포럼 — 디자이너 작업물 공유)
 * - #기획-비즈니스 (기획/비즈 논의)
 *
 * 기존 채널 수정:
 * - 운영진-전용: draft 봇에 읽기 권한 추가
 * - 각 채널 topic 설정
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const tokenMatch = envContent.match(/DISCORD_BOT_TOKEN=(.+)/)
const TOKEN = tokenMatch?.[1]?.trim()

const GUILD = '1492207944530399495'
const API = 'https://discord.com/api/v10'
const BOT_ROLE_ID = '1492208038528942200' // draft 봇 역할

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
  // 현재 채널 목록 조회
  const channels = await api('GET', `/guilds/${GUILD}/channels`)
  if (!channels) { console.error('채널 목록 조회 실패'); return }

  const byName = {}
  channels.forEach(c => { byName[c.name] = c })

  // 카테고리 ID 찾기
  const catOps = channels.find(c => c.name === '📋 운영' && c.type === 4)
  const catProject = channels.find(c => c.name === '💡 프로젝트' && c.type === 4)
  const catFree = channels.find(c => c.name === '🗣️ 자유' && c.type === 4)

  if (!catOps || !catProject || !catFree) {
    console.error('기존 카테고리를 찾을 수 없습니다')
    return
  }

  const everyoneId = GUILD

  // ── 1. #시작하기 (온보딩, 읽기 전용) ──
  if (!byName['시작하기']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '시작하기',
      type: 0,
      parent_id: catOps.id,
      position: 0, // 카테고리 최상단
      topic: 'FLIP 동아리 온보딩 가이드. 처음 오셨다면 여기부터 읽어주세요.',
      permission_overwrites: [
        { id: everyoneId, type: 0, deny: '2048' }, // 일반 멤버 쓰기 불가
        { id: BOT_ROLE_ID, type: 0, allow: '2048' }, // 봇은 쓰기 가능
      ],
    })
    if (ch) console.log('✅ #시작하기 생성:', ch.id)
  } else {
    console.log('⏭️ #시작하기 이미 존재')
  }

  // ── 2. #주간-체크인 (포럼 채널, type=15) ──
  if (!byName['주간-체크인']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '주간-체크인',
      type: 15, // Forum
      parent_id: catProject.id,
      topic: '매주 월요일 자동 생성. 양식에 맞춰 이번 주 계획/완료/블로커를 남겨주세요.',
      default_auto_archive_duration: 10080, // 7일 후 자동 아카이브
      available_tags: [
        { name: '✅ 완료', moderated: false },
        { name: '🔧 진행중', moderated: false },
        { name: '🚧 블로커', moderated: false },
        { name: '💡 아이디어', moderated: false },
      ],
    })
    if (ch) console.log('✅ #주간-체크인 (포럼) 생성:', ch.id)
  } else {
    console.log('⏭️ #주간-체크인 이미 존재')
  }

  // ── 3. #결정-로그 ──
  if (!byName['결정-로그']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '결정-로그',
      type: 0,
      parent_id: catOps.id,
      topic: '중요 결정사항 아카이브. 📌 리액션이 달린 메시지가 자동 수집됩니다.',
      permission_overwrites: [
        { id: everyoneId, type: 0, deny: '2048' }, // 일반 쓰기 불가
        { id: BOT_ROLE_ID, type: 0, allow: '2048' }, // 봇만 쓰기
      ],
    })
    if (ch) console.log('✅ #결정-로그 생성:', ch.id)
  } else {
    console.log('⏭️ #결정-로그 이미 존재')
  }

  // ── 4. #디자인-리뷰 (포럼) ──
  if (!byName['디자인-리뷰']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '디자인-리뷰',
      type: 15, // Forum
      parent_id: catProject.id,
      topic: '디자인 작업물 공유 & 피드백. Figma 링크/스크린샷과 함께 포스트를 올려주세요.',
      default_auto_archive_duration: 10080,
      available_tags: [
        { name: '🎨 시안', moderated: false },
        { name: '👀 리뷰 요청', moderated: false },
        { name: '✅ 확정', moderated: false },
        { name: '🔄 수정 필요', moderated: false },
      ],
    })
    if (ch) console.log('✅ #디자인-리뷰 (포럼) 생성:', ch.id)
  } else {
    console.log('⏭️ #디자인-리뷰 이미 존재')
  }

  // ── 5. #기획-비즈니스 ──
  if (!byName['기획-비즈니스']) {
    const ch = await api('POST', `/guilds/${GUILD}/channels`, {
      name: '기획-비즈니스',
      type: 0,
      parent_id: catFree.id,
      topic: '시장조사, 인터뷰 정리, 사업계획, 비즈니스 모델 논의. 노션/드라이브 링크 공유도 여기서.',
    })
    if (ch) console.log('✅ #기획-비즈니스 생성:', ch.id)
  } else {
    console.log('⏭️ #기획-비즈니스 이미 존재')
  }

  // ── 6. 운영진-전용 채널에 봇 읽기 권한 추가 ──
  const adminChannel = byName['운영진-전용']
  if (adminChannel) {
    await api('PUT', `/channels/${adminChannel.id}/permissions/${BOT_ROLE_ID}`, {
      allow: '66560', // VIEW_CHANNEL(1024) + READ_MESSAGE_HISTORY(65536)
      deny: '0',
      type: 0, // role
    })
    console.log('✅ #운영진-전용 → draft 봇 읽기 권한 추가')
  }

  // ── 7. 기존 채널 topic 업데이트 ──
  const topics = {
    '공지사항': '동아리 공지사항. 운영진만 작성 가능합니다.',
    '일정': '미팅/발표/제출 일정. 중요 일정은 핀 해주세요.',
    '주간-업데이트': 'AI가 생성한 주간 업데이트가 게시됩니다. Draft 봇이 자동 관리합니다.',
    '잡담': '자유 대화. 프로젝트 무관한 이야기도 OK.',
    '질문-답변': '기술/기획/디자인 질문. 스레드로 답변해주세요.',
  }
  for (const [name, topic] of Object.entries(topics)) {
    const ch = byName[name]
    if (ch && ch.topic !== topic) {
      await api('PATCH', `/channels/${ch.id}`, { topic })
      console.log(`✅ #${name} topic 업데이트`)
    }
  }

  // ── 8. #시작하기에 온보딩 메시지 작성 ──
  const startCh = byName['시작하기'] || channels.find(c => c.name === '시작하기')
  if (startCh) {
    // 기존 메시지가 있으면 스킵
    const existing = await api('GET', `/channels/${startCh.id}/messages?limit=1`)
    if (!existing || existing.length === 0) {
      await api('POST', `/channels/${startCh.id}/messages`, {
        content: `**FLIP 동아리에 오신 것을 환영합니다!** 🎉

아래 내용을 읽고 시작해주세요.

━━━━━━━━━━━━━━━━━━━━

**📌 채널 가이드**
• **#공지사항** — 동아리 공지 (읽기 전용)
• **#일정** — 미팅, 발표, 제출 일정
• **#주간-체크인** — 매주 월요일 자동 생성되는 포럼. 이번 주 계획을 남겨주세요
• **#주간-업데이트** — AI가 정리한 팀별 주간 요약이 게시됩니다
• **#디자인-리뷰** — 디자인 작업물 공유 & 피드백 (포럼)
• **#기획-비즈니스** — 시장조사, 사업계획, 비즈 논의
• **#잡담** — 자유 대화
• **#질문-답변** — 기술/기획/디자인 질문

━━━━━━━━━━━━━━━━━━━━

**🤖 Draft 봇이 하는 일**
1. 팀 채널의 대화를 **매주 일요일** 수집합니다
2. AI가 주간 업데이트 초안을 만듭니다
3. 팀장에게 DM으로 초안을 보냅니다
4. 팀장이 30초 검토 후 승인하면 발행됩니다

> ⚠️ 팀 채널의 메시지가 AI 요약에 사용됩니다. 잡담은 자동 필터링됩니다.

━━━━━━━━━━━━━━━━━━━━

**✅ 주간 체크인 양식**
매주 월요일 #주간-체크인에 스레드가 열립니다. 아래 양식으로 답글 달아주세요:

\`\`\`
✅ 이번 주 할 일:
🔧 진행 중:
🚧 블로커:
\`\`\`

━━━━━━━━━━━━━━━━━━━━

**📌 리액션 규칙**
• ✅ → 완료
• 👀 → 리뷰 중
• 🚀 → 배포/핸드오프
• 📌 → 중요 결정 (자동 수집)
• 👍👎 → 찬반 투표`,
      })
      console.log('✅ #시작하기 온보딩 메시지 작성')
    } else {
      console.log('⏭️ #시작하기 메시지 이미 존재')
    }
  }

  console.log('\n🎉 하네스 엔지니어링 세팅 완료!')
}

run().catch(console.error)
