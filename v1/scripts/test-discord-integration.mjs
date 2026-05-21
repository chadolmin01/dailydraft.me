/**
 * Discord 하네스 통합 테스트
 * 각 기능이 Discord API와 정상 통신하는지 검증
 *
 * 실행: node scripts/test-discord-integration.mjs
 */
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
function env(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match?.[1]?.trim()
}

const TOKEN = env('DISCORD_BOT_TOKEN')
const GUILD_ID = '1492207944530399495'
const OPS_DASHBOARD = env('DISCORD_OPS_DASHBOARD_CHANNEL_ID')
const DECISION_LOG = env('DISCORD_DECISION_LOG_CHANNEL_ID')
const DEV_FEED = env('DISCORD_DEV_FEED_CHANNEL_ID')
const CHECKIN_FORUM = env('DISCORD_CHECKIN_FORUM_CHANNEL_ID')

const API = 'https://discord.com/api/v10'

let passed = 0
let failed = 0

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return { ok: res.ok, status: res.status, data }
}

function test(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name} — ${detail || 'FAILED'}`)
    failed++
  }
}

async function run() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Discord 하네스 통합 테스트              ║')
  console.log('╚══════════════════════════════════════════╝\n')

  // ── 1. 봇 인증 ──
  console.log('🔑 봇 인증')
  const me = await api('GET', '/users/@me')
  test('봇 토큰 유효', me.ok, `status: ${me.status}`)
  if (me.ok) test(`봇 이름: ${me.data.username}`, true)

  // ── 2. 길드 접근 ──
  console.log('\n🏠 길드 접근')
  const guild = await api('GET', `/guilds/${GUILD_ID}`)
  test('길드 조회', guild.ok, `status: ${guild.status}`)
  if (guild.ok) test(`길드 이름: ${guild.data.name}`, true)

  // ── 3. 채널 존재 확인 ──
  console.log('\n📢 채널 확인')
  const channels = [
    ['운영-대시보드', OPS_DASHBOARD],
    ['결정-로그', DECISION_LOG],
    ['개발-피드', DEV_FEED],
    ['주간-체크인 포럼', CHECKIN_FORUM],
  ]

  for (const [name, id] of channels) {
    if (!id) {
      test(`${name} 채널 ID`, false, '환경변수 미설정')
      continue
    }
    const ch = await api('GET', `/channels/${id}`)
    test(`${name} (${id})`, ch.ok, ch.ok ? '' : `status: ${ch.status}`)
  }

  // ── 4. 메시지 읽기 권한 ──
  console.log('\n📖 메시지 읽기')
  if (OPS_DASHBOARD) {
    const msgs = await api('GET', `/channels/${OPS_DASHBOARD}/messages?limit=1`)
    test('운영-대시보드 메시지 읽기', msgs.ok, msgs.ok ? '' : `${msgs.status}: ${JSON.stringify(msgs.data)}`)
  }

  // ── 5. 메시지 쓰기 권한 (테스트 메시지 후 삭제) ──
  console.log('\n✍️ 메시지 쓰기')
  if (OPS_DASHBOARD) {
    const sent = await api('POST', `/channels/${OPS_DASHBOARD}/messages`, {
      content: '🧪 통합 테스트 메시지 (자동 삭제됩니다)',
    })
    test('메시지 전송', sent.ok)

    if (sent.ok) {
      // 삭제
      const del = await api('DELETE', `/channels/${OPS_DASHBOARD}/messages/${sent.data.id}`)
      test('메시지 삭제', del.ok || del.status === 204)
    }
  }

  // ── 6. 스레드 생성 권한 ──
  console.log('\n🧵 스레드 생성')
  if (OPS_DASHBOARD) {
    const testMsg = await api('POST', `/channels/${OPS_DASHBOARD}/messages`, {
      content: '🧪 스레드 테스트 (자동 삭제)',
    })
    if (testMsg.ok) {
      const thread = await api('POST', `/channels/${OPS_DASHBOARD}/messages/${testMsg.data.id}/threads`, {
        name: '테스트 스레드',
        auto_archive_duration: 60,
      })
      test('스레드 생성', thread.ok, thread.ok ? '' : JSON.stringify(thread.data))

      // 정리: 스레드 메시지 삭제 → 스레드도 같이 삭제됨
      if (testMsg.ok) {
        await api('DELETE', `/channels/${OPS_DASHBOARD}/messages/${testMsg.data.id}`)
      }
    }
  }

  // ── 7. 포럼 스레드 생성 권한 ──
  console.log('\n📋 포럼 스레드')
  if (CHECKIN_FORUM) {
    const forum = await api('GET', `/channels/${CHECKIN_FORUM}`)
    test('체크인 포럼 타입', forum.ok && forum.data.type === 15, `type: ${forum.data?.type} (15=Forum)`)
    // 포럼에 실제 스레드를 만들면 지울 수 없으므로 타입만 확인
  }

  // ── 8. DM 권한 (봇 자신에게) ──
  console.log('\n💬 DM 권한')
  if (me.ok) {
    const dmCh = await api('POST', '/users/@me/channels', {
      recipient_id: me.data.id,
    })
    // 봇이 자기 자신에게 DM 채널을 열 수 없으면 정상 (400 예상)
    // 다른 유저에게는 가능 — 권한 자체는 확인
    test('DM 채널 열기 API 호출', dmCh.status !== 401 && dmCh.status !== 403, `status: ${dmCh.status}`)
  }

  // ── 9. 리액션 읽기 권한 ──
  console.log('\n👍 리액션 읽기')
  if (OPS_DASHBOARD) {
    const msgs = await api('GET', `/channels/${OPS_DASHBOARD}/messages?limit=1`)
    if (msgs.ok && msgs.data.length > 0) {
      const msgId = msgs.data[0].id
      const reactions = await api('GET', `/channels/${OPS_DASHBOARD}/messages/${msgId}/reactions/${encodeURIComponent('👍')}`)
      // 리액션이 없어도 빈 배열로 200 반환되면 권한 OK
      test('리액션 조회', reactions.ok || reactions.status === 200, `status: ${reactions.status}`)
    } else {
      test('리액션 조회', false, '메시지 없음 — 스킵')
    }
  }

  // ── 결과 ──
  console.log('\n══════════════════════════════════════════')
  console.log(`  결과: ✅ ${passed} 통과 / ❌ ${failed} 실패`)
  console.log('══════════════════════════════════════════\n')

  if (failed > 0) {
    console.log('⚠️ 실패 항목을 확인하세요:')
    console.log('   - 봇에 필요한 권한: Send Messages, Create Public Threads,')
    console.log('     Read Message History, Add Reactions, Manage Messages')
    console.log('   - 서버 설정 > 역할 > 봇 역할 > 권한 확인')
  }
}

run().catch(console.error)
