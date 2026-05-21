import { test, expect } from '@playwright/test'

test.describe('Auth redirects', () => {
  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    // 미들웨어가 세션 없을 때 /dashboard → /login 보낼 거라 예상.
    // 실제 redirect 타겟이 바뀌면 여기 갱신 필요.
    const response = await page.goto('/dashboard')
    expect(response?.ok()).toBeTruthy()

    // 최종 URL 이 /login 이거나 / 로 떨어지는지
    await page.waitForLoadState('networkidle')
    const finalUrl = page.url()
    expect(finalUrl).toMatch(/\/(login|$)/)
  })

  test('unauthenticated /explore is accessible (public)', async ({ page }) => {
    // Explore 는 비로그인도 공개 프로필 볼 수 있어야 함.
    // "500" 같은 느슨한 substring 체크는 유저 수치에도 걸리므로, Next.js 에러 바운더리가
    // 뿌리는 구체적 문구로 판정.
    const response = await page.goto('/explore')
    expect(response?.ok()).toBeTruthy()

    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body).not.toContain('Application error')
    expect(body).not.toContain('Internal Server Error')
    expect(body).not.toContain('A server-side exception')
  })
})
