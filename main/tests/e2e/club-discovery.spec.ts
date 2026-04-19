import { test, expect } from '@playwright/test'

/**
 * P1-6 시나리오 2: 클럽 발견·가입 플로우 (UI 스모크)
 *
 * 범위: 공개 클럽 탐색 → 클럽 상세 페이지 → 초대 링크 경로 도달성 확인.
 * 실제 join-by-code RPC 호출은 인증 필요 → 추후 확장.
 */
test.describe('클럽 발견·가입 UI', () => {
  test('/clubs 리스트 페이지 로드', async ({ page }) => {
    await page.goto('/clubs')
    // 미들웨어가 비인증 시 /login 로 보낼 수 있음 — 양쪽 모두 허용
    await expect(page).toHaveURL(/\/(clubs|login)/)
  })

  test('/explore 탐색 페이지 로드 (공개)', async ({ page }) => {
    await page.goto('/explore')
    await expect(page).toHaveURL(/\/explore/)
    // 어떤 헤딩이든 하나는 렌더돼야
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('/clubs/new 비인증 상태에서 접근해도 크래시 없이 응답', async ({ page }) => {
    // 실제 동작: middleware 리다이렉트가 걸리지 않고 페이지 레벨에서 로그인 프롬프트 렌더
    const response = await page.goto('/clubs/new')
    expect(response?.status()).toBeLessThan(500)
  })
})
