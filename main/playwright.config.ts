import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 설정 — E2E 테스트 기본 뼈대.
 *
 * 개발: `npm run test:e2e` 로 로컬 dev 서버 (:3000) 실행 중일 때 수행.
 * CI: GitHub Actions 에서 별도 webServer 실행 후 수행 (향후 추가).
 *
 * 지금 수준은 "스모크" 레벨 — 랜딩/로그인 리다이렉트 작동 확인.
 * 향후 가입→온보딩→클럽 생성→주간 업데이트 end-to-end 추가 예정.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // webServer 설정은 의도적으로 생략 — 로컬에선 이미 `npm run dev` 띄워서 쓰기,
  // CI 에선 workflow 에서 백그라운드 빌드/start 후 playwright 실행하는 게 더 견고함.
})
