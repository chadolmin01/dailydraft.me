import { test, expect } from '@playwright/test'

/**
 * P1-6 시나리오 1: 회원가입 흐름 (UI 스모크)
 *
 * 범위: 비인증 상태에서 /login 접근 → 로그인 옵션 노출 → /onboarding 접근 차단 확인 →
 *       온보딩 페이지(비인증) 리다이렉트 동작.
 *
 * 실제 OAuth 자동화는 테스트 계정 준비가 필요해 지금은 UI 도달성까지만 검증.
 * 완전한 signup E2E 는 별도 Supabase test project + storageState 사전 설정 시 추가.
 */
test.describe('회원가입 흐름 (UI 도달성)', () => {
  test('/login 페이지 로드 및 필수 CTA 노출', async ({ page }) => {
    await page.goto('/login')

    // 로그인 관련 UI 요소가 최소한 하나 이상 렌더돼야 함
    // (Discord/Google/Email 중 어느 것이든)
    const loginOptions = page.locator('button, a').filter({
      hasText: /로그인|Discord|Google|Email|이메일/i,
    })
    await expect(loginOptions.first()).toBeVisible()
  })

  test('비인증 유저가 /onboarding 접근 시 /login 으로 리다이렉트', async ({ page }) => {
    const response = await page.goto('/onboarding')
    // middleware 가 /login 으로 리다이렉트 → URL 확인
    await expect(page).toHaveURL(/\/login/)
    // 응답 자체는 200 (리다이렉트 목적지가 200)
    expect(response?.status()).toBeLessThan(400)
  })

  test('/privacy + /terms 법적 문서 공개 접근 가능', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: '개인정보처리방침' })).toBeVisible()

    await page.goto('/terms')
    await expect(page.getByRole('heading', { name: '서비스 이용약관' })).toBeVisible()
  })

  test('/status 시스템 상태 페이지 공개 접근 가능', async ({ page }) => {
    await page.goto('/status')
    await expect(page.getByRole('heading', { name: '시스템 상태' })).toBeVisible()
  })
})
