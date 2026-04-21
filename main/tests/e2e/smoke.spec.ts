import { test, expect, request as apiRequest } from '@playwright/test'

/**
 * 프로덕션 회귀 방지용 스모크 테스트.
 *
 * 의도:
 *   - Meta 심사관이 /legal/* /api/oauth/threads/* 를 건드릴 때 최소한 500 안 터지도록.
 *   - 핵심 공개 라우트가 200 으로 렌더되고, 인증 API 는 적절한 4xx 를 돌려주는지 확인.
 *   - 전체 E2E 커버리지는 `signup-flow.spec.ts` 등 다른 스펙 담당. 여기선 "회귀 감지"만.
 *
 * 실행:
 *   - 로컬 dev 서버가 떠 있을 때: `pnpm e2e:smoke`
 *   - 프로덕션 대상:             `pnpm e2e:smoke:prod`
 *
 * 실패 시: tests/e2e/README.md "자주 실패하는 5가지" 섹션 참고.
 */

test.describe('Smoke: 공개 페이지 렌더', () => {
  test('랜딩 페이지 200 + CTA 노출', async ({ page }) => {
    const response = await page.goto('/')
    // 302 도 final 200 이면 OK. goto 는 최종 응답을 반환.
    expect(response?.status(), 'landing final status').toBe(200)

    // "Draft" 텍스트는 footer/nav 등 어디엔가 반드시 존재
    await expect(page.getByText(/Draft/i).first()).toBeVisible()

    // CTA — 랜딩의 "무료로 시작하기" 는 landing.spec.ts 가 엄격히 체크하니
    // 여기선 "로그인 이나 시작" 류 링크가 최소 하나 있는지만 확인 (카피 변경 회귀 방지).
    const hasCta =
      (await page.getByRole('link', { name: /무료로 시작|로그인|시작하기/ }).count()) > 0
    expect(hasCta, 'landing must expose at least one CTA link').toBe(true)
  })

  test('로그인 페이지 200 + email/password input', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status(), 'login final status').toBe(200)

    // type=email / type=password 가 실제 렌더되는지. accessible name 이 바뀌어도 input type 은 안 바뀜.
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('공개 피드 200 (빈 상태 허용)', async ({ page }) => {
    const response = await page.goto('/feed')
    expect(response?.status(), 'feed final status').toBe(200)
    // h1 이 있든 없든 page body 는 렌더돼야 함
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Smoke: 법적 페이지 (Meta 심사용)', () => {
  const legalRoutes = [
    { path: '/legal/privacy', name: '개인정보처리방침' },
    { path: '/legal/terms', name: '서비스 이용약관' },
    { path: '/legal/data-deletion', name: '데이터 삭제 요청' },
  ]

  for (const { path, name } of legalRoutes) {
    test(`${path} 200 + h1 존재`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status(), `${path} status`).toBe(200)
      // h1 이 1개 이상 존재. 정확한 텍스트 매칭은 안 함 — 카피 개정 여지.
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      // 페이지 이름 자체가 본문 어딘가에 노출돼야 Meta 심사관이 알아봄.
      await expect(page.getByText(name).first()).toBeVisible()
    })
  }
})

test.describe('Smoke: API 엔드포인트', () => {
  test('GET /api/health 200 + status ok|degraded', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status(), '/api/health status').toBe(200)

    const body = await response.json()
    expect(['ok', 'degraded'], `health.status = ${body.status}`).toContain(body.status)
    // 기본 필드 존재 확인 — Status Page 파싱 호환성.
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('checks')
  })

  test('GET /api/oauth/threads/start 비로그인 시 401 또는 429', async ({ request }) => {
    // 왜 401 || 429: start 는 rate limit 를 먼저 통과하고 그 다음 auth 검증.
    // 연속 호출이 rate limit 에 먼저 걸릴 수 있어 두 코드 모두 정상 동작으로 간주.
    // 500/200 이 오면 회귀.
    const response = await request.get(
      '/api/oauth/threads/start?persona_id=test',
      { maxRedirects: 0 },
    )
    expect([401, 429], `start status = ${response.status()}`).toContain(response.status())
  })

  test('POST /api/oauth/threads/data-deletion 빈 body 시 400', async ({ request }) => {
    // Meta 웹훅은 signed_request 를 필수로 요구. 미설정 시 400 이어야 retry 루프 아님.
    const response = await request.post('/api/oauth/threads/data-deletion', {
      data: {},
      headers: { 'content-type': 'application/json' },
    })
    expect(response.status(), 'data-deletion empty body').toBe(400)
  })

  test('POST /api/oauth/threads/deauthorize 빈 body 시 400', async ({ request }) => {
    const response = await request.post('/api/oauth/threads/deauthorize', {
      data: {},
      headers: { 'content-type': 'application/json' },
    })
    expect(response.status(), 'deauthorize empty body').toBe(400)
  })
})
