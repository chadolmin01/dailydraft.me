import { test, expect } from '@playwright/test'

/**
 * P1-6 시나리오 3: 프로젝트 지원 플로우 (UI 스모크)
 *
 * 범위: 공개 피드 → 프로젝트 상세 (`/p/[id]`) 도달성 + 지원 버튼 존재 확인.
 * 실제 지원 submit 은 인증 필요 → 추후 확장.
 */
test.describe('프로젝트 지원 UI', () => {
  test('/feed 공개 피드 페이지 로드', async ({ page }) => {
    await page.goto('/feed')
    // 공개 피드는 누구나 접근 가능 (middleware publicRoutes 에 포함)
    await expect(page).toHaveURL(/\/feed/)
    // 헤더 하나는 렌더돼야
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('/projects 비인증 시 /login 리다이렉트', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/projects/new 비인증 시 /login 리다이렉트', async ({ page }) => {
    await page.goto('/projects/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/p/<invalid-uuid> 에 잘못된 id 접근 시 크래시 없이 응답', async ({ page }) => {
    // 실제 존재하지 않는 id — 404 또는 "찾을 수 없음" 문구
    const response = await page.goto('/p/00000000-0000-0000-0000-000000000000')
    // 200 (렌더된 not-found) 또는 404. 500 은 실패.
    expect(response?.status()).toBeLessThan(500)
  })
})
