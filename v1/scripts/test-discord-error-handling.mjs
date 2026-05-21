/**
 * Discord 알림 & 에러 핸들링 통합 테스트
 *
 * 실행: node scripts/test-discord-error-handling.mjs
 */

const DISCORD_API = 'https://discord.com/api/v10'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const WEBHOOK_TIMEOUT = 5000

// ── 헬퍼 ──

async function discordFetch(path, options) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    signal: AbortSignal.timeout(10000),
  })
  return res
}

async function sendWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Draft Test', ...payload }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT),
    })
    return { ok: res.ok, status: res.status }
  } catch (error) {
    return { ok: false, status: 0, error: error.message }
  }
}

// ── 테스트 ──

const results = []
function test(name, passed, detail = '') {
  results.push({ name, passed, detail })
  const icon = passed ? '✅' : '��'
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`)
}

console.log('\n=== Discord 에러 핸들링 테스트 ===\n')

// 1. 봇 토큰 유효성
console.log('── 1. 봇 토큰 검증 ──')
{
  if (!BOT_TOKEN) {
    test('BOT_TOKEN 존재', false, 'DISCORD_BOT_TOKEN 없음')
  } else {
    test('BOT_TOKEN 존재', true)
    const res = await discordFetch('/users/@me')
    const ok = res.status === 200
    const data = ok ? await res.json() : null
    test('봇 토큰 유효', ok, ok ? `Bot: ${data.username}#${data.discriminator}` : `Status: ${res.status}`)
  }
}

// 2. 잘못된 토큰으로 API 호출
console.log('\n── 2. ��못된 토큰 에러 핸들링 ──')
{
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: 'Bot INVALID_TOKEN_12345' },
    signal: AbortSignal.timeout(10000),
  })
  test('잘못된 토큰 → 401 반환', res.status === 401, `Status: ${res.status}`)
}

// 3. 존재하지 않는 길드 접근
console.log('\n── 3. 잘못된 리소스 에러 핸들링 ──')
{
  const res = await discordFetch('/guilds/000000000000000000')
  test('존재하지 않는 길드 → 404', res.status === 404, `Status: ${res.status}`)
}

// 4. 존재하지 않는 채널에 메시지 전송
{
  const res = await discordFetch('/channels/000000000000000000/messages', {
    method: 'POST',
    body: JSON.stringify({ content: 'test' }),
  })
  test('존재하지 않는 채널 → 404', res.status === 404, `Status: ${res.status}`)
}

// 5. 웹훅 에러 핸들링
console.log('\n── 4. 웹훅 에러 핸들링 ──')
{
  // 잘못된 URL
  const r1 = await sendWebhook('https://discord.com/api/webhooks/invalid/invalid', {
    content: 'test',
  })
  test('잘못된 웹훅 URL → 실패 반환', !r1.ok, `Status: ${r1.status}`)

  // 완전히 잘못된 도메인
  const r2 = await sendWebhook('https://nonexistent-domain-12345.com/webhook', {
    content: 'test',
  })
  test('존재하지 않는 도메인 → 에러 캐치', !r2.ok, r2.error || `Status: ${r2.status}`)

  // 빈 URL
  const r3 = await sendWebhook('', { content: 'test' })
  test('빈 URL → 에러 캐치', !r3.ok, r3.error || `Status: ${r3.status}`)
}

// 6. RPC 에러 핸들링 (초대코드)
console.log('\n── 5. RPC 에러 케이스 ──')
{
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_KEY) {
    test('Supabase 환경변수', false, 'URL 또는 SERVICE_KEY 없음')
  } else {
    test('Supabase 환경변수', true)

    async function callRpc(fn, params) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      const data = await res.json().catch(() => null)
      return { status: res.status, data }
    }

    // 존재하지 않는 코드
    const r1 = await callRpc('redeem_invite_code', {
      p_code: 'NONEXISTENT-CODE-XYZ',
      p_user_id: '00000000-0000-0000-0000-000000000001',
    })
    test('존재하지 않는 초대코드 → 에러', r1.status !== 200, `Status: ${r1.status}`)

    // 존재하지 않는 코드 미리보기
    const r2 = await callRpc('preview_invite_code', {
      p_code: 'NONEXISTENT-CODE-XYZ',
    })
    test('존재하지 않는 코드 preview → 에러', r2.status !== 200, `Status: ${r2.status}`)
  }
}

// 7. DM 전송 테스트 (봇이 DM 권한 없는 유저)
console.log('\n── 6. DM 에러 핸들링 ──')
{
  // 존재하지 않는 유저에게 DM 채널 생성 시도
  const res = await discordFetch('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: '000000000000000000' }),
  })
  test('존재하지 않는 유저 DM → 에러', res.status !== 200, `Status: ${res.status}`)
}

// 8. Promise.allSettled 패턴 검증
console.log('\n── 7. Promise.allSettled 복합 실패 ──')
{
  const webhookResults = await Promise.allSettled([
    sendWebhook('https://discord.com/api/webhooks/invalid/1', { content: 'a' }),
    sendWebhook('https://nonexistent-domain-xyz.com/hook', { content: 'b' }),
    sendWebhook('https://discord.com/api/webhooks/invalid/2', { content: 'c' }),
  ])

  const allSettled = webhookResults.every(r => r.status === 'fulfilled')
  test('3개 실패 웹훅 → Promise.allSettled 전부 fulfilled', allSettled,
    `결과: ${webhookResults.map(r => r.status).join(', ')}`)

  const allFailed = webhookResults.every(r => r.status === 'fulfilled' && !r.value.ok)
  test('3개 모두 ok=false 반환', allFailed)
}

// ── 결과 요약 ──
console.log('\n=== 결과 요약 ===')
const passed = results.filter(r => r.passed).length
const total = results.length
console.log(`${passed}/${total} 통과\n`)

if (passed < total) {
  console.log('실패 항목:')
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`))
}

process.exit(passed === total ? 0 : 1)
